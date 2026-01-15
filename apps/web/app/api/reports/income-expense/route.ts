import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 수입지출 보고서
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다',
          },
        },
        { status: 401 }
      );
    }

    const tenantId = (session as any).tenantId;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TENANT',
            message: '조직을 먼저 생성해주세요',
          },
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get all transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Separate by type
    const incomeTransactions = transactions.filter((t) => t.type === 'INCOME');
    const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');

    // Group by account
    const incomeByAccount: Record<string, { account: any; amount: number; count: number }> = {};
    const expenseByAccount: Record<string, { account: any; amount: number; count: number }> = {};

    incomeTransactions.forEach((t) => {
      const accountId = t.accountId;
      if (!incomeByAccount[accountId]) {
        incomeByAccount[accountId] = {
          account: t.account,
          amount: 0,
          count: 0,
        };
      }
      incomeByAccount[accountId].amount += Number(t.amount);
      incomeByAccount[accountId].count += 1;
    });

    expenseTransactions.forEach((t) => {
      const accountId = t.accountId;
      if (!expenseByAccount[accountId]) {
        expenseByAccount[accountId] = {
          account: t.account,
          amount: 0,
          count: 0,
        };
      }
      expenseByAccount[accountId].amount += Number(t.amount);
      expenseByAccount[accountId].count += 1;
    });

    // Calculate totals
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    // Group by month for trend
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const monthKey = t.date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') {
        monthlyData[monthKey].income += Number(t.amount);
      } else if (t.type === 'EXPENSE') {
        monthlyData[monthKey].expense += Number(t.amount);
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        balance: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          balance,
          incomeCount: incomeTransactions.length,
          expenseCount: expenseTransactions.length,
        },
        income: Object.values(incomeByAccount).sort((a, b) => b.amount - a.amount),
        expense: Object.values(expenseByAccount).sort((a, b) => b.amount - a.amount),
        monthlyTrend,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Get income-expense report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 계정과목별 보고서
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
    const accountType = searchParams.get('type'); // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

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

    // Get all accounts
    const accountWhere: any = { tenantId };
    if (accountType) {
      accountWhere.type = accountType;
    }

    const accounts = await prisma.account.findMany({
      where: accountWhere,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    // Get transactions for each account
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        accountId: true,
        type: true,
        amount: true,
        date: true,
      },
    });

    // Aggregate by account
    const accountData: Record<string, {
      income: number;
      expense: number;
      transfer: number;
      count: number;
      monthlyData: Record<string, { income: number; expense: number }>;
    }> = {};

    accounts.forEach((account) => {
      accountData[account.id] = {
        income: 0,
        expense: 0,
        transfer: 0,
        count: 0,
        monthlyData: {},
      };
    });

    transactions.forEach((t) => {
      if (accountData[t.accountId]) {
        const data = accountData[t.accountId];
        const amount = Number(t.amount);

        if (t.type === 'INCOME') {
          data.income += amount;
        } else if (t.type === 'EXPENSE') {
          data.expense += amount;
        } else if (t.type === 'TRANSFER') {
          data.transfer += amount;
        }
        data.count += 1;

        // Monthly aggregation
        const monthKey = t.date.toISOString().slice(0, 7);
        if (!data.monthlyData[monthKey]) {
          data.monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') {
          data.monthlyData[monthKey].income += amount;
        } else if (t.type === 'EXPENSE') {
          data.monthlyData[monthKey].expense += amount;
        }
      }
    });

    // Build result
    const accountReports = accounts.map((account) => {
      const data = accountData[account.id];
      return {
        account: {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
        },
        income: data.income,
        expense: data.expense,
        transfer: data.transfer,
        net: data.income - data.expense,
        transactionCount: data.count,
        monthlyTrend: Object.entries(data.monthlyData)
          .map(([month, monthData]) => ({
            month,
            ...monthData,
          }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      };
    });

    // Group by account type
    const byType: Record<string, { accounts: typeof accountReports; totalIncome: number; totalExpense: number }> = {};
    accountReports.forEach((report) => {
      const type = report.account.type;
      if (!byType[type]) {
        byType[type] = { accounts: [], totalIncome: 0, totalExpense: 0 };
      }
      byType[type].accounts.push(report);
      byType[type].totalIncome += report.income;
      byType[type].totalExpense += report.expense;
    });

    // Calculate totals
    const totalIncome = accountReports.reduce((sum, r) => sum + r.income, 0);
    const totalExpense = accountReports.reduce((sum, r) => sum + r.expense, 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAccounts: accounts.length,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
        },
        accounts: accountReports.filter((r) => r.transactionCount > 0),
        byType: Object.entries(byType).map(([type, data]) => ({
          type,
          totalIncome: data.totalIncome,
          totalExpense: data.totalExpense,
          net: data.totalIncome - data.totalExpense,
          accountCount: data.accounts.filter((a) => a.transactionCount > 0).length,
        })),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Get account report error:', error);
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

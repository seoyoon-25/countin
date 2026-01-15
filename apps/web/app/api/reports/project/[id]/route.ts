import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 프로젝트별 보고서
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get project info
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '프로젝트를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

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

    // Get project transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        projectId,
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
        fundSource: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get project budget if exists
    const budget = await prisma.budget.findFirst({
      where: {
        tenantId,
        projectId,
        year: new Date().getFullYear(),
      },
      include: {
        items: true,
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Budget vs actual
    const budgetAmount = budget?.items.reduce((sum, item) => sum + Number(item.plannedAmount), 0) || 0;
    const budgetIncome = budget?.items
      .filter((item) => item.category.toUpperCase().includes('INCOME') || item.category.includes('수입'))
      .reduce((sum, item) => sum + Number(item.plannedAmount), 0) || 0;
    const budgetExpense = budget?.items
      .filter((item) => item.category.toUpperCase().includes('EXPENSE') || item.category.includes('지출'))
      .reduce((sum, item) => sum + Number(item.plannedAmount), 0) || 0;

    // Group by month for trend
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const monthKey = t.date.toISOString().slice(0, 7);
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
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by account
    const byAccount: Record<string, { account: any; income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const accountId = t.accountId;
      if (!byAccount[accountId]) {
        byAccount[accountId] = {
          account: t.account,
          income: 0,
          expense: 0,
        };
      }
      if (t.type === 'INCOME') {
        byAccount[accountId].income += Number(t.amount);
      } else if (t.type === 'EXPENSE') {
        byAccount[accountId].expense += Number(t.amount);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
        },
        summary: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount: transactions.length,
        },
        budget: budget
          ? {
              id: budget.id,
              name: budget.name,
              totalPlanned: budgetAmount,
              plannedIncome: budgetIncome,
              plannedExpense: budgetExpense,
              incomeExecutionRate: budgetIncome > 0 ? Math.round((totalIncome / budgetIncome) * 100) : 0,
              expenseExecutionRate: budgetExpense > 0 ? Math.round((totalExpense / budgetExpense) * 100) : 0,
            }
          : null,
        byAccount: Object.values(byAccount),
        monthlyTrend,
        recentTransactions: transactions.slice(0, 10).map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Get project report error:', error);
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

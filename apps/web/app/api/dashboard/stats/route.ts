import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

export async function GET() {
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

    // Get current month range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get previous month range
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    // Get previous month transactions
    const prevMonthTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    // Calculate current month stats
    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentExpense = currentMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate previous month stats
    const prevIncome = prevMonthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevExpense = prevMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate change percentages
    const incomeChange = prevIncome > 0
      ? ((currentIncome - prevIncome) / prevIncome) * 100
      : currentIncome > 0 ? 100 : 0;

    const expenseChange = prevExpense > 0
      ? ((currentExpense - prevExpense) / prevExpense) * 100
      : currentExpense > 0 ? 100 : 0;

    // Get total balance (all time income - expense)
    const allTransactions = await prisma.transaction.findMany({
      where: { tenantId },
      select: {
        type: true,
        amount: true,
      },
    });

    const totalIncome = allTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = allTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Get previous month balance for change calculation
    const prevBalance = totalIncome - currentIncome - (totalExpense - currentExpense);
    const balanceChange = prevBalance !== 0
      ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100
      : balance > 0 ? 100 : 0;

    // Get active projects count
    const activeProjectsCount = await prisma.project.count({
      where: {
        tenantId,
        status: { in: ['PLANNING', 'ACTIVE'] },
      },
    });

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        income: {
          amount: currentIncome,
          change: Math.round(incomeChange * 10) / 10,
        },
        expense: {
          amount: currentExpense,
          change: Math.round(expenseChange * 10) / 10,
        },
        balance: {
          amount: balance,
          change: Math.round(balanceChange * 10) / 10,
        },
        activeProjects: activeProjectsCount,
        recentTransactions: recentTransactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
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

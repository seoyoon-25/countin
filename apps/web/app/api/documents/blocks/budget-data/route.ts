import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 예산 데이터 불러오기
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    const tenantId = (session as any).tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TENANT', message: '조직을 먼저 생성해주세요' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'budgetId가 필요합니다' } },
        { status: 400 }
      );
    }

    // Fetch budget with items
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
      include: {
        items: {
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
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '예산을 찾을 수 없습니다' } },
        { status: 404 }
      );
    }

    // Fetch actual execution amounts from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(`${budget.year}-01-01`),
          lte: new Date(`${budget.year}-12-31`),
        },
      },
      select: {
        accountId: true,
        type: true,
        amount: true,
      },
    });

    // Calculate execution by account
    const executionByAccount: Record<string, number> = {};
    transactions.forEach((t) => {
      if (!executionByAccount[t.accountId]) {
        executionByAccount[t.accountId] = 0;
      }
      executionByAccount[t.accountId] += Number(t.amount);
    });

    // Separate income and expense items
    const incomeItems = budget.items
      .filter((item) => item.account?.type === 'INCOME')
      .map((item) => ({
        id: item.id,
        accountId: item.accountId,
        name: item.account ? `${item.account.code} ${item.account.name}` : (item.accountId || '미분류'),
        calculation: '',
        amount: Number(item.plannedAmount),
        executedAmount: item.accountId ? (executionByAccount[item.accountId] || 0) : 0,
        note: '',
      }));

    const expenseItems = budget.items
      .filter((item) => item.account?.type === 'EXPENSE')
      .map((item) => ({
        id: item.id,
        accountId: item.accountId,
        name: item.account ? `${item.account.code} ${item.account.name}` : (item.accountId || '미분류'),
        calculation: '',
        amount: Number(item.plannedAmount),
        executedAmount: item.accountId ? (executionByAccount[item.accountId] || 0) : 0,
        note: '',
      }));

    // If no items categorized, use all items as expense
    if (incomeItems.length === 0 && expenseItems.length === 0) {
      budget.items.forEach((item) => {
        expenseItems.push({
          id: item.id,
          accountId: item.accountId,
          name: item.account ? `${item.account.code} ${item.account.name}` : (item.accountId || '미분류'),
          calculation: '',
          amount: Number(item.plannedAmount),
          executedAmount: item.accountId ? (executionByAccount[item.accountId] || 0) : 0,
          note: '',
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        budgetName: budget.name,
        budgetYear: budget.year,
        incomeItems: incomeItems.length > 0 ? incomeItems : [{ id: '1', name: '', calculation: '', amount: 0, note: '' }],
        expenseItems: expenseItems.length > 0 ? expenseItems : [{ id: '1', name: '', calculation: '', amount: 0, note: '' }],
      },
    });
  } catch (error) {
    console.error('Get budget data error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

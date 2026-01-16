import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 정산 데이터 불러오기
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
    const projectId = searchParams.get('projectId');
    const fundSourceId = searchParams.get('fundSourceId');

    if (!projectId && !fundSourceId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'projectId 또는 fundSourceId가 필요합니다' } },
        { status: 400 }
      );
    }

    // Build transaction filter
    const transactionWhere: any = { tenantId };
    if (projectId) transactionWhere.projectId = projectId;
    if (fundSourceId) transactionWhere.fundSourceId = fundSourceId;

    // Get project/fund source info
    let sourceName = '';
    let budgetAmount = 0;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, tenantId },
      });
      if (project) {
        sourceName = project.name;
        budgetAmount = Number(project.budgetAmount || 0);
      }
    }

    if (fundSourceId) {
      const fundSource = await prisma.fundSource.findFirst({
        where: { id: fundSourceId, tenantId },
      });
      if (fundSource) {
        sourceName = fundSource.name;
        budgetAmount = Number(fundSource.amount);
      }
    }

    // Fetch transactions grouped by account
    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Group by account
    const accountData: Record<string, { name: string; amount: number }> = {};
    transactions.forEach((t) => {
      const key = t.accountId;
      if (!accountData[key]) {
        accountData[key] = {
          name: `${t.account.code} ${t.account.name}`,
          amount: 0,
        };
      }
      accountData[key].amount += Number(t.amount);
    });

    // If we have budget items for this project/fund source, try to match
    let budgetItems: any[] = [];

    // Try to find a budget for this project
    if (projectId) {
      const projectBudgets = await prisma.budget.findMany({
        where: { tenantId, projectId },
        include: {
          items: {
            include: {
              account: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
        orderBy: { year: 'desc' },
        take: 1,
      });

      if (projectBudgets[0]) {
        budgetItems = projectBudgets[0].items;
      }
    }

    // Create settlement items
    let items;
    if (budgetItems.length > 0) {
      // If we have budget items, use them as the base
      items = budgetItems.map((item) => ({
        id: item.id,
        name: item.account ? `${item.account.code} ${item.account.name}` : '항목',
        budgetAmount: Number(item.plannedAmount),
        executedAmount: item.accountId ? (accountData[item.accountId]?.amount || 0) : 0,
        note: '',
      }));
    } else {
      // Otherwise, use actual transactions as items
      items = Object.entries(accountData).map(([accountId, data]) => ({
        id: accountId,
        name: data.name,
        budgetAmount: 0, // No budget info
        executedAmount: data.amount,
        note: '',
      }));
    }

    // Ensure at least one item
    if (items.length === 0) {
      items = [{
        id: '1',
        name: '',
        budgetAmount: 0,
        executedAmount: 0,
        note: '',
      }];
    }

    return NextResponse.json({
      success: true,
      data: {
        sourceName,
        totalBudget: budgetAmount,
        items,
      },
    });
  } catch (error) {
    console.error('Get settlement data error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 재원별 보고서
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

    const { id: fundSourceId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get fund source info
    const fundSource = await prisma.fundSource.findFirst({
      where: { id: fundSourceId, tenantId },
    });

    if (!fundSource) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '재원을 찾을 수 없습니다',
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

    // Get fund source transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        fundSourceId,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals (fund source is typically used for expenses)
    const totalUsed = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remainingAmount = Number(fundSource.amount) - Number(fundSource.usedAmount);
    const usageRate = Number(fundSource.amount) > 0
      ? Math.round((Number(fundSource.usedAmount) / Number(fundSource.amount)) * 100)
      : 0;

    // Group by month for trend
    const monthlyData: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === 'EXPENSE') {
        const monthKey = t.date.toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += Number(t.amount);
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month,
        amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Running balance by month
    let runningBalance = Number(fundSource.amount);
    const balanceTrend = monthlyTrend.map((item) => {
      runningBalance -= item.amount;
      return {
        month: item.month,
        used: item.amount,
        balance: runningBalance,
      };
    });

    // Group by project
    const byProject: Record<string, { project: any; amount: number; count: number }> = {};
    transactions.forEach((t) => {
      if (t.type === 'EXPENSE' && t.project) {
        const projectId = t.project.id;
        if (!byProject[projectId]) {
          byProject[projectId] = {
            project: t.project,
            amount: 0,
            count: 0,
          };
        }
        byProject[projectId].amount += Number(t.amount);
        byProject[projectId].count += 1;
      }
    });

    // Group by account
    const byAccount: Record<string, { account: any; amount: number; count: number }> = {};
    transactions.forEach((t) => {
      if (t.type === 'EXPENSE') {
        const accountId = t.accountId;
        if (!byAccount[accountId]) {
          byAccount[accountId] = {
            account: t.account,
            amount: 0,
            count: 0,
          };
        }
        byAccount[accountId].amount += Number(t.amount);
        byAccount[accountId].count += 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fundSource: {
          id: fundSource.id,
          name: fundSource.name,
          type: fundSource.type,
          grantor: fundSource.grantor,
          totalAmount: Number(fundSource.amount),
          usedAmount: Number(fundSource.usedAmount),
          remainingAmount,
          usageRate,
          startDate: fundSource.startDate,
          endDate: fundSource.endDate,
        },
        summary: {
          totalUsedInPeriod: totalUsed,
          transactionCount: transactions.filter((t) => t.type === 'EXPENSE').length,
          averageTransaction: transactions.filter((t) => t.type === 'EXPENSE').length > 0
            ? Math.round(totalUsed / transactions.filter((t) => t.type === 'EXPENSE').length)
            : 0,
        },
        byProject: Object.values(byProject).sort((a, b) => b.amount - a.amount),
        byAccount: Object.values(byAccount).sort((a, b) => b.amount - a.amount),
        monthlyTrend,
        balanceTrend,
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
    console.error('Get fund source report error:', error);
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

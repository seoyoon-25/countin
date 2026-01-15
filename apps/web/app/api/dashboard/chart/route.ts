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

    // Get last 6 months data
    const now = new Date();
    const months: { month: string; year: number; monthNum: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('ko-KR', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
      });
    }

    // Get transactions for the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    });

    // Aggregate by month
    const chartData = months.map(({ month, year, monthNum }) => {
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === monthNum;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month,
        income,
        expense,
      };
    });

    return NextResponse.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Get chart data error:', error);
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

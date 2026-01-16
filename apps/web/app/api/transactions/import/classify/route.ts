import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { classifyTransactions } from '@/lib/bank-parser/classifier';
import { ParsedTransaction } from '@/lib/bank-parser/types';

// POST - Classify transactions with AI
export async function POST(request: Request) {
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

    const body = await request.json();
    const { transactions } = body as { transactions: ParsedTransaction[] };

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TRANSACTIONS', message: '분류할 거래가 없습니다' } },
        { status: 400 }
      );
    }

    // Classify transactions
    const classifiedTransactions = await classifyTransactions(transactions, tenantId);

    // Get accounts, projects, fund sources for dropdown options
    const [accounts, projects, fundSources] = await Promise.all([
      prisma.account.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, code: true, name: true, type: true },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
      }),
      prisma.project.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.fundSource.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Calculate summary
    const summary = {
      totalCount: classifiedTransactions.length,
      incomeCount: classifiedTransactions.filter(t => t.type === 'INCOME').length,
      expenseCount: classifiedTransactions.filter(t => t.type === 'EXPENSE').length,
      highConfidenceCount: classifiedTransactions.filter(t => t.confidence === 'high').length,
      mediumConfidenceCount: classifiedTransactions.filter(t => t.confidence === 'medium').length,
      lowConfidenceCount: classifiedTransactions.filter(t => t.confidence === 'low').length,
      learnedCount: classifiedTransactions.filter(t => t.isLearned).length,
      totalIncome: classifiedTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpense: classifiedTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        transactions: classifiedTransactions,
        summary,
        options: {
          accounts: accounts.map(a => ({
            id: a.id,
            name: `${a.code} ${a.name}`,
            type: a.type,
          })),
          projects,
          fundSources,
        },
      },
    });
  } catch (error) {
    console.error('Classify error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

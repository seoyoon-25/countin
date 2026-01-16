import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { saveClassificationLearning } from '@/lib/bank-parser/classifier';
import { ClassifiedTransaction } from '@/lib/bank-parser/types';

interface ConfirmTransaction extends ClassifiedTransaction {
  selected?: boolean;
}

// POST - Confirm and create transactions
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
    const { transactions, fileName, bankType, saveClassifications } = body as {
      transactions: ConfirmTransaction[];
      fileName: string;
      bankType: string | null;
      saveClassifications: boolean;
    };

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TRANSACTIONS', message: '등록할 거래가 없습니다' } },
        { status: 400 }
      );
    }

    // Filter selected transactions
    const selectedTransactions = transactions.filter(t => t.selected !== false);

    if (selectedTransactions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_SELECTED', message: '선택된 거래가 없습니다' } },
        { status: 400 }
      );
    }

    // Check for duplicates
    const duplicateChecks = await Promise.all(
      selectedTransactions.map(async (t) => {
        const existing = await prisma.transaction.findFirst({
          where: {
            tenantId,
            date: new Date(t.date),
            amount: t.amount,
            description: t.description,
          },
        });
        return { transaction: t, isDuplicate: !!existing };
      })
    );

    const duplicates = duplicateChecks.filter(d => d.isDuplicate);
    const nonDuplicates = duplicateChecks.filter(d => !d.isDuplicate);

    // Create import batch
    const batch = await prisma.transactionImportBatch.create({
      data: {
        tenantId,
        filename: fileName,
        bankType,
        totalCount: selectedTransactions.length,
        status: 'PROCESSING',
      },
    });

    const createdIds: string[] = [];
    const errors: { rowIndex: number; error: string }[] = [];

    // Add duplicate warnings
    duplicates.forEach(d => {
      errors.push({
        rowIndex: d.transaction.rowIndex,
        error: '중복 거래 (동일 날짜, 금액, 적요)',
      });
    });

    // Create transactions
    for (const { transaction } of nonDuplicates) {
      if (!transaction.accountId) {
        errors.push({
          rowIndex: transaction.rowIndex,
          error: '계정과목이 지정되지 않았습니다',
        });
        continue;
      }

      try {
        const created = await prisma.transaction.create({
          data: {
            tenantId,
            date: new Date(transaction.date),
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.accountId,
            projectId: transaction.projectId || undefined,
            fundSourceId: transaction.fundSourceId || undefined,
          },
        });

        createdIds.push(created.id);

        // Save classification for learning
        if (saveClassifications && transaction.description.trim()) {
          await saveClassificationLearning(
            tenantId,
            transaction.description,
            transaction.accountId,
            transaction.projectId,
            transaction.fundSourceId
          );
        }
      } catch (err) {
        errors.push({
          rowIndex: transaction.rowIndex,
          error: err instanceof Error ? err.message : '거래 생성 실패',
        });
      }
    }

    // Update batch
    await prisma.transactionImportBatch.update({
      where: { id: batch.id },
      data: {
        successCount: createdIds.length,
        failedCount: errors.length,
        status: 'COMPLETED',
        transactionIds: JSON.stringify(createdIds),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        totalCount: selectedTransactions.length,
        successCount: createdIds.length,
        failedCount: errors.length - duplicates.length,
        duplicateCount: duplicates.length,
        transactionIds: createdIds,
        errors,
      },
    });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

// DELETE - Undo import batch
export async function DELETE(request: Request) {
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
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAM', message: 'batchId가 필요합니다' } },
        { status: 400 }
      );
    }

    // Get batch
    const batch = await prisma.transactionImportBatch.findFirst({
      where: { id: batchId, tenantId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '가져오기 기록을 찾을 수 없습니다' } },
        { status: 404 }
      );
    }

    // Parse transaction IDs
    const transactionIds: string[] = batch.transactionIds
      ? JSON.parse(batch.transactionIds)
      : [];

    if (transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TRANSACTIONS', message: '되돌릴 거래가 없습니다' } },
        { status: 400 }
      );
    }

    // Delete transactions
    const deleted = await prisma.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        tenantId,
      },
    });

    // Update batch status
    await prisma.transactionImportBatch.update({
      where: { id: batchId },
      data: { status: 'FAILED' }, // Mark as failed/undone
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleted.count,
      },
    });
  } catch (error) {
    console.error('Undo import error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 단일 거래 조회
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
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, tenantId },
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
        fundSource: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '거래를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
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

// PATCH - 거래 수정
const updateTransactionSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: '올바른 날짜 형식이 아닙니다',
    })
    .optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], '유형을 선택해주세요').optional(),
  amount: z.number().positive('금액은 0보다 커야 합니다').optional(),
  description: z.string().min(1, '적요를 입력해주세요').optional(),
  memo: z.string().optional().nullable(),
  accountId: z.string().min(1, '계정과목을 선택해주세요').optional(),
  projectId: z.string().optional().nullable(),
  fundSourceId: z.string().optional().nullable(),
});

export async function PATCH(
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
    const { id } = await params;

    // Verify transaction exists and belongs to tenant
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, tenantId },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '거래를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { date, type, amount, description, memo, accountId, projectId, fundSourceId } =
      parsed.data;

    // Verify account belongs to tenant (if provided)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, tenantId },
      });

      if (!account) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACCOUNT',
              message: '유효하지 않은 계정과목입니다',
            },
          },
          { status: 400 }
        );
      }
    }

    // Verify project belongs to tenant (if provided)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, tenantId },
      });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PROJECT',
              message: '유효하지 않은 프로젝트입니다',
            },
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (date !== undefined) updateData.date = new Date(date);
    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (memo !== undefined) updateData.memo = memo;
    if (accountId !== undefined) updateData.accountId = accountId;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (fundSourceId !== undefined) updateData.fundSourceId = fundSourceId || null;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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
        fundSource: {
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
        ...transaction,
        amount: Number(transaction.amount),
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
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

// DELETE - 거래 삭제
export async function DELETE(
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
    const { id } = await params;

    // Verify transaction exists and belongs to tenant
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, tenantId },
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

    if (!existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '거래를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...existingTransaction,
        amount: Number(existingTransaction.amount),
      },
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
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

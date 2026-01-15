import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 재원 상세 조회
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

    const { id } = await params;

    const fundSource = await prisma.fundSource.findFirst({
      where: { id, tenantId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 50,
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
        },
        _count: {
          select: { transactions: true },
        },
      },
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

    const amount = Number(fundSource.amount);
    const usedAmount = Number(fundSource.usedAmount);
    const remainingAmount = amount - usedAmount;
    const usageRate = amount > 0 ? Math.round((usedAmount / amount) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...fundSource,
        amount,
        usedAmount,
        remainingAmount,
        usageRate,
        transactions: fundSource.transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
    });
  } catch (error) {
    console.error('Get fund source error:', error);
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

// PATCH - 재원 수정
const updateFundSourceSchema = z.object({
  name: z.string().min(1, '재원명을 입력해주세요').optional(),
  type: z.enum(['GOVERNMENT', 'CORPORATE', 'FOUNDATION', 'DONATION', 'SELF', 'OTHER'], '유형을 선택해주세요').optional(),
  grantor: z.string().optional().nullable(),
  amount: z.number().min(0, '금액은 0 이상이어야 합니다').optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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

    const { id } = await params;

    // Check if fund source exists and belongs to tenant
    const existing = await prisma.fundSource.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
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

    const body = await request.json();
    const parsed = updateFundSourceSchema.safeParse(body);

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

    const { name, type, grantor, amount, startDate, endDate, description } = parsed.data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (grantor !== undefined) updateData.grantor = grantor || null;
    if (amount !== undefined) updateData.amount = amount;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (description !== undefined) updateData.description = description || null;

    const fundSource = await prisma.fundSource.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    const fundAmount = Number(fundSource.amount);
    const usedAmount = Number(fundSource.usedAmount);

    return NextResponse.json({
      success: true,
      data: {
        ...fundSource,
        amount: fundAmount,
        usedAmount,
        remainingAmount: fundAmount - usedAmount,
        usageRate: fundAmount > 0 ? Math.round((usedAmount / fundAmount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Update fund source error:', error);
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

// DELETE - 재원 삭제
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

    const { id } = await params;

    // Check if fund source exists and belongs to tenant
    const existing = await prisma.fundSource.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existing) {
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

    // Check if fund source has transactions
    if (existing._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_TRANSACTIONS',
            message: `이 재원에 연결된 거래가 ${existing._count.transactions}건 있습니다. 거래를 먼저 삭제하거나 다른 재원으로 이동해주세요.`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.fundSource.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Delete fund source error:', error);
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

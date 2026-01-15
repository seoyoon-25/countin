import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// POST - 예산 복사
const copyBudgetSchema = z.object({
  name: z.string().min(1, '예산명을 입력해주세요'),
  year: z.number().min(2000).max(2100),
});

export async function POST(
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

    // Find the source budget
    const sourceBudget = await prisma.budget.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!sourceBudget) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '원본 예산을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = copyBudgetSchema.safeParse(body);

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

    const { name, year } = parsed.data;

    // Create new budget with copied items
    const newBudget = await prisma.budget.create({
      data: {
        tenantId,
        name,
        year,
        projectId: sourceBudget.projectId,
        status: 'DRAFT',
        items: {
          create: sourceBudget.items.map((item) => ({
            accountId: item.accountId,
            category: item.category,
            plannedAmount: item.plannedAmount,
            description: item.description,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newBudget,
        items: newBudget.items.map((item) => ({
          ...item,
          plannedAmount: Number(item.plannedAmount),
        })),
      },
    });
  } catch (error) {
    console.error('Copy budget error:', error);
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

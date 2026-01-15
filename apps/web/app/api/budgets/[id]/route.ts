import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 예산 상세 조회
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

    const budget = await prisma.budget.findFirst({
      where: { id, tenantId },
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
                type: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '예산을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Get actual spending for each budget item (based on account)
    const startOfYear = new Date(budget.year, 0, 1);
    const endOfYear = new Date(budget.year, 11, 31, 23, 59, 59, 999);

    // Get all transactions for this year
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
        ...(budget.projectId ? { projectId: budget.projectId } : {}),
      },
      select: {
        accountId: true,
        type: true,
        amount: true,
      },
    });

    // Calculate actual amounts per account
    const actualByAccount: Record<string, number> = {};
    transactions.forEach((t) => {
      if (!actualByAccount[t.accountId]) {
        actualByAccount[t.accountId] = 0;
      }
      actualByAccount[t.accountId] += Number(t.amount);
    });

    // Enrich items with actual amounts
    const itemsWithActual = budget.items.map((item) => {
      const actualAmount = item.accountId ? actualByAccount[item.accountId] || 0 : 0;
      const plannedAmount = Number(item.plannedAmount);
      const difference = plannedAmount - actualAmount;
      const executionRate = plannedAmount > 0 ? Math.round((actualAmount / plannedAmount) * 100) : 0;

      return {
        ...item,
        plannedAmount,
        actualAmount,
        difference,
        executionRate,
      };
    });

    // Calculate totals
    const totalPlanned = itemsWithActual.reduce((sum, item) => sum + item.plannedAmount, 0);
    const totalActual = itemsWithActual.reduce((sum, item) => sum + item.actualAmount, 0);

    // Calculate income/expense totals
    const incomeItems = itemsWithActual.filter((item) =>
      item.category.toUpperCase().includes('INCOME') ||
      item.category.toUpperCase().includes('수입')
    );
    const expenseItems = itemsWithActual.filter((item) =>
      item.category.toUpperCase().includes('EXPENSE') ||
      item.category.toUpperCase().includes('지출')
    );

    return NextResponse.json({
      success: true,
      data: {
        ...budget,
        items: itemsWithActual,
        summary: {
          totalPlanned,
          totalActual,
          totalDifference: totalPlanned - totalActual,
          executionRate: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0,
          income: {
            planned: incomeItems.reduce((sum, item) => sum + item.plannedAmount, 0),
            actual: incomeItems.reduce((sum, item) => sum + item.actualAmount, 0),
          },
          expense: {
            planned: expenseItems.reduce((sum, item) => sum + item.plannedAmount, 0),
            actual: expenseItems.reduce((sum, item) => sum + item.actualAmount, 0),
          },
        },
      },
    });
  } catch (error) {
    console.error('Get budget error:', error);
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

// PATCH - 예산 수정
const budgetItemSchema = z.object({
  id: z.string().optional(), // existing item
  accountId: z.string().optional().nullable(),
  category: z.string().min(1, '카테고리를 입력해주세요'),
  plannedAmount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

const updateBudgetSchema = z.object({
  name: z.string().min(1, '예산명을 입력해주세요').optional(),
  year: z.number().min(2000).max(2100).optional(),
  projectId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'APPROVED', 'ARCHIVED']).optional(),
  items: z.array(budgetItemSchema).optional(),
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

    // Check if budget exists and belongs to tenant
    const existing = await prisma.budget.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '예산을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateBudgetSchema.safeParse(body);

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

    const { name, year, projectId, status, items } = parsed.data;

    // Use transaction to update budget and items atomically
    const budget = await prisma.$transaction(async (tx) => {
      // Update budget
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (year !== undefined) updateData.year = year;
      if (projectId !== undefined) updateData.projectId = projectId || null;
      if (status !== undefined) updateData.status = status;

      await tx.budget.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (items !== undefined) {
        // Get existing item IDs
        const existingItems = await tx.budgetItem.findMany({
          where: { budgetId: id },
          select: { id: true },
        });
        const existingIds = new Set(existingItems.map((i) => i.id));
        const newItemIds = new Set(items.filter((i) => i.id).map((i) => i.id));

        // Delete removed items
        const toDelete = [...existingIds].filter((id) => !newItemIds.has(id));
        if (toDelete.length > 0) {
          await tx.budgetItem.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Update or create items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.id && existingIds.has(item.id)) {
            // Update existing
            await tx.budgetItem.update({
              where: { id: item.id },
              data: {
                accountId: item.accountId || null,
                category: item.category,
                plannedAmount: item.plannedAmount,
                description: item.description || null,
                sortOrder: item.sortOrder ?? i,
              },
            });
          } else {
            // Create new
            await tx.budgetItem.create({
              data: {
                budgetId: id,
                accountId: item.accountId || null,
                category: item.category,
                plannedAmount: item.plannedAmount,
                description: item.description || null,
                sortOrder: item.sortOrder ?? i,
              },
            });
          }
        }
      }

      // Return updated budget with items
      return tx.budget.findFirst({
        where: { id },
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
    });

    return NextResponse.json({
      success: true,
      data: {
        ...budget,
        items: budget?.items.map((item) => ({
          ...item,
          plannedAmount: Number(item.plannedAmount),
        })),
      },
    });
  } catch (error) {
    console.error('Update budget error:', error);
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

// DELETE - 예산 삭제
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

    // Check if budget exists and belongs to tenant
    const existing = await prisma.budget.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '예산을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Delete budget (items will be cascade deleted)
    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Delete budget error:', error);
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

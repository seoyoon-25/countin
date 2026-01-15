import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 예산 목록 조회
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { tenantId };

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search };
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            plannedAmount: true,
            category: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate total for each budget
    const budgetsWithStats = budgets.map((budget) => {
      const totalAmount = budget.items.reduce(
        (sum, item) => sum + Number(item.plannedAmount),
        0
      );
      const incomeItems = budget.items.filter((item) =>
        item.category.toUpperCase().includes('INCOME') ||
        item.category.toUpperCase().includes('수입')
      );
      const expenseItems = budget.items.filter((item) =>
        item.category.toUpperCase().includes('EXPENSE') ||
        item.category.toUpperCase().includes('지출')
      );

      const totalIncome = incomeItems.reduce(
        (sum, item) => sum + Number(item.plannedAmount),
        0
      );
      const totalExpense = expenseItems.reduce(
        (sum, item) => sum + Number(item.plannedAmount),
        0
      );

      return {
        ...budget,
        totalAmount,
        totalIncome,
        totalExpense,
        itemCount: budget.items.length,
        items: undefined, // Remove items from list response
      };
    });

    // Get distinct years for tabs
    const years = await prisma.budget.findMany({
      where: { tenantId },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: budgetsWithStats,
      years: years.map((y) => y.year),
    });
  } catch (error) {
    console.error('Get budgets error:', error);
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

// POST - 예산 생성
const budgetItemSchema = z.object({
  accountId: z.string().optional().nullable(),
  category: z.string().min(1, '카테고리를 입력해주세요'),
  plannedAmount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

const createBudgetSchema = z.object({
  name: z.string().min(1, '예산명을 입력해주세요'),
  year: z.number().min(2000).max(2100),
  projectId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'APPROVED', 'ARCHIVED']).optional(),
  items: z.array(budgetItemSchema).optional(),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = createBudgetSchema.safeParse(body);

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

    const budget = await prisma.budget.create({
      data: {
        tenantId,
        name,
        year,
        projectId: projectId || null,
        status: status || 'DRAFT',
        items: items
          ? {
              create: items.map((item, index) => ({
                accountId: item.accountId || null,
                category: item.category,
                plannedAmount: item.plannedAmount,
                description: item.description || null,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
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
        ...budget,
        items: budget.items.map((item) => ({
          ...item,
          plannedAmount: Number(item.plannedAmount),
        })),
      },
    });
  } catch (error) {
    console.error('Create budget error:', error);
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

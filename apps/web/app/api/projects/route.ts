import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 프로젝트 목록 조회
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
    const status = searchParams.get('status');
    const includeAll = searchParams.get('includeAll') === 'true';

    const where: any = { tenantId };

    if (!includeAll && !status) {
      where.status = { in: ['PLANNING', 'ACTIVE'] };
    } else if (status && status !== 'all') {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    // Calculate spent amount for each project
    const projectsWithStats = projects.map((p) => {
      const income = p.transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = p.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const { transactions, ...projectData } = p;

      return {
        ...projectData,
        budgetAmount: p.budgetAmount ? Number(p.budgetAmount) : 0,
        incomeAmount: income,
        expenseAmount: expense,
        spentAmount: expense,
        remainingAmount: (p.budgetAmount ? Number(p.budgetAmount) : 0) - expense,
        progress: p.budgetAmount && Number(p.budgetAmount) > 0
          ? Math.min(100, Math.round((expense / Number(p.budgetAmount)) * 100))
          : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: projectsWithStats,
    });
  } catch (error) {
    console.error('Get projects error:', error);
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

// POST - 프로젝트 생성
const createProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budgetAmount: z.number().min(0, '예산은 0 이상이어야 합니다').optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
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
    const parsed = createProjectSchema.safeParse(body);

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

    const { name, code, description, startDate, endDate, budgetAmount, status } = parsed.data;

    const project = await prisma.project.create({
      data: {
        tenantId,
        name,
        code: code || null,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budgetAmount: budgetAmount || 0,
        status: status || 'PLANNING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : 0,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
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

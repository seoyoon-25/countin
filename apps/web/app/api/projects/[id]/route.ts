import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 단일 프로젝트 조회 (상세)
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

    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 100,
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

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '프로젝트를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Calculate stats
    const income = project.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = project.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetAmount = project.budgetAmount ? Number(project.budgetAmount) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        budgetAmount,
        incomeAmount: income,
        expenseAmount: expense,
        spentAmount: expense,
        remainingAmount: budgetAmount - expense,
        progress: budgetAmount > 0
          ? Math.min(100, Math.round((expense / budgetAmount) * 100))
          : 0,
        transactions: project.transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
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

// PATCH - 프로젝트 수정
const updateProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요').optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budgetAmount: z.number().min(0, '예산은 0 이상이어야 합니다').optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
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

    // Verify project exists and belongs to tenant
    const existingProject = await prisma.project.findFirst({
      where: { id, tenantId },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '프로젝트를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

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

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code || null;
    if (description !== undefined) updateData.description = description || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (budgetAmount !== undefined) updateData.budgetAmount = budgetAmount || 0;
    if (status !== undefined) updateData.status = status;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : 0,
      },
    });
  } catch (error) {
    console.error('Update project error:', error);
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

// DELETE - 프로젝트 삭제
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

    // Verify project exists and belongs to tenant
    const existingProject = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '프로젝트를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Check if project has transactions
    if (existingProject._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_TRANSACTIONS',
            message: `이 프로젝트에 ${existingProject._count.transactions}건의 거래가 있어 삭제할 수 없습니다. 먼저 거래를 삭제하거나 다른 프로젝트로 이동해주세요.`,
          },
        },
        { status: 400 }
      );
    }

    // Delete the project
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...existingProject,
        budgetAmount: existingProject.budgetAmount ? Number(existingProject.budgetAmount) : 0,
      },
    });
  } catch (error) {
    console.error('Delete project error:', error);
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

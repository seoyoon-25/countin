import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 거래 목록 조회 (필터, 페이지네이션)
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // INCOME, EXPENSE, TRANSFER
    const accountId = searchParams.get('accountId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { memo: { contains: search } },
      ];
    }

    // Get total count and transactions
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
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
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
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

// POST - 거래 생성
const createTransactionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: '올바른 날짜 형식이 아닙니다',
  }),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], '유형을 선택해주세요'),
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  description: z.string().min(1, '적요를 입력해주세요'),
  memo: z.string().optional(),
  accountId: z.string().min(1, '계정과목을 선택해주세요'),
  projectId: z.string().optional().nullable(),
  fundSourceId: z.string().optional().nullable(),
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
    const parsed = createTransactionSchema.safeParse(body);

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

    // Verify account belongs to tenant
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

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        date: new Date(date),
        type,
        amount,
        description,
        memo: memo || null,
        accountId,
        projectId: projectId || null,
        fundSourceId: fundSourceId || null,
      },
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
    console.error('Create transaction error:', error);
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

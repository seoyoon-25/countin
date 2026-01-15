import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 재원 목록 조회
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
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { grantor: { contains: search } },
      ];
    }

    const fundSources = await prisma.fundSource.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each fund source
    const fundSourcesWithStats = fundSources.map((fs) => {
      const amount = Number(fs.amount);
      const usedAmount = Number(fs.usedAmount);
      const remainingAmount = amount - usedAmount;
      const usageRate = amount > 0 ? Math.round((usedAmount / amount) * 100) : 0;

      return {
        ...fs,
        amount,
        usedAmount,
        remainingAmount,
        usageRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: fundSourcesWithStats,
    });
  } catch (error) {
    console.error('Get fund sources error:', error);
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

// POST - 재원 생성
const createFundSourceSchema = z.object({
  name: z.string().min(1, '재원명을 입력해주세요'),
  type: z.enum(['GOVERNMENT', 'CORPORATE', 'FOUNDATION', 'DONATION', 'SELF', 'OTHER'], '유형을 선택해주세요'),
  grantor: z.string().optional().nullable(),
  amount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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
    const parsed = createFundSourceSchema.safeParse(body);

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

    const fundSource = await prisma.fundSource.create({
      data: {
        tenantId,
        name,
        type,
        grantor: grantor || null,
        amount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fundSource,
        amount: Number(fundSource.amount),
        usedAmount: Number(fundSource.usedAmount),
        remainingAmount: Number(fundSource.amount) - Number(fundSource.usedAmount),
        usageRate: 0,
      },
    });
  } catch (error) {
    console.error('Create fund source error:', error);
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

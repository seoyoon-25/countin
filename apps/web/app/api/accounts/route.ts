import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 계정과목 목록 조회
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = { tenantId };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
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

// POST - 계정과목 생성
const createAccountSchema = z.object({
  code: z.string().min(1, '계정코드를 입력해주세요'),
  name: z.string().min(1, '계정명을 입력해주세요'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], '계정유형을 선택해주세요'),
  category: z.string().optional().nullable(),
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
    const parsed = createAccountSchema.safeParse(body);

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

    const { code, name, type, category, description } = parsed.data;

    // Check if code already exists
    const existingAccount = await prisma.account.findFirst({
      where: { tenantId, code },
    });

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: '이미 사용 중인 계정코드입니다',
          },
        },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        tenantId,
        code,
        name,
        type,
        category: category || null,
        description: description || null,
        isSystem: false,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Create account error:', error);
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

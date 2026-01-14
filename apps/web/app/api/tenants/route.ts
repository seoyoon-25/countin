import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(2, '조직명은 2자 이상이어야 합니다'),
  type: z.enum(['NONPROFIT', 'FORPROFIT', 'SOLE_PROPRIETOR', 'SOCIAL_ENTERPRISE']),
  slug: z.string().min(2, 'URL 주소는 2자 이상이어야 합니다').regex(
    /^[a-z0-9가-힣-]+$/,
    'URL 주소는 영문 소문자, 숫자, 한글, 하이픈만 사용 가능합니다'
  ).optional(),
});

// Generate a URL-safe slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

    const body = await request.json();
    const parsed = createTenantSchema.safeParse(body);

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

    const { name, type, slug: providedSlug } = parsed.data;

    // Generate or validate slug
    let slug = providedSlug || generateSlug(name);

    // Check if slug already exists
    const slugExists = await prisma.tenant.findUnique({ where: { slug } });

    if (slugExists) {
      if (providedSlug) {
        // User provided slug already exists
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SLUG_EXISTS',
              message: '이미 사용 중인 URL 주소입니다. 다른 주소를 입력해주세요.',
            },
          },
          { status: 400 }
        );
      }
      // Auto-generated slug exists, add counter
      let counter = 1;
      while (await prisma.tenant.findUnique({ where: { slug: `${slug}-${counter}` } })) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    // Create tenant and associate user as owner
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        type,
        plan: 'FREE',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        users: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    // Create default accounts based on organization type
    await createDefaultAccounts(tenant.id, type);

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
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

// Create default accounts based on organization type
async function createDefaultAccounts(tenantId: string, type: string) {
  const commonAccounts = [
    // Assets
    { code: '101', name: '현금', type: 'ASSET', category: '유동자산', isSystem: true },
    { code: '102', name: '보통예금', type: 'ASSET', category: '유동자산', isSystem: true },
    { code: '103', name: '정기예금', type: 'ASSET', category: '유동자산', isSystem: true },
    { code: '110', name: '미수금', type: 'ASSET', category: '유동자산', isSystem: true },
    { code: '120', name: '선급금', type: 'ASSET', category: '유동자산', isSystem: true },

    // Liabilities
    { code: '201', name: '미지급금', type: 'LIABILITY', category: '유동부채', isSystem: true },
    { code: '202', name: '예수금', type: 'LIABILITY', category: '유동부채', isSystem: true },
    { code: '210', name: '선수금', type: 'LIABILITY', category: '유동부채', isSystem: true },
  ];

  const nonprofitAccounts = [
    // Revenue (Nonprofit specific)
    { code: '401', name: '정부보조금', type: 'REVENUE', category: '사업수익', isSystem: true },
    { code: '402', name: '민간보조금', type: 'REVENUE', category: '사업수익', isSystem: true },
    { code: '403', name: '후원금', type: 'REVENUE', category: '기부금', isSystem: true },
    { code: '404', name: '회비', type: 'REVENUE', category: '회비', isSystem: true },
    { code: '405', name: '사업수입', type: 'REVENUE', category: '사업수익', isSystem: true },
    { code: '406', name: '이자수입', type: 'REVENUE', category: '기타수익', isSystem: true },

    // Expenses
    { code: '501', name: '인건비', type: 'EXPENSE', category: '인건비', isSystem: true },
    { code: '502', name: '임차료', type: 'EXPENSE', category: '운영비', isSystem: true },
    { code: '503', name: '통신비', type: 'EXPENSE', category: '운영비', isSystem: true },
    { code: '504', name: '소모품비', type: 'EXPENSE', category: '운영비', isSystem: true },
    { code: '505', name: '여비교통비', type: 'EXPENSE', category: '운영비', isSystem: true },
    { code: '506', name: '업무추진비', type: 'EXPENSE', category: '운영비', isSystem: true },
    { code: '507', name: '사업비', type: 'EXPENSE', category: '사업비', isSystem: true },
    { code: '508', name: '수수료', type: 'EXPENSE', category: '기타비용', isSystem: true },
  ];

  const forprofitAccounts = [
    // Revenue (For-profit specific)
    { code: '401', name: '매출', type: 'REVENUE', category: '매출', isSystem: true },
    { code: '402', name: '용역매출', type: 'REVENUE', category: '매출', isSystem: true },
    { code: '403', name: '이자수익', type: 'REVENUE', category: '영업외수익', isSystem: true },
    { code: '404', name: '기타수익', type: 'REVENUE', category: '영업외수익', isSystem: true },

    // Expenses
    { code: '501', name: '급여', type: 'EXPENSE', category: '인건비', isSystem: true },
    { code: '502', name: '퇴직급여', type: 'EXPENSE', category: '인건비', isSystem: true },
    { code: '503', name: '복리후생비', type: 'EXPENSE', category: '인건비', isSystem: true },
    { code: '504', name: '임차료', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '505', name: '통신비', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '506', name: '소모품비', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '507', name: '여비교통비', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '508', name: '접대비', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '509', name: '광고선전비', type: 'EXPENSE', category: '판매관리비', isSystem: true },
    { code: '510', name: '지급수수료', type: 'EXPENSE', category: '판매관리비', isSystem: true },
  ];

  const typeSpecificAccounts =
    type === 'NONPROFIT' || type === 'SOCIAL_ENTERPRISE'
      ? nonprofitAccounts
      : forprofitAccounts;

  const allAccounts = [...commonAccounts, ...typeSpecificAccounts];

  await prisma.account.createMany({
    data: allAccounts.map((account) => ({
      ...account,
      tenantId,
    })),
  });
}

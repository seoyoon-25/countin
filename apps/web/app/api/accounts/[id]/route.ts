import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { z } from 'zod';

// GET - 단일 계정과목 조회
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

    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '계정과목을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Get account error:', error);
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

// PATCH - 계정과목 수정
const updateAccountSchema = z.object({
  code: z.string().min(1, '계정코드를 입력해주세요').optional(),
  name: z.string().min(1, '계정명을 입력해주세요').optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], '계정유형을 선택해주세요').optional(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

    // Verify account exists and belongs to tenant
    const existingAccount = await prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '계정과목을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Check if it's a system account
    if (existingAccount.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYSTEM_ACCOUNT',
            message: '시스템 기본 계정은 수정할 수 없습니다',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);

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

    const { code, name, type, category, description, isActive } = parsed.data;

    // Check if new code already exists (if code is being changed)
    if (code && code !== existingAccount.code) {
      const duplicateAccount = await prisma.account.findFirst({
        where: { tenantId, code },
      });

      if (duplicateAccount) {
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
    }

    // Build update data
    const updateData: any = {};

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category || null;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
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
      data: account,
    });
  } catch (error) {
    console.error('Update account error:', error);
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

// DELETE - 계정과목 삭제
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

    // Verify account exists and belongs to tenant
    const existingAccount = await prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '계정과목을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Check if it's a system account
    if (existingAccount.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYSTEM_ACCOUNT',
            message: '시스템 기본 계정은 삭제할 수 없습니다',
          },
        },
        { status: 403 }
      );
    }

    // Check if account has transactions
    if (existingAccount._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_TRANSACTIONS',
            message: `이 계정과목에 ${existingAccount._count.transactions}건의 거래가 있어 삭제할 수 없습니다. 먼저 거래를 삭제하거나 다른 계정으로 이동해주세요.`,
          },
        },
        { status: 400 }
      );
    }

    // Delete the account
    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: existingAccount,
    });
  } catch (error) {
    console.error('Delete account error:', error);
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

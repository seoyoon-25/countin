import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 조직 멤버 목록 조회
export async function GET() {
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

    // Get all members of the tenant
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const members = tenantUsers.map(tu => ({
      id: tu.user.id,
      name: tu.user.name,
      email: tu.user.email,
      avatar: tu.user.avatar,
      role: tu.role,
    }));

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get members error:', error);
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

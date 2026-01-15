import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';

// GET - 문서 목록 조회
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
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const isTemplate = searchParams.get('isTemplate');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (isTemplate !== null && isTemplate !== undefined) {
      where.isTemplate = isTemplate === 'true';
    }

    if (search) {
      where.title = {
        contains: search,
      };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get documents error:', error);
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

// POST - 새 문서 생성
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
    const { title, type, content, projectId, templateId, isTemplate } = body;

    if (!title || !type) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '제목과 문서 유형은 필수입니다',
          },
        },
        { status: 400 }
      );
    }

    // If using a template, copy its content
    let initialContent = content || '[]';
    if (templateId) {
      const template = await prisma.document.findFirst({
        where: { id: templateId, tenantId, isTemplate: true },
      });
      if (template) {
        initialContent = template.content;
      }
    }

    const document = await prisma.document.create({
      data: {
        tenantId,
        title,
        type,
        content: initialContent,
        projectId: projectId || null,
        templateId: templateId || null,
        isTemplate: isTemplate || false,
        status: 'DRAFT',
      },
      include: {
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
      data: document,
    });
  } catch (error) {
    console.error('Create document error:', error);
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

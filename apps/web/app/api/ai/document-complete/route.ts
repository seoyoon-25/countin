import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { completeDocument, improveText, type DocumentType } from '@countin/ai';
import { z } from 'zod';

const requestSchema = z.object({
  action: z.enum(['complete', 'improve']),
  documentType: z.enum(['BUSINESS_PLAN', 'SETTLEMENT', 'BUDGET_PLAN', 'MEETING_MINUTES', 'PROPOSAL', 'REPORT', 'CONTRACT', 'CUSTOM']).optional(),
  currentContent: z.string().min(1, '내용을 입력해주세요'),
  instruction: z.string().optional(),
  context: z.object({
    organizationName: z.string().optional(),
    projectName: z.string().optional(),
    period: z.string().optional(),
  }).optional(),
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

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

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

    let result: string;

    if (parsed.data.action === 'improve') {
      result = await improveText(parsed.data.currentContent, parsed.data.instruction);
    } else {
      // Map CUSTOM and CONTRACT to REPORT for AI processing
      let docType: DocumentType = 'REPORT';
      if (parsed.data.documentType &&
          ['BUSINESS_PLAN', 'SETTLEMENT', 'BUDGET_PLAN', 'MEETING_MINUTES', 'PROPOSAL', 'REPORT'].includes(parsed.data.documentType)) {
        docType = parsed.data.documentType as DocumentType;
      }

      result = await completeDocument({
        documentType: docType,
        currentContent: parsed.data.currentContent,
        instruction: parsed.data.instruction,
        context: parsed.data.context,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result,
      },
    });
  } catch (error) {
    console.error('Document completion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: error instanceof Error ? error.message : 'AI 문서 작성 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

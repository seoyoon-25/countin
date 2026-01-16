import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateBudget, type BudgetGenerationInput } from '@countin/ai';
import { z } from 'zod';

const requestSchema = z.object({
  projectName: z.string().min(1, '사업명을 입력해주세요'),
  projectDescription: z.string().optional(),
  organizationType: z.string().optional(),
  totalBudget: z.number().optional(),
  period: z.string().optional(),
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

    const input: BudgetGenerationInput = {
      projectName: parsed.data.projectName,
      projectDescription: parsed.data.projectDescription || '',
      organizationType: parsed.data.organizationType || '비영리단체',
      totalBudget: parsed.data.totalBudget,
      period: parsed.data.period,
    };

    const result = await generateBudget(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Budget generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: error instanceof Error ? error.message : 'AI 예산 생성 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

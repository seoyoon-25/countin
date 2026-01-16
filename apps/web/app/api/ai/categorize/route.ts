import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import { categorizeTransaction } from '@countin/ai';
import { z } from 'zod';

const requestSchema = z.object({
  description: z.string().min(1, '적요를 입력해주세요'),
  amount: z.number().positive('금액은 양수여야 합니다'),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().optional(),
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

    // Get tenant info for organization type
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { type: true },
    });

    // Get available accounts
    const accounts = await prisma.account.findMany({
      where: { tenantId, isActive: true },
      select: { code: true, name: true, type: true },
    });

    // First check learning data
    const normalizedDesc = parsed.data.description.toLowerCase().trim();
    const learned = await prisma.transactionClassification.findFirst({
      where: {
        tenantId,
        description: normalizedDesc,
      },
    });

    if (learned) {
      // Return learned classification
      const account = accounts.find(a => a.code === learned.accountId);
      if (account) {
        return NextResponse.json({
          success: true,
          data: {
            suggestions: [
              {
                code: account.code,
                name: account.name,
                confidence: learned.confidence,
                reason: '이전 분류 학습 데이터',
              },
            ],
            source: 'learned',
          },
        });
      }
    }

    // Use AI for categorization
    const result = await categorizeTransaction(
      {
        description: parsed.data.description,
        amount: parsed.data.amount,
        type: parsed.data.type,
        date: parsed.data.date,
      },
      accounts,
      tenant?.type || 'NONPROFIT'
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        source: 'ai',
      },
    });
  } catch (error) {
    console.error('Transaction categorization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: error instanceof Error ? error.message : 'AI 분류 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

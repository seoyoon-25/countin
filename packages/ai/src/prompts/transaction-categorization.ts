import { generateCompletion, type AIMessage } from '../client';

const SYSTEM_PROMPT = `당신은 회계 거래 분류 전문 AI입니다.
거래 내역을 분석하여 적절한 계정과목을 추천합니다.

분류 시 고려사항:
1. 거래 설명과 금액을 분석
2. 조직 유형에 맞는 계정과목 체계 적용
3. 한국 회계 기준 준수
4. JSON 형식으로 응답`;

export interface TransactionInput {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date?: string;
}

export interface AccountSuggestion {
  code: string;
  name: string;
  confidence: number;
  reason: string;
}

export interface CategorizationResult {
  suggestions: AccountSuggestion[];
  memo?: string;
  tags?: string[];
}

export async function categorizeTransaction(
  transaction: TransactionInput,
  availableAccounts: { code: string; name: string; type: string }[],
  organizationType: string
): Promise<CategorizationResult> {
  const accountsList = availableAccounts
    .filter((a) =>
      transaction.type === 'INCOME'
        ? a.type === 'REVENUE'
        : a.type === 'EXPENSE'
    )
    .map((a) => `${a.code}: ${a.name}`)
    .join('\n');

  const userMessage = `
다음 거래를 분류해주세요.

거래 정보:
- 적요: ${transaction.description}
- 금액: ${transaction.amount.toLocaleString()}원
- 유형: ${transaction.type === 'INCOME' ? '수입' : '지출'}
${transaction.date ? `- 날짜: ${transaction.date}` : ''}

조직 유형: ${organizationType}

사용 가능한 계정과목:
${accountsList}

다음 JSON 형식으로 응답해주세요:
{
  "suggestions": [
    {
      "code": "계정과목 코드",
      "name": "계정과목명",
      "confidence": 신뢰도(0-1),
      "reason": "추천 이유"
    }
  ],
  "memo": "추가 메모 (선택)",
  "tags": ["태그1", "태그2"]
}

최대 3개의 추천 계정과목을 신뢰도 순으로 정렬하여 응답해주세요.`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  const response = await generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 512,
    temperature: 0.3,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse categorization response:', error);
    throw new Error('거래 분류 중 오류가 발생했습니다');
  }
}

export async function extractTransactionInfo(
  rawText: string
): Promise<TransactionInput[]> {
  const userMessage = `
다음 텍스트에서 거래 정보를 추출해주세요:

"${rawText}"

다음 JSON 배열 형식으로 응답해주세요:
[
  {
    "description": "거래 설명",
    "amount": 금액(숫자),
    "type": "INCOME" 또는 "EXPENSE",
    "date": "YYYY-MM-DD" (파악 가능한 경우)
  }
]`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  const response = await generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 1024,
    temperature: 0.3,
  });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse transaction extraction response:', error);
    throw new Error('거래 정보 추출 중 오류가 발생했습니다');
  }
}

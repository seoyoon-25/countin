import { generateCompletion, type AIMessage } from '../client';

const SYSTEM_PROMPT = `당신은 비영리단체 및 소규모 조직의 예산 작성을 돕는 전문 AI 어시스턴트입니다.
한국의 비영리법인, 사회적기업, 영리법인의 예산 체계에 대해 잘 알고 있습니다.

예산 항목을 생성할 때는:
1. 해당 조직 유형에 맞는 적절한 항목명 사용
2. 현실적인 금액 산정
3. 산출근거를 명확하게 제시
4. 한국어로 응답

JSON 형식으로 응답하세요.`;

export interface BudgetItem {
  category: string;
  name: string;
  amount: number;
  description: string;
  calculation: string;
}

export interface BudgetGenerationInput {
  organizationType: string;
  projectName: string;
  projectDescription: string;
  totalBudget?: number;
  period?: string;
}

export interface BudgetGenerationResult {
  items: BudgetItem[];
  totalIncome: number;
  totalExpense: number;
  summary: string;
}

export async function generateBudget(
  input: BudgetGenerationInput
): Promise<BudgetGenerationResult> {
  const userMessage = `
다음 사업에 대한 예산안을 작성해주세요.

조직 유형: ${input.organizationType}
사업명: ${input.projectName}
사업 설명: ${input.projectDescription}
${input.totalBudget ? `예산 규모: ${input.totalBudget.toLocaleString()}원` : ''}
${input.period ? `사업 기간: ${input.period}` : ''}

다음 JSON 형식으로 응답해주세요:
{
  "items": [
    {
      "category": "수입" 또는 "지출",
      "name": "항목명",
      "amount": 금액(숫자),
      "description": "항목 설명",
      "calculation": "산출근거"
    }
  ],
  "totalIncome": 총수입(숫자),
  "totalExpense": 총지출(숫자),
  "summary": "예산안 요약 설명"
}`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  const response = await generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 2048,
    temperature: 0.5,
  });

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse budget generation response:', error);
    throw new Error('예산 생성 중 오류가 발생했습니다');
  }
}

export async function generateBudgetItemDescription(
  itemName: string,
  organizationType: string,
  context?: string
): Promise<string> {
  const userMessage = `
"${itemName}" 예산 항목의 산출근거를 작성해주세요.

조직 유형: ${organizationType}
${context ? `추가 정보: ${context}` : ''}

현실적이고 구체적인 산출근거를 1-2문장으로 작성해주세요.`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  return generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 256,
    temperature: 0.7,
  });
}

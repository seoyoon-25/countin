import { generateCompletion, type AIMessage } from '../client';

const SYSTEM_PROMPT = `당신은 비영리단체 및 소규모 조직의 공식 문서 작성을 돕는 전문 AI 어시스턴트입니다.
사업계획서, 정산보고서, 제안서 등 다양한 문서 작성에 능숙합니다.

문서 작성 시:
1. 공식적이고 전문적인 어조 사용
2. 명확하고 간결한 문장
3. 필요한 경우 적절한 포맷팅 (번호, 불릿 등)
4. 한국어로 응답`;

export type DocumentType =
  | 'BUSINESS_PLAN'
  | 'SETTLEMENT'
  | 'BUDGET_PLAN'
  | 'MEETING_MINUTES'
  | 'PROPOSAL'
  | 'REPORT';

const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  BUSINESS_PLAN: '사업계획서',
  SETTLEMENT: '정산보고서',
  BUDGET_PLAN: '예산안',
  MEETING_MINUTES: '회의록',
  PROPOSAL: '제안서',
  REPORT: '보고서',
};

export interface DocumentCompletionInput {
  documentType: DocumentType;
  currentContent: string;
  instruction?: string;
  context?: {
    organizationName?: string;
    projectName?: string;
    period?: string;
  };
}

export async function completeDocument(
  input: DocumentCompletionInput
): Promise<string> {
  const documentTypeName = DOCUMENT_TYPE_NAMES[input.documentType];

  const userMessage = `
다음 ${documentTypeName} 내용을 보완하거나 이어서 작성해주세요.

${input.context?.organizationName ? `조직명: ${input.context.organizationName}` : ''}
${input.context?.projectName ? `사업명: ${input.context.projectName}` : ''}
${input.context?.period ? `기간: ${input.context.period}` : ''}

현재 내용:
${input.currentContent}

${input.instruction ? `추가 지시사항: ${input.instruction}` : ''}

위 내용을 바탕으로 자연스럽게 이어서 작성해주세요. 마크다운 형식을 사용하지 마시고, 일반 텍스트로 작성해주세요.`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  return generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 1024,
    temperature: 0.7,
  });
}

export async function generateDocumentOutline(
  documentType: DocumentType,
  projectDescription: string
): Promise<string[]> {
  const documentTypeName = DOCUMENT_TYPE_NAMES[documentType];

  const userMessage = `
다음 사업에 대한 ${documentTypeName}의 목차/개요를 작성해주세요.

사업 설명: ${projectDescription}

JSON 배열 형식으로 목차 항목들을 응답해주세요:
["1. 첫번째 항목", "2. 두번째 항목", ...]`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  const response = await generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 512,
    temperature: 0.5,
  });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse document outline response:', error);
    throw new Error('목차 생성 중 오류가 발생했습니다');
  }
}

export async function improveText(text: string, instruction?: string): Promise<string> {
  const userMessage = `
다음 텍스트를 개선해주세요:

"${text}"

${instruction ? `요청사항: ${instruction}` : '더 명확하고 전문적으로 다듬어주세요.'}

개선된 텍스트만 응답해주세요.`;

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }];

  return generateCompletion(messages, {
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 512,
    temperature: 0.6,
  });
}

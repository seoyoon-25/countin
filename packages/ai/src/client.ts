import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export async function generateCompletion(
  messages: AIMessage[],
  options: AICompletionOptions = {}
): Promise<string> {
  const client = getAnthropicClient();

  const {
    model = 'claude-3-haiku-20240307',
    maxTokens = 1024,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === 'text');
  return textContent?.text || '';
}

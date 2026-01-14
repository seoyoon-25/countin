export { getAnthropicClient, generateCompletion, type AIMessage, type AICompletionOptions } from './client';

export {
  // Budget generation
  generateBudget,
  generateBudgetItemDescription,
  type BudgetItem,
  type BudgetGenerationInput,
  type BudgetGenerationResult,

  // Document completion
  completeDocument,
  generateDocumentOutline,
  improveText,
  type DocumentType,
  type DocumentCompletionInput,

  // Transaction categorization
  categorizeTransaction,
  extractTransactionInfo,
  type TransactionInput,
  type AccountSuggestion,
  type CategorizationResult,
} from './prompts';

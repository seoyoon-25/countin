// Bank Parser Types

export interface BankTemplate {
  id: string;
  name: string;
  nameKo: string;
  columns: {
    date: string[];
    description: string[];
    deposit: string[];
    withdrawal: string[];
    balance: string[];
  };
  dateFormats: string[];
  skipRows?: number;
  headerRow?: number;
}

export interface ParsedTransaction {
  rowIndex: number;
  date: string;
  description: string;
  deposit: number;
  withdrawal: number;
  balance: number;
  rawData: Record<string, any>;
}

export interface ColumnMapping {
  date: string | null;
  description: string | null;
  deposit: string | null;
  withdrawal: string | null;
  balance: string | null;
}

export interface ParseResult {
  success: boolean;
  bankType: string | null;
  headers: string[];
  rows: any[][];
  transactions: ParsedTransaction[];
  suggestedMapping: ColumnMapping;
  error?: string;
}

export interface ClassifiedTransaction extends ParsedTransaction {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  accountId: string | null;
  accountName: string | null;
  projectId: string | null;
  projectName: string | null;
  fundSourceId: string | null;
  fundSourceName: string | null;
  confidence: 'high' | 'medium' | 'low';
  isLearned: boolean;
}

export interface ImportResult {
  success: boolean;
  batchId: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  transactionIds: string[];
  errors: { rowIndex: number; error: string }[];
}

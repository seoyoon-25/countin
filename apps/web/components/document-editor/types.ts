// Block Types
export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'divider'
  | 'image'
  | 'signature'
  | 'budget-table'
  | 'settlement-table';

export type HeadingLevel = 'h1' | 'h2' | 'h3';
export type ListStyle = 'bullet' | 'numbered';

// Base Block Interface
export interface BaseBlock {
  id: string;
  type: BlockType;
}

// Heading Block
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: HeadingLevel;
  content: string;
}

// Paragraph Block
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}

// List Block
export interface ListBlock extends BaseBlock {
  type: 'list';
  style: ListStyle;
  items: string[];
}

// Table Block
export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

// Divider Block
export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

// Image Block
export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt: string;
  width?: number;
}

// Signature Block
export interface SignatureBlock extends BaseBlock {
  type: 'signature';
  label: string;
  name?: string;
  date?: string;
}

// Budget Table Block
export interface BudgetTableBlock extends BaseBlock {
  type: 'budget-table';
  budgetId?: string;
  title: string;
  incomeItems: BudgetItem[];
  expenseItems: BudgetItem[];
  showExecution?: boolean;
}

export interface BudgetItem {
  id: string;
  accountId?: string;
  name: string;
  calculation: string;
  amount: number;
  executedAmount?: number;
  note: string;
}

// Settlement Table Block
export interface SettlementTableBlock extends BaseBlock {
  type: 'settlement-table';
  projectId?: string;
  fundSourceId?: string;
  title: string;
  items: SettlementItem[];
}

export interface SettlementItem {
  id: string;
  name: string;
  budgetAmount: number;
  executedAmount: number;
  note: string;
}

// Union type for all blocks
export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | DividerBlock
  | ImageBlock
  | SignatureBlock
  | BudgetTableBlock
  | SettlementTableBlock;

// Block metadata for UI
export interface BlockMeta {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  shortcut?: string;
}

export const BLOCK_METADATA: BlockMeta[] = [
  { type: 'heading', name: '제목', description: '섹션 제목 추가', icon: 'heading', shortcut: '/h' },
  { type: 'paragraph', name: '본문', description: '일반 텍스트 추가', icon: 'text', shortcut: '/p' },
  { type: 'list', name: '목록', description: '순서있는/없는 목록', icon: 'list', shortcut: '/l' },
  { type: 'table', name: '표', description: '표 추가', icon: 'table', shortcut: '/t' },
  { type: 'divider', name: '구분선', description: '섹션 구분', icon: 'minus', shortcut: '/d' },
  { type: 'image', name: '이미지', description: '이미지 추가', icon: 'image', shortcut: '/i' },
  { type: 'signature', name: '서명란', description: '서명 위치 표시', icon: 'pen-tool', shortcut: '/s' },
  { type: 'budget-table', name: '예산표', description: '예산 항목표', icon: 'calculator', shortcut: '/b' },
  { type: 'settlement-table', name: '정산표', description: '정산 내역표', icon: 'file-check', shortcut: '/st' },
];

// Create default block
export function createBlock(type: BlockType): Block {
  const id = Math.random().toString(36).substr(2, 9);

  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 'h1', content: '' };
    case 'paragraph':
      return { id, type: 'paragraph', content: '' };
    case 'list':
      return { id, type: 'list', style: 'bullet', items: [''] };
    case 'table':
      return { id, type: 'table', headers: ['열 1', '열 2', '열 3'], rows: [['', '', '']] };
    case 'divider':
      return { id, type: 'divider' };
    case 'image':
      return { id, type: 'image', url: '', alt: '' };
    case 'signature':
      return { id, type: 'signature', label: '서명', name: '', date: '' };
    case 'budget-table':
      return {
        id,
        type: 'budget-table',
        title: '예산표',
        incomeItems: [{ id: Math.random().toString(36).substr(2, 9), name: '', calculation: '', amount: 0, note: '' }],
        expenseItems: [{ id: Math.random().toString(36).substr(2, 9), name: '', calculation: '', amount: 0, note: '' }],
        showExecution: false,
      };
    case 'settlement-table':
      return {
        id,
        type: 'settlement-table',
        title: '정산표',
        items: [{ id: Math.random().toString(36).substr(2, 9), name: '', budgetAmount: 0, executedAmount: 0, note: '' }],
      };
    default:
      return { id, type: 'paragraph', content: '' };
  }
}

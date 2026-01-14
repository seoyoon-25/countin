// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  tenantId: string;
  role: Role;
}

// Tenant Types
export type TenantType = 'NONPROFIT' | 'FORPROFIT' | 'SOLE_PROPRIETOR' | 'SOCIAL_ENTERPRISE';
export type Plan = 'FREE' | 'LIGHT' | 'STANDARD' | 'PRO';
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  plan: Plan;
  trialEndsAt?: Date;
  settings?: Record<string, unknown>;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Accounting Types
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type FundType = 'GOVERNMENT' | 'CORPORATE' | 'FOUNDATION' | 'DONATION' | 'SELF' | 'OTHER';

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: AccountType;
  category?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  tenantId: string;
  date: Date;
  type: TransactionType;
  amount: number;
  description: string;
  memo?: string;
  accountId: string;
  projectId?: string;
  fundSourceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  code?: string;
  startDate?: Date;
  endDate?: Date;
  status: ProjectStatus;
  budgetAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundSource {
  id: string;
  tenantId: string;
  name: string;
  type: FundType;
  grantor?: string;
  amount: number;
  usedAmount: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document Types
export type DocumentType =
  | 'BUSINESS_PLAN'
  | 'SETTLEMENT'
  | 'BUDGET_PLAN'
  | 'MEETING_MINUTES'
  | 'CONTRACT'
  | 'PROPOSAL'
  | 'REPORT'
  | 'CUSTOM';

export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  content: DocumentBlock[];
  projectId?: string;
  templateId?: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentBlock {
  id: string;
  type: string;
  content: unknown;
  order: number;
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

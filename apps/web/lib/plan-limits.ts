// Plan limits configuration

export type PlanType = 'FREE' | 'LIGHT' | 'STANDARD' | 'PRO';

export interface PlanLimits {
  documents: number; // -1 = unlimited
  transactionsPerMonth: number; // -1 = unlimited
  aiUsagePerMonth: number; // -1 = unlimited
  users: number; // -1 = unlimited
  canExportPdf: boolean;
  canExportWord: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedReports: boolean;
  hasCustomReports: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    documents: 3,
    transactionsPerMonth: 50,
    aiUsagePerMonth: 3,
    users: 1,
    canExportPdf: false,
    canExportWord: false,
    hasPrioritySupport: false,
    hasAdvancedReports: false,
    hasCustomReports: false,
  },
  LIGHT: {
    documents: 20,
    transactionsPerMonth: 500,
    aiUsagePerMonth: 30,
    users: 3,
    canExportPdf: true,
    canExportWord: true,
    hasPrioritySupport: false,
    hasAdvancedReports: false,
    hasCustomReports: false,
  },
  STANDARD: {
    documents: -1,
    transactionsPerMonth: -1,
    aiUsagePerMonth: 100,
    users: 10,
    canExportPdf: true,
    canExportWord: true,
    hasPrioritySupport: true,
    hasAdvancedReports: true,
    hasCustomReports: false,
  },
  PRO: {
    documents: -1,
    transactionsPerMonth: -1,
    aiUsagePerMonth: -1,
    users: -1,
    canExportPdf: true,
    canExportWord: true,
    hasPrioritySupport: true,
    hasAdvancedReports: true,
    hasCustomReports: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.FREE;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // unlimited
  return current < limit;
}

export function getLimitMessage(
  feature: string,
  current: number,
  limit: number
): string | null {
  if (limit === -1) return null;

  if (current >= limit) {
    return `${feature} 한도(${limit}개)에 도달했습니다. 플랜을 업그레이드하세요.`;
  }

  const remaining = limit - current;
  const threshold = Math.ceil(limit * 0.2); // 20% remaining

  if (remaining <= threshold) {
    return `${feature} 한도의 ${Math.round((current / limit) * 100)}%를 사용했습니다. (${remaining}개 남음)`;
  }

  return null;
}

export function canUseFeature(
  plan: string,
  feature: keyof Omit<PlanLimits, 'documents' | 'transactionsPerMonth' | 'aiUsagePerMonth' | 'users'>
): boolean {
  const limits = getPlanLimits(plan);
  return limits[feature] === true;
}

// Check and return upgrade prompt if needed
export interface UpgradePrompt {
  show: boolean;
  title: string;
  message: string;
  suggestedPlan: PlanType;
}

export function checkUpgradeNeeded(
  currentPlan: string,
  usage: {
    documents?: number;
    transactions?: number;
    aiUsage?: number;
    users?: number;
  }
): UpgradePrompt | null {
  const limits = getPlanLimits(currentPlan);
  const plans: PlanType[] = ['FREE', 'LIGHT', 'STANDARD', 'PRO'];
  const currentIndex = plans.indexOf(currentPlan as PlanType);

  if (currentIndex === -1 || currentIndex === plans.length - 1) {
    return null; // Invalid plan or already on highest
  }

  // Check each limit
  if (usage.documents !== undefined && limits.documents !== -1) {
    if (usage.documents >= limits.documents) {
      return {
        show: true,
        title: '문서 한도 초과',
        message: `현재 플랜에서는 최대 ${limits.documents}개의 문서만 생성할 수 있습니다.`,
        suggestedPlan: plans[currentIndex + 1],
      };
    }
  }

  if (usage.transactions !== undefined && limits.transactionsPerMonth !== -1) {
    if (usage.transactions >= limits.transactionsPerMonth) {
      return {
        show: true,
        title: '거래 한도 초과',
        message: `이번 달 거래 한도(${limits.transactionsPerMonth}건)에 도달했습니다.`,
        suggestedPlan: plans[currentIndex + 1],
      };
    }
  }

  if (usage.aiUsage !== undefined && limits.aiUsagePerMonth !== -1) {
    if (usage.aiUsage >= limits.aiUsagePerMonth) {
      return {
        show: true,
        title: 'AI 사용 한도 초과',
        message: `이번 달 AI 사용 한도(${limits.aiUsagePerMonth}회)에 도달했습니다.`,
        suggestedPlan: plans[currentIndex + 1],
      };
    }
  }

  if (usage.users !== undefined && limits.users !== -1) {
    if (usage.users >= limits.users) {
      return {
        show: true,
        title: '사용자 한도 초과',
        message: `현재 플랜에서는 최대 ${limits.users}명의 사용자만 초대할 수 있습니다.`,
        suggestedPlan: plans[currentIndex + 1],
      };
    }
  }

  return null;
}

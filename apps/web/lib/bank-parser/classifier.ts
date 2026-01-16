// AI-based Transaction Classifier

import { prisma } from '@countin/database';
import { ParsedTransaction, ClassifiedTransaction } from './types';

// Keyword patterns for account classification
const CLASSIFICATION_PATTERNS: {
  keywords: string[];
  accountType: 'INCOME' | 'EXPENSE';
  suggestedAccountCode: string;
  suggestedAccountName: string;
}[] = [
  // Income patterns
  { keywords: ['급여', '월급', '상여', '보너스', '임금'], accountType: 'INCOME', suggestedAccountCode: '401', suggestedAccountName: '급여수입' },
  { keywords: ['정부보조금', '보조금', '지원금', '교부금'], accountType: 'INCOME', suggestedAccountCode: '402', suggestedAccountName: '보조금수입' },
  { keywords: ['기부', '후원', '찬조', '기증'], accountType: 'INCOME', suggestedAccountCode: '403', suggestedAccountName: '기부금수입' },
  { keywords: ['회비', '회원비', '멤버십'], accountType: 'INCOME', suggestedAccountCode: '404', suggestedAccountName: '회비수입' },
  { keywords: ['이자', '예금이자', '적금이자'], accountType: 'INCOME', suggestedAccountCode: '405', suggestedAccountName: '이자수입' },
  { keywords: ['용역', '수임료', '수수료수입', '대행수수료'], accountType: 'INCOME', suggestedAccountCode: '406', suggestedAccountName: '용역수입' },
  { keywords: ['매출', '판매', '상품매출'], accountType: 'INCOME', suggestedAccountCode: '407', suggestedAccountName: '매출수입' },
  { keywords: ['임대', '임대료수입', '렌트'], accountType: 'INCOME', suggestedAccountCode: '408', suggestedAccountName: '임대수입' },

  // Expense patterns - Personnel
  { keywords: ['인건비', '급여지출', '상여지출'], accountType: 'EXPENSE', suggestedAccountCode: '501', suggestedAccountName: '급여' },
  { keywords: ['퇴직금', '퇴직급여'], accountType: 'EXPENSE', suggestedAccountCode: '502', suggestedAccountName: '퇴직급여' },
  { keywords: ['4대보험', '건강보험', '국민연금', '고용보험', '산재보험'], accountType: 'EXPENSE', suggestedAccountCode: '503', suggestedAccountName: '복리후생비' },

  // Expense patterns - Office
  { keywords: ['임대료', '월세', '관리비', '건물관리'], accountType: 'EXPENSE', suggestedAccountCode: '511', suggestedAccountName: '임차료' },
  { keywords: ['전기', '전기료', '전기요금', '한전'], accountType: 'EXPENSE', suggestedAccountCode: '512', suggestedAccountName: '수도광열비' },
  { keywords: ['수도', '수도료', '수도요금', '가스', '가스요금', '도시가스'], accountType: 'EXPENSE', suggestedAccountCode: '512', suggestedAccountName: '수도광열비' },
  { keywords: ['통신비', '전화요금', '인터넷', 'KT', 'SKT', 'LGU+', '통신료'], accountType: 'EXPENSE', suggestedAccountCode: '513', suggestedAccountName: '통신비' },

  // Expense patterns - Operations
  { keywords: ['소모품', '사무용품', '복사용지', '프린터', '잉크', '토너'], accountType: 'EXPENSE', suggestedAccountCode: '521', suggestedAccountName: '소모품비' },
  { keywords: ['도서', '서적', '신문', '잡지', '구독'], accountType: 'EXPENSE', suggestedAccountCode: '522', suggestedAccountName: '도서인쇄비' },
  { keywords: ['인쇄', '제본', '복사'], accountType: 'EXPENSE', suggestedAccountCode: '522', suggestedAccountName: '도서인쇄비' },
  { keywords: ['교육', '연수', '워크숍', '세미나', '강습'], accountType: 'EXPENSE', suggestedAccountCode: '523', suggestedAccountName: '교육훈련비' },
  { keywords: ['회의비', '다과', '회의', '티타임'], accountType: 'EXPENSE', suggestedAccountCode: '524', suggestedAccountName: '회의비' },
  { keywords: ['식대', '점심', '저녁', '식비', '음식', '배달', '도시락'], accountType: 'EXPENSE', suggestedAccountCode: '525', suggestedAccountName: '복리후생비' },

  // Expense patterns - Transport
  { keywords: ['교통비', '버스', '지하철', '택시', '주차', '톨비', '고속도로'], accountType: 'EXPENSE', suggestedAccountCode: '531', suggestedAccountName: '여비교통비' },
  { keywords: ['출장', '여비', '숙박', '호텔'], accountType: 'EXPENSE', suggestedAccountCode: '531', suggestedAccountName: '여비교통비' },
  { keywords: ['주유', '유류', '휘발유', '경유', 'SK에너지', 'GS칼텍스'], accountType: 'EXPENSE', suggestedAccountCode: '532', suggestedAccountName: '차량유지비' },

  // Expense patterns - Services
  { keywords: ['수수료', '이체수수료', '송금수수료', '카드수수료'], accountType: 'EXPENSE', suggestedAccountCode: '541', suggestedAccountName: '지급수수료' },
  { keywords: ['광고', '홍보', '마케팅', '페이스북', '구글광고', '네이버광고'], accountType: 'EXPENSE', suggestedAccountCode: '542', suggestedAccountName: '광고선전비' },
  { keywords: ['보험', '보험료', '화재보험', '배상책임'], accountType: 'EXPENSE', suggestedAccountCode: '543', suggestedAccountName: '보험료' },
  { keywords: ['세금', '부가세', '원천세', '지방세', '재산세'], accountType: 'EXPENSE', suggestedAccountCode: '544', suggestedAccountName: '세금과공과' },

  // Expense patterns - Events
  { keywords: ['행사', '이벤트', '행사비', '대관료'], accountType: 'EXPENSE', suggestedAccountCode: '551', suggestedAccountName: '행사비' },
  { keywords: ['기념품', '선물', '답례품'], accountType: 'EXPENSE', suggestedAccountCode: '552', suggestedAccountName: '접대비' },
  { keywords: ['경조사', '조의금', '축의금', '화환'], accountType: 'EXPENSE', suggestedAccountCode: '553', suggestedAccountName: '경조사비' },

  // Expense patterns - IT/Equipment
  { keywords: ['소프트웨어', 'SW', '라이센스', '구독료', 'SaaS'], accountType: 'EXPENSE', suggestedAccountCode: '561', suggestedAccountName: '소프트웨어비' },
  { keywords: ['서버', '호스팅', '클라우드', 'AWS', 'Azure', 'GCP'], accountType: 'EXPENSE', suggestedAccountCode: '562', suggestedAccountName: '서버운영비' },
  { keywords: ['장비', '기자재', '컴퓨터', '노트북', '모니터'], accountType: 'EXPENSE', suggestedAccountCode: '563', suggestedAccountName: '비품구입비' },

  // Expense patterns - Professional
  { keywords: ['세무', '회계', '자문', '컨설팅', '법률'], accountType: 'EXPENSE', suggestedAccountCode: '571', suggestedAccountName: '지급수수료' },
  { keywords: ['용역비', '외주', '프리랜서'], accountType: 'EXPENSE', suggestedAccountCode: '572', suggestedAccountName: '외주용역비' },
];

// Normalize description for matching
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^가-힣a-z0-9]/g, '');
}

// Find matching account based on keywords
function findMatchingPattern(description: string, isDeposit: boolean): {
  accountCode: string;
  accountName: string;
  confidence: 'high' | 'medium' | 'low';
} | null {
  const normalized = normalizeDescription(description);
  const originalLower = description.toLowerCase();

  // Expected type based on transaction direction
  const expectedType = isDeposit ? 'INCOME' : 'EXPENSE';

  for (const pattern of CLASSIFICATION_PATTERNS) {
    // Only match patterns of the expected type
    if (pattern.accountType !== expectedType) continue;

    for (const keyword of pattern.keywords) {
      const normalizedKeyword = normalizeDescription(keyword);
      if (normalized.includes(normalizedKeyword) || originalLower.includes(keyword)) {
        // Determine confidence based on match quality
        const confidence: 'high' | 'medium' | 'low' =
          description.toLowerCase() === keyword ? 'high' :
          normalized.includes(normalizedKeyword) && keyword.length >= 3 ? 'medium' : 'low';

        return {
          accountCode: pattern.suggestedAccountCode,
          accountName: pattern.suggestedAccountName,
          confidence,
        };
      }
    }
  }

  return null;
}

export async function classifyTransactions(
  transactions: ParsedTransaction[],
  tenantId: string
): Promise<ClassifiedTransaction[]> {
  // Get tenant's accounts
  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, code: true, name: true, type: true },
  });

  // Get tenant's projects
  const projects = await prisma.project.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  // Get tenant's fund sources
  const fundSources = await prisma.fundSource.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });

  // Get learned classifications
  const learnedClassifications = await prisma.transactionClassification.findMany({
    where: { tenantId },
  });

  const learnedMap = new Map(
    learnedClassifications.map(c => [normalizeDescription(c.description), c])
  );

  // Find account by code
  const findAccountByCode = (code: string, type: 'INCOME' | 'EXPENSE') => {
    const accountType = type === 'INCOME' ? 'REVENUE' : 'EXPENSE';
    return accounts.find(a => a.code === code && a.type === accountType);
  };

  // Find account by name similarity
  const findAccountByName = (name: string, type: 'INCOME' | 'EXPENSE') => {
    const accountType = type === 'INCOME' ? 'REVENUE' : 'EXPENSE';
    const normalizedName = name.toLowerCase();
    return accounts.find(a =>
      a.type === accountType && a.name.toLowerCase().includes(normalizedName)
    );
  };

  // Get default accounts
  const defaultIncomeAccount = accounts.find(a => a.type === 'REVENUE' && a.code === '401');
  const defaultExpenseAccount = accounts.find(a => a.type === 'EXPENSE' && a.code === '501');

  return transactions.map(transaction => {
    const isDeposit = transaction.deposit > 0;
    const type: 'INCOME' | 'EXPENSE' = isDeposit ? 'INCOME' : 'EXPENSE';
    const amount = isDeposit ? transaction.deposit : transaction.withdrawal;
    const normalizedDesc = normalizeDescription(transaction.description);

    let accountId: string | null = null;
    let accountName: string | null = null;
    let projectId: string | null = null;
    let projectName: string | null = null;
    let fundSourceId: string | null = null;
    let fundSourceName: string | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let isLearned = false;

    // 1. Check learned classifications first
    const learned = learnedMap.get(normalizedDesc);
    if (learned) {
      const account = accounts.find(a => a.id === learned.accountId);
      if (account) {
        accountId = account.id;
        accountName = `${account.code} ${account.name}`;
        confidence = learned.confidence >= 0.8 ? 'high' : learned.confidence >= 0.5 ? 'medium' : 'low';
        isLearned = true;

        if (learned.projectId) {
          const project = projects.find(p => p.id === learned.projectId);
          if (project) {
            projectId = project.id;
            projectName = project.name;
          }
        }

        if (learned.fundSourceId) {
          const fundSource = fundSources.find(f => f.id === learned.fundSourceId);
          if (fundSource) {
            fundSourceId = fundSource.id;
            fundSourceName = fundSource.name;
          }
        }
      }
    }

    // 2. If not learned, try pattern matching
    if (!accountId) {
      const patternMatch = findMatchingPattern(transaction.description, isDeposit);
      if (patternMatch) {
        const account = findAccountByCode(patternMatch.accountCode, type) ||
          findAccountByName(patternMatch.accountName, type);
        if (account) {
          accountId = account.id;
          accountName = `${account.code} ${account.name}`;
          confidence = patternMatch.confidence;
        }
      }
    }

    // 3. Fallback to default account
    if (!accountId) {
      const defaultAccount = isDeposit ? defaultIncomeAccount : defaultExpenseAccount;
      if (defaultAccount) {
        accountId = defaultAccount.id;
        accountName = `${defaultAccount.code} ${defaultAccount.name}`;
        confidence = 'low';
      }
    }

    return {
      ...transaction,
      type,
      amount,
      accountId,
      accountName,
      projectId,
      projectName,
      fundSourceId,
      fundSourceName,
      confidence,
      isLearned,
    };
  });
}

export async function saveClassificationLearning(
  tenantId: string,
  description: string,
  accountId: string,
  projectId: string | null,
  fundSourceId: string | null
): Promise<void> {
  const normalizedDesc = normalizeDescription(description);

  await prisma.transactionClassification.upsert({
    where: {
      tenantId_description: {
        tenantId,
        description: normalizedDesc,
      },
    },
    create: {
      tenantId,
      description: normalizedDesc,
      accountId,
      projectId,
      fundSourceId,
      confidence: 1.0,
      usageCount: 1,
    },
    update: {
      accountId,
      projectId,
      fundSourceId,
      confidence: 1.0,
      usageCount: { increment: 1 },
    },
  });
}

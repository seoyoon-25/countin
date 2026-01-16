// Korean Bank Templates

import { BankTemplate } from './types';

export const BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'kb',
    name: 'Kookmin Bank',
    nameKo: '국민은행',
    columns: {
      date: ['거래일', '거래일자', '날짜', 'date', '거래일시'],
      description: ['적요', '거래내용', '내용', '비고', 'description', '거래적요', '적요내용'],
      deposit: ['입금', '입금액', '입금(원)', 'deposit', '입금금액', '받은금액'],
      withdrawal: ['출금', '출금액', '출금(원)', 'withdrawal', '출금금액', '보낸금액'],
      balance: ['잔액', '잔액(원)', 'balance', '거래후잔액', '거래 후 잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD', 'YYYYMMDD'],
    skipRows: 0,
  },
  {
    id: 'shinhan',
    name: 'Shinhan Bank',
    nameKo: '신한은행',
    columns: {
      date: ['거래일', '거래일자', '날짜', '거래일시', '일자'],
      description: ['거래내용', '적요', '내용', '거래적요', '적요내용', '거래명'],
      deposit: ['입금액', '입금', '입금(원)', '받은금액'],
      withdrawal: ['출금액', '출금', '출금(원)', '보낸금액'],
      balance: ['잔액', '거래후잔액', '잔액(원)'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD'],
  },
  {
    id: 'woori',
    name: 'Woori Bank',
    nameKo: '우리은행',
    columns: {
      date: ['거래일자', '거래일', '날짜', '거래일시'],
      description: ['적요', '거래내용', '내용', '거래적요'],
      deposit: ['입금액', '입금', '받으신금액', '입금(원)'],
      withdrawal: ['출금액', '출금', '찾으신금액', '출금(원)'],
      balance: ['잔액', '거래후잔액', '현재잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD'],
  },
  {
    id: 'nh',
    name: 'NH Bank',
    nameKo: '농협은행',
    columns: {
      date: ['거래일자', '거래일', '날짜', '일자'],
      description: ['적요', '거래내용', '비고', '내역'],
      deposit: ['입금액', '입금', '입금(원)'],
      withdrawal: ['출금액', '출금', '출금(원)'],
      balance: ['잔액', '거래후잔액', '잔액(원)'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD', 'YYYYMMDD'],
  },
  {
    id: 'hana',
    name: 'Hana Bank',
    nameKo: '하나은행',
    columns: {
      date: ['거래일', '거래일자', '날짜', '거래일시'],
      description: ['적요', '거래내용', '내용', '기재내용'],
      deposit: ['입금', '입금액', '받은금액'],
      withdrawal: ['출금', '출금액', '보낸금액'],
      balance: ['잔액', '거래후잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD'],
  },
  {
    id: 'ibk',
    name: 'IBK',
    nameKo: '기업은행',
    columns: {
      date: ['거래일자', '거래일', '날짜'],
      description: ['적요', '거래내용', '내용', '기재내용'],
      deposit: ['입금액', '입금', '입금(원)'],
      withdrawal: ['출금액', '출금', '출금(원)'],
      balance: ['잔액', '거래후잔액', '잔액(원)'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD'],
  },
  {
    id: 'sc',
    name: 'SC Bank',
    nameKo: 'SC제일은행',
    columns: {
      date: ['거래일', '거래일자', 'Date', '날짜'],
      description: ['적요', '거래내용', 'Description', '내용'],
      deposit: ['입금', '입금액', 'Credit', '입금(원)'],
      withdrawal: ['출금', '출금액', 'Debit', '출금(원)'],
      balance: ['잔액', 'Balance', '거래후잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
  },
  {
    id: 'kakao',
    name: 'Kakao Bank',
    nameKo: '카카오뱅크',
    columns: {
      date: ['거래일시', '거래일', '날짜', '일시'],
      description: ['거래내용', '적요', '내용', '메모'],
      deposit: ['입금액', '입금', '받은금액'],
      withdrawal: ['출금액', '출금', '보낸금액'],
      balance: ['잔액', '거래후잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD HH:mm:ss'],
  },
  {
    id: 'toss',
    name: 'Toss Bank',
    nameKo: '토스뱅크',
    columns: {
      date: ['거래일시', '거래일', '날짜'],
      description: ['거래내용', '적요', '내용'],
      deposit: ['입금액', '입금'],
      withdrawal: ['출금액', '출금'],
      balance: ['잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD'],
  },
  {
    id: 'generic',
    name: 'Generic',
    nameKo: '일반 템플릿',
    columns: {
      date: ['거래일', '거래일자', '날짜', 'date', '일자', '일시', '거래일시'],
      description: ['적요', '거래내용', '내용', 'description', '비고', '거래적요', '내역', '기재내용', '메모'],
      deposit: ['입금', '입금액', 'deposit', '입금(원)', '받은금액', '입금금액', 'credit'],
      withdrawal: ['출금', '출금액', 'withdrawal', '출금(원)', '보낸금액', '출금금액', 'debit'],
      balance: ['잔액', 'balance', '거래후잔액', '잔액(원)', '현재잔액'],
    },
    dateFormats: ['YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD', 'YYYYMMDD', 'DD/MM/YYYY'],
  },
];

export function findBankTemplate(headers: string[]): BankTemplate | null {
  const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');

  for (const template of BANK_TEMPLATES) {
    if (template.id === 'generic') continue;

    // Check if headers match this template
    let matchCount = 0;
    const requiredColumns = ['date', 'description', 'deposit', 'withdrawal'] as const;

    for (const col of requiredColumns) {
      const possibleNames = template.columns[col].map(n => n.toLowerCase());
      if (normalizedHeaders.some(h => possibleNames.includes(h))) {
        matchCount++;
      }
    }

    // If at least 3 of 4 required columns match, consider it a match
    if (matchCount >= 3) {
      return template;
    }
  }

  // Return generic template if no specific match
  return BANK_TEMPLATES.find(t => t.id === 'generic') || null;
}

export function detectColumnMapping(headers: string[], template: BankTemplate): Record<string, string | null> {
  const mapping: Record<string, string | null> = {
    date: null,
    description: null,
    deposit: null,
    withdrawal: null,
    balance: null,
  };

  const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');

  for (const [field, possibleNames] of Object.entries(template.columns)) {
    const normalizedNames = possibleNames.map(n => n.toLowerCase());
    const matchIndex = normalizedHeaders.findIndex(h => normalizedNames.includes(h));
    if (matchIndex !== -1) {
      mapping[field] = headers[matchIndex];
    }
  }

  return mapping;
}

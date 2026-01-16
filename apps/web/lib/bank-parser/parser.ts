// Bank Transaction Parser

import * as XLSX from 'xlsx';
import { ParseResult, ParsedTransaction, ColumnMapping } from './types';
import { findBankTemplate, detectColumnMapping, BANK_TEMPLATES } from './templates';

export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawData || rawData.length < 2) {
      return {
        success: false,
        bankType: null,
        headers: [],
        rows: [],
        transactions: [],
        suggestedMapping: { date: null, description: null, deposit: null, withdrawal: null, balance: null },
        error: '데이터가 부족합니다. 최소 헤더와 1개 이상의 데이터 행이 필요합니다.',
      };
    }

    // Find header row (first row with reasonable content)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any[];
      if (row && row.filter(cell => cell !== null && cell !== undefined && cell !== '').length >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = (rawData[headerRowIndex] as any[]).map(h => String(h || '').trim());
    const rows = rawData.slice(headerRowIndex + 1).filter(row =>
      Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    // Detect bank template
    const template = findBankTemplate(headers);
    const bankType = template?.id || null;

    // Detect column mapping
    const detected = template ? detectColumnMapping(headers, template) : {};
    const suggestedMapping: ColumnMapping = {
      date: detected.date ?? null,
      description: detected.description ?? null,
      deposit: detected.deposit ?? null,
      withdrawal: detected.withdrawal ?? null,
      balance: detected.balance ?? null,
    };

    // Parse transactions if mapping is available
    const transactions = parseTransactionsFromRows(rows, headers, suggestedMapping);

    return {
      success: true,
      bankType,
      headers,
      rows,
      transactions,
      suggestedMapping,
    };
  } catch (error) {
    return {
      success: false,
      bankType: null,
      headers: [],
      rows: [],
      transactions: [],
      suggestedMapping: { date: null, description: null, deposit: null, withdrawal: null, balance: null },
      error: error instanceof Error ? error.message : '파일을 파싱하는 중 오류가 발생했습니다.',
    };
  }
}

export function parseCSVFile(content: string): ParseResult {
  try {
    const workbook = XLSX.read(content, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawData || rawData.length < 2) {
      return {
        success: false,
        bankType: null,
        headers: [],
        rows: [],
        transactions: [],
        suggestedMapping: { date: null, description: null, deposit: null, withdrawal: null, balance: null },
        error: '데이터가 부족합니다.',
      };
    }

    // Find header row
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any[];
      if (row && row.filter(cell => cell !== null && cell !== undefined && cell !== '').length >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = (rawData[headerRowIndex] as any[]).map(h => String(h || '').trim());
    const rows = rawData.slice(headerRowIndex + 1).filter(row =>
      Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    const template = findBankTemplate(headers);
    const bankType = template?.id || null;
    const detected = template ? detectColumnMapping(headers, template) : {};
    const suggestedMapping: ColumnMapping = {
      date: detected.date ?? null,
      description: detected.description ?? null,
      deposit: detected.deposit ?? null,
      withdrawal: detected.withdrawal ?? null,
      balance: detected.balance ?? null,
    };

    const transactions = parseTransactionsFromRows(rows, headers, suggestedMapping);

    return {
      success: true,
      bankType,
      headers,
      rows,
      transactions,
      suggestedMapping,
    };
  } catch (error) {
    return {
      success: false,
      bankType: null,
      headers: [],
      rows: [],
      transactions: [],
      suggestedMapping: { date: null, description: null, deposit: null, withdrawal: null, balance: null },
      error: error instanceof Error ? error.message : '파일을 파싱하는 중 오류가 발생했습니다.',
    };
  }
}

function parseTransactionsFromRows(
  rows: any[][],
  headers: string[],
  mapping: ColumnMapping
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  const dateIndex = mapping.date ? headers.indexOf(mapping.date) : -1;
  const descIndex = mapping.description ? headers.indexOf(mapping.description) : -1;
  const depositIndex = mapping.deposit ? headers.indexOf(mapping.deposit) : -1;
  const withdrawalIndex = mapping.withdrawal ? headers.indexOf(mapping.withdrawal) : -1;
  const balanceIndex = mapping.balance ? headers.indexOf(mapping.balance) : -1;

  rows.forEach((row, index) => {
    // Create raw data object
    const rawData: Record<string, any> = {};
    headers.forEach((header, i) => {
      rawData[header] = row[i];
    });

    // Parse date
    let date = '';
    if (dateIndex !== -1 && row[dateIndex] !== undefined) {
      const rawDate = row[dateIndex];
      if (rawDate instanceof Date) {
        date = formatDate(rawDate);
      } else {
        date = parseDate(String(rawDate));
      }
    }

    // Parse description
    const description = descIndex !== -1 ? String(row[descIndex] || '') : '';

    // Parse amounts
    const deposit = depositIndex !== -1 ? parseAmount(row[depositIndex]) : 0;
    const withdrawal = withdrawalIndex !== -1 ? parseAmount(row[withdrawalIndex]) : 0;
    const balance = balanceIndex !== -1 ? parseAmount(row[balanceIndex]) : 0;

    // Skip rows without date or both amounts are 0
    if (date && (deposit !== 0 || withdrawal !== 0)) {
      transactions.push({
        rowIndex: index + 1,
        date,
        description: description.trim(),
        deposit,
        withdrawal,
        balance,
        rawData,
      });
    }
  });

  return transactions;
}

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  // Remove currency symbols, commas, and spaces
  const cleanValue = String(value)
    .replace(/[₩$,\s]/g, '')
    .replace(/[원]/g, '')
    .trim();

  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parseDate(value: string): string {
  if (!value) return '';

  // Try various date formats
  const cleanValue = value.trim();

  // YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  const match1 = cleanValue.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (match1) {
    const [, year, month, day] = match1;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // YYYYMMDD
  const match2 = cleanValue.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match2) {
    const [, year, month, day] = match2;
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY
  const match3 = cleanValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match3) {
    const [, day, month, year] = match3;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function reParseWithMapping(
  rows: any[][],
  headers: string[],
  mapping: ColumnMapping
): ParsedTransaction[] {
  return parseTransactionsFromRows(rows, headers, mapping);
}

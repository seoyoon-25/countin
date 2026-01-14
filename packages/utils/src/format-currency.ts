/**
 * Format a number as Korean Won currency
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSign?: boolean;
    compact?: boolean;
  }
): string {
  const { showSign = false, compact = false } = options || {};

  const formatter = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format a number with thousand separators (without currency symbol)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

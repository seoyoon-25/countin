/**
 * Format a date to Korean locale string
 */
export function formatDate(
  date: Date | string,
  options?: {
    format?: 'short' | 'long' | 'full';
    includeTime?: boolean;
  }
): string {
  const { format = 'short', includeTime = false } = options || {};
  const d = typeof date === 'string' ? new Date(date) : date;

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? '2-digit' : format === 'long' ? 'long' : 'short',
    day: '2-digit',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString('ko-KR', dateOptions);
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get relative time string (e.g., "3일 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) return '방금 전';
      return `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  }

  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;

  return `${Math.floor(diffDays / 365)}년 전`;
}

/**
 * Get the start and end of a month
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the start and end of a year
 */
export function getYearRange(year: number): { start: Date; end: Date } {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

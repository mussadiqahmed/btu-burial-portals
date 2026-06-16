export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value) || 0;
  return `P${amount.toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function monthLabel(month: number, year: number): string {
  const name = MONTHS[(month || 1) - 1] ?? 'Unknown';
  return `${name} ${year}`;
}

export function shortMonthLabel(month: number, year: number): string {
  const name = MONTHS[(month || 1) - 1]?.slice(0, 3) ?? '?';
  return `${name} ${String(year).slice(2)}`;
}

import * as XLSX from 'xlsx';

const PAYROLL_ALIASES = ['payroll number', 'payrollnumber', 'payroll no', 'payroll', 'payroll_number'];
const NAME_ALIASES = ['full name', 'fullname', 'name', 'names', 'member name'];
const AMOUNT_ALIASES = ['paid amount', 'amount', 'premium paid', 'premium', 'paid'];

export interface ParsedRow {
  payroll_number: string;
  full_name: string;
  paid_amount: number;
  row_number: number;
}

export interface SheetPreview {
  sheet_name: string;
  row_count: number;
  columns: {
    payroll: boolean;
    name: boolean;
    amount: boolean;
    payroll_header?: string;
    name_header?: string;
    amount_header?: string;
  };
  failed_rows: Array<{ row: number; reason: string }>;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h));
}

function findFirstAmountColumn(headers: string[]): number {
  return headers.findIndex((h) => h.includes('amount') || h === 'premium paid' || h === 'premium');
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}

export function listWorkbookSheets(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames;
}

function resolveSheetName(workbook: XLSX.WorkBook, sheetName?: string): string {
  if (sheetName && workbook.SheetNames.includes(sheetName)) return sheetName;
  const tomb = workbook.SheetNames.find((s) => s.toLowerCase() === 'tombstones');
  if (tomb) return tomb;
  const pension = workbook.SheetNames.find((s) => s.toLowerCase().includes('tombstone'));
  if (pension) return pension;
  return workbook.SheetNames[0];
}

export function previewSheet(buffer: Buffer, sheetName?: string): SheetPreview {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const resolved = resolveSheetName(workbook, sheetName);
  const sheet = workbook.Sheets[resolved];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRowIndex = -1;
  let nameCol = -1;
  let payrollCol = -1;
  let paidCol = -1;
  let headersRaw: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const headers = (rows[i] || []).map(normalizeHeader);
    const n = findColumnIndex(headers, NAME_ALIASES);
    const p = findColumnIndex(headers, PAYROLL_ALIASES);
    const a = findFirstAmountColumn(headers);
    if (p >= 0 && a >= 0) {
      headerRowIndex = i;
      nameCol = n;
      payrollCol = p;
      paidCol = a;
      headersRaw = (rows[i] || []).map((h) => String(h ?? '').trim());
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new Error('Could not detect Payroll and Amount columns');
  }

  const { rows: parsed, failed_rows } = parseSheetRows(
    rows,
    headerRowIndex,
    nameCol,
    payrollCol,
    paidCol,
    false
  );

  return {
    sheet_name: resolved,
    row_count: parsed.length,
    columns: {
      payroll: payrollCol >= 0,
      name: nameCol >= 0,
      amount: paidCol >= 0,
      payroll_header: headersRaw[payrollCol],
      name_header: nameCol >= 0 ? headersRaw[nameCol] : undefined,
      amount_header: headersRaw[paidCol],
    },
    failed_rows,
  };
}

function parseSheetRows(
  rows: unknown[][],
  headerRowIndex: number,
  nameCol: number,
  payrollCol: number,
  paidCol: number,
  strictName: boolean
): { rows: ParsedRow[]; failed_rows: Array<{ row: number; reason: string }> } {
  const parsed: ParsedRow[] = [];
  const failed_rows: Array<{ row: number; reason: string }> = [];
  const seenPayrolls = new Map<string, number>();

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const rowNumber = i + 1;
    const payroll_number = String(row[payrollCol] ?? '').trim();
    const full_name = nameCol >= 0 ? String(row[nameCol] ?? '').trim() : '';
    const paid_amount = parseAmount(row[paidCol]);

    if (!payroll_number && paid_amount === null && !full_name) continue;

    if (!payroll_number) {
      failed_rows.push({ row: rowNumber, reason: 'Missing payroll number' });
      continue;
    }

    if (strictName && !full_name) {
      failed_rows.push({ row: rowNumber, reason: 'Missing name' });
      continue;
    }

    if (paid_amount === null) {
      failed_rows.push({ row: rowNumber, reason: 'Invalid or missing amount' });
      continue;
    }

    if (seenPayrolls.has(payroll_number)) {
      failed_rows.push({
        row: rowNumber,
        reason: `Duplicate payroll number (first seen row ${seenPayrolls.get(payroll_number)})`,
      });
      continue;
    }

    seenPayrolls.set(payroll_number, rowNumber);
    parsed.push({
      payroll_number,
      full_name: full_name || payroll_number,
      paid_amount,
      row_number: rowNumber,
    });
  }

  return { rows: parsed, failed_rows };
}

export function parseSheetForImport(buffer: Buffer, sheetName: string): {
  rows: ParsedRow[];
  failed_rows: Array<{ row: number; reason: string }>;
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const resolved = resolveSheetName(workbook, sheetName);
  const sheet = workbook.Sheets[resolved];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRowIndex = -1;
  let nameCol = -1;
  let payrollCol = -1;
  let paidCol = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const headers = (rows[i] || []).map(normalizeHeader);
    const n = findColumnIndex(headers, NAME_ALIASES);
    const p = findColumnIndex(headers, PAYROLL_ALIASES);
    const a = findFirstAmountColumn(headers);
    if (p >= 0 && a >= 0) {
      headerRowIndex = i;
      nameCol = n;
      payrollCol = p;
      paidCol = a;
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new Error('Invalid file structure: expected Payroll and Amount columns');
  }

  return parseSheetRows(rows, headerRowIndex, nameCol, payrollCol, paidCol, false);
}

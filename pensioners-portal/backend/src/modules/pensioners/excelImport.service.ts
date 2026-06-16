import * as XLSX from 'xlsx';
import pool from '../../database/db';
import { calculateFees } from './formulas';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface ParsedPensionerRow {
  full_name: string;
  payroll_number: string;
  paid_amount: number;
  row_number: number;
}

export interface ImportSummary {
  total_records: number;
  new_pensioners: number;
  updated_pensioners: number;
  missing_payroll_numbers: string[];
  missing_count: number;
  failed_rows: Array<{ row: number; reason: string }>;
  batch_id: number;
}

const NAME_ALIASES = ['names', 'name', 'full name', 'fullname'];
const PAYROLL_ALIASES = ['payroll number', 'payroll no', 'payroll', 'payroll_number'];

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h));
}

/** First column (left to right) whose header contains "amount" */
function findFirstAmountColumn(headers: string[]): number {
  return headers.findIndex((h) => h.includes('amount'));
}

function parsePaidAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}

export function parsePensionersSheet(buffer: Buffer): {
  rows: ParsedPensionerRow[];
  failed_rows: Array<{ row: number; reason: string }>;
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName =
    workbook.SheetNames.find((s) => s.toLowerCase() === 'pensioners') ||
    workbook.SheetNames.find((s) => s.toLowerCase().includes('pension')) ||
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRowIndex = -1;
  let nameCol = -1;
  let payrollCol = -1;
  let paidCol = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const headers = (rows[i] || []).map(normalizeHeader);
    const n = findColumnIndex(headers, NAME_ALIASES);
    const p = findColumnIndex(headers, PAYROLL_ALIASES);
    const a = findFirstAmountColumn(headers);
    if (n >= 0 && p >= 0 && a >= 0) {
      headerRowIndex = i;
      nameCol = n;
      payrollCol = p;
      paidCol = a;
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new Error('Invalid file structure: expected columns Name, Payroll, and Amount');
  }

  const parsed: ParsedPensionerRow[] = [];
  const failed_rows: Array<{ row: number; reason: string }> = [];
  const seenPayrolls = new Map<string, number>();

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const rowNumber = i + 1;
    const full_name = String(row[nameCol] ?? '').trim();
    const payroll_number = String(row[payrollCol] ?? '').trim();
    const paid_amount = parsePaidAmount(row[paidCol]);

    if (!full_name && !payroll_number && paid_amount === null) continue;

    if (!full_name || !payroll_number) {
      failed_rows.push({
        row: rowNumber,
        reason: 'Missing full name or payroll number'
      });
      continue;
    }

    if (paid_amount === null) {
      failed_rows.push({
        row: rowNumber,
        reason: 'Invalid or missing paid amount'
      });
      continue;
    }

    if (seenPayrolls.has(payroll_number)) {
      failed_rows.push({
        row: rowNumber,
        reason: `Duplicate payroll number (first seen row ${seenPayrolls.get(payroll_number)})`
      });
      continue;
    }

    seenPayrolls.set(payroll_number, rowNumber);
    parsed.push({
      full_name,
      payroll_number,
      paid_amount,
      row_number: rowNumber
    });
  }

  return { rows: parsed, failed_rows };
}

export async function importPensionersExcel(options: {
  buffer: Buffer;
  filename: string;
  month: number;
  year: number;
  uploadedBy?: string;
}): Promise<ImportSummary> {
  const { rows, failed_rows: parseFailedRows } = parsePensionersSheet(options.buffer);
  const failed_rows: Array<{ row: number; reason: string }> = [...parseFailedRows];
  const missing_payroll_numbers: string[] = [];
  let new_pensioners = 0;
  let updated_pensioners = 0;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [batchResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO pensioner_upload_batches
        (filename, uploaded_by, month, year, records_count, new_pensioners, updated_pensioners, failed_rows)
       VALUES (?, ?, ?, ?, 0, 0, 0, 0)`,
      [options.filename, options.uploadedBy || null, options.month, options.year]
    );
    const batchId = batchResult.insertId;

    for (const row of rows) {
      try {
        const [existingRows] = await connection.execute<RowDataPacket[]>(
          'SELECT id, full_name, status FROM pensioners WHERE payroll_number = ?',
          [row.payroll_number]
        );

        let pensionerId: number;

        if (existingRows.length === 0) {
          const [insertResult] = await connection.execute<ResultSetHeader>(
            'INSERT INTO pensioners (full_name, payroll_number, status) VALUES (?, ?, ?)',
            [row.full_name, row.payroll_number, 'active']
          );
          pensionerId = insertResult.insertId;
          new_pensioners++;
        } else {
          pensionerId = existingRows[0].id as number;
          await connection.execute(
            'UPDATE pensioners SET full_name = ? WHERE id = ?',
            [row.full_name, pensionerId]
          );
          updated_pensioners++;
        }

        const fees = calculateFees(row.paid_amount);

        await connection.execute(
          `INSERT INTO pensioner_monthly_collections
            (pensioner_id, collection_month, collection_year, paid_amount,
             commission, admin_fee, collection_fee, net_premium, wht, bona_life, uploaded_batch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             paid_amount = VALUES(paid_amount),
             commission = VALUES(commission),
             admin_fee = VALUES(admin_fee),
             collection_fee = VALUES(collection_fee),
             net_premium = VALUES(net_premium),
             wht = VALUES(wht),
             bona_life = VALUES(bona_life),
             uploaded_batch_id = VALUES(uploaded_batch_id)`,
          [
            pensionerId,
            options.month,
            options.year,
            fees.paid_amount,
            fees.commission,
            fees.admin_fee,
            fees.collection_fee,
            fees.net_premium,
            fees.wht,
            fees.bona_life,
            batchId
          ]
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Import failed';
        failed_rows.push({ row: row.row_number, reason: message });
      }
    }

    const uploadedPayrolls = rows.map((r) => r.payroll_number);
    if (uploadedPayrolls.length > 0) {
      const placeholders = uploadedPayrolls.map(() => '?').join(', ');
      const [missingRows] = await connection.execute<RowDataPacket[]>(
        `SELECT payroll_number FROM pensioners
         WHERE status = 'active' AND payroll_number NOT IN (${placeholders})`,
        uploadedPayrolls
      );
      missing_payroll_numbers.push(
        ...missingRows.map((r) => String(r.payroll_number))
      );
    }

    const summary = {
      total_records: rows.length,
      new_pensioners,
      updated_pensioners,
      missing_payroll_numbers,
      missing_count: missing_payroll_numbers.length,
      failed_rows,
      batch_id: batchId
    };

    await connection.execute(
      `UPDATE pensioner_upload_batches
       SET records_count = ?, new_pensioners = ?, updated_pensioners = ?, failed_rows = ?, summary_json = ?
       WHERE id = ?`,
      [
        rows.length,
        new_pensioners,
        updated_pensioners,
        failed_rows.length,
        JSON.stringify(summary),
        batchId
      ]
    );

    await connection.commit();
    return summary;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

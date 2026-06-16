import pool from '../../database/db';
import membersPool from '../../database/membersDb';
import { parseSheetForImport } from './excelImport.service';
import { findMembersByPayrolls, calculateNetPremium, compareCollectionAmounts } from './members.service';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const MEMBERS_TABLE = '`Members-New`';

export interface ImportSummary {
  total_records: number;
  imported: number;
  updated: number;
  matched: number;
  failed: number;
  missing_count: number;
  missing_payroll_numbers: string[];
  failed_rows: Array<{ row: number; payroll?: string; reason: string }>;
  batch_id: number;
  comparison_summary?: {
    match: number;
    underpaid: number;
    overpaid: number;
  };
}

export async function importCollectionsExcel(options: {
  buffer: Buffer;
  filename: string;
  sheetName: string;
  month: number;
  year: number;
  uploadedBy?: string;
}): Promise<ImportSummary> {
  const { rows, failed_rows: parseFailed } = parseSheetForImport(options.buffer, options.sheetName);
  const failed_rows: ImportSummary['failed_rows'] = parseFailed.map((f) => ({
    row: f.row,
    reason: f.reason,
  }));

  let imported = 0;
  let updated = 0;
  let matched = 0;
  let matchCount = 0;
  let underpaidCount = 0;
  let overpaidCount = 0;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [batchResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO tombstone_upload_batches
        (filename, sheet_name, uploaded_by, month, year, total_rows, successful_rows, matched_rows, failed_rows)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0)`,
      [
        options.filename,
        options.sheetName,
        options.uploadedBy || null,
        options.month,
        options.year,
      ]
    );
    const batchId = batchResult.insertId;

    const payrollList = rows.map((r) => r.payroll_number);
    const memberMap = await findMembersByPayrolls(payrollList);

    for (const row of rows) {
      try {
        const member = memberMap.get(row.payroll_number) || null;
        if (!member) {
          failed_rows.push({
            row: row.row_number,
            payroll: row.payroll_number,
            reason: 'Unknown payroll number — not found in Members-New',
          });
          continue;
        }

        matched++;

        const expectedAmount = calculateNetPremium(member);
        const { difference, status } = compareCollectionAmounts(row.paid_amount, expectedAmount);
        if (status === 'match') matchCount++;
        else if (status === 'underpaid') underpaidCount++;
        else overpaidCount++;

        const [existing] = await connection.execute<RowDataPacket[]>(
          `SELECT id FROM tombstone_monthly_collections
           WHERE member_payroll_number = ? AND collection_month = ? AND collection_year = ?`,
          [row.payroll_number, options.month, options.year]
        );

        if (existing.length > 0) {
          await connection.execute(
            `UPDATE tombstone_monthly_collections
             SET paid_amount = ?, expected_amount = ?, amount_difference = ?, comparison_status = ?,
                 member_id = ?, upload_batch_id = ?
             WHERE id = ?`,
            [
              row.paid_amount,
              expectedAmount,
              difference,
              status,
              member.MemberID,
              batchId,
              existing[0].id,
            ]
          );
          updated++;
        } else {
          await connection.execute(
            `INSERT INTO tombstone_monthly_collections
              (member_payroll_number, member_id, collection_month, collection_year,
               paid_amount, expected_amount, amount_difference, comparison_status, upload_batch_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.payroll_number,
              member.MemberID,
              options.month,
              options.year,
              row.paid_amount,
              expectedAmount,
              difference,
              status,
              batchId,
            ]
          );
          imported++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Import failed';
        failed_rows.push({
          row: row.row_number,
          payroll: row.payroll_number,
          reason: message,
        });
      }
    }

    const uploadedPayrolls = rows
      .filter((r) => !failed_rows.some((f) => f.payroll === r.payroll_number && f.row === r.row_number))
      .map((r) => r.payroll_number);

    const missing_payroll_numbers = await getMissingPayrolls(
      uploadedPayrolls,
      options.month,
      options.year
    );

    const summary: ImportSummary = {
      total_records: rows.length,
      imported,
      updated,
      matched,
      failed: failed_rows.length,
      missing_count: missing_payroll_numbers.length,
      missing_payroll_numbers,
      failed_rows,
      batch_id: batchId,
      comparison_summary: {
        match: matchCount,
        underpaid: underpaidCount,
        overpaid: overpaidCount,
      },
    };

    await connection.execute(
      `UPDATE tombstone_upload_batches
       SET total_rows = ?, successful_rows = ?, matched_rows = ?, failed_rows = ?, summary_json = ?
       WHERE id = ?`,
      [
        rows.length,
        imported + updated,
        matched,
        failed_rows.length,
        JSON.stringify(summary),
        batchId,
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

export async function getMissingPayrolls(
  uploadedPayrolls: string[],
  month: number,
  year: number
): Promise<string[]> {
  const [excludedRows] = await pool.execute<RowDataPacket[]>(
    'SELECT payroll_number FROM tombstone_member_exclusions'
  );
  const excluded = new Set(excludedRows.map((r) => String(r.payroll_number)));

  const [activeMembers] = await membersPool.execute<RowDataPacket[]>(
    `SELECT PayrollNumber FROM ${MEMBERS_TABLE}
     WHERE LOWER(TRIM(Standing)) = 'active'`
  );

  const [collectedRows] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT member_payroll_number FROM tombstone_monthly_collections
     WHERE collection_month = ? AND collection_year = ?`,
    [month, year]
  );
  const collected = new Set(collectedRows.map((r) => String(r.member_payroll_number)));
  uploadedPayrolls.forEach((p) => collected.add(p));

  return activeMembers
    .map((m) => String(m.PayrollNumber))
    .filter((p) => p && !collected.has(p) && !excluded.has(p));
}

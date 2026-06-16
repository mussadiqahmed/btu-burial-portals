import membersPool from '../../database/membersDb';
import pool from '../../database/db';
import type { RowDataPacket } from 'mysql2/promise';

const MEMBERS_TABLE = '`Members-New`';

export type DependentRecord = {
  index: number;
  name: string;
  surname: string;
  first_name: string;
  relationship: string;
  gender: string;
  age: string;
  premium: string;
  cover: string;
  package_name: string;
};

export type BeneficiaryRecord = {
  index: number;
  name: string;
  surname: string;
  first_name: string;
  relationship: string;
  gender: string;
  age: string;
  premium: string;
  cover: string;
  package_name: string;
};

function pickField(row: RowDataPacket, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

export function memberFullName(row: RowDataPacket): string {
  const first = String(row.FirstName || '').trim();
  const surname = String(row.Surname || '').trim();
  const initials = String(row.Initials || '').trim();
  if (first && surname) return `${first} ${surname}`.trim();
  if (surname) return surname;
  return first || initials || 'Unknown';
}

export function isActiveStanding(standing: unknown): boolean {
  return String(standing || '').trim().toLowerCase() === 'active';
}

/** Matches PHP empty() for premium fields — excludes 0, "0", null, "" */
function isNonEmptyNumericPremium(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const trimmed = String(value).trim();
  if (trimmed === '') return false;
  if (trimmed === '0' || trimmed === '0.0' || trimmed === '0.00') return false;
  const num = Number(trimmed);
  return Number.isFinite(num);
}

/**
 * Net Premium — mirrors btu-web/member-profile.php lines 47–59.
 * Premium + sum of C1Premium..C20Premium (non-empty numeric slots).
 */
export function calculateNetPremium(member: RowDataPacket): number {
  const principal = Number(member.Premium);
  let net = Number.isFinite(principal) ? principal : 0;

  for (let i = 1; i <= 20; i++) {
    const field = `C${i}Premium`;
    const value = member[field];
    if (isNonEmptyNumericPremium(value)) {
      net += Number(String(value).trim());
    }
  }

  return Math.round(net * 100) / 100;
}

export type CollectionComparisonStatus = 'match' | 'underpaid' | 'overpaid';

export function compareCollectionAmounts(
  paidAmount: number,
  expectedAmount: number
): { difference: number; status: CollectionComparisonStatus } {
  const paid = Math.round(paidAmount * 100) / 100;
  const expected = Math.round(expectedAmount * 100) / 100;
  const difference = Math.round((paid - expected) * 100) / 100;

  if (Math.abs(difference) < 0.01) {
    return { difference: 0, status: 'match' };
  }
  if (paid < expected) {
    return { difference, status: 'underpaid' };
  }
  return { difference, status: 'overpaid' };
}

export async function sumNetPremiumForActiveMembers(): Promise<number> {
  const excluded = await getExcludedPayrolls();
  const [rows] = await membersPool.execute<RowDataPacket[]>(
    `SELECT * FROM ${MEMBERS_TABLE} WHERE LOWER(TRIM(Standing)) = 'active'`
  );

  let total = 0;
  for (const row of rows) {
    const payroll = String(row.PayrollNumber || '');
    if (!payroll || excluded.has(payroll)) continue;
    total += calculateNetPremium(row);
  }

  return Math.round(total * 100) / 100;
}

export async function findMemberByPayroll(payrollNumber: string): Promise<RowDataPacket | null> {
  const [rows] = await membersPool.execute<RowDataPacket[]>(
    `SELECT * FROM ${MEMBERS_TABLE} WHERE PayrollNumber = ? LIMIT 1`,
    [payrollNumber.trim()]
  );
  return rows[0] || null;
}

export async function findMembersByPayrolls(payrolls: string[]): Promise<Map<string, RowDataPacket>> {
  const map = new Map<string, RowDataPacket>();
  if (!payrolls.length) return map;

  const unique = [...new Set(payrolls.map((p) => p.trim()).filter(Boolean))];
  const chunkSize = 500;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(', ');
    const [rows] = await membersPool.execute<RowDataPacket[]>(
      `SELECT * FROM ${MEMBERS_TABLE} WHERE PayrollNumber IN (${placeholders})`,
      chunk
    );
    for (const row of rows) {
      map.set(String(row.PayrollNumber), row);
    }
  }

  return map;
}

export async function getMemberById(memberId: number): Promise<RowDataPacket | null> {
  const [rows] = await membersPool.execute<RowDataPacket[]>(
    `SELECT * FROM ${MEMBERS_TABLE} WHERE MemberID = ? LIMIT 1`,
    [memberId]
  );
  return rows[0] || null;
}

export async function listMembers(options: {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: RowDataPacket[]; total: number }> {
  const limit = Math.min(options.limit || 100, 10000);
  const offset = options.offset || 0;
  const params: string[] = [];
  const conditions: string[] = [];

  if (options.status === 'active') {
    conditions.push("LOWER(TRIM(Standing)) = 'active'");
  } else if (options.status === 'inactive') {
    conditions.push("LOWER(TRIM(Standing)) <> 'active'");
  }

  if (options.search) {
    conditions.push(`(
      PayrollNumber LIKE ? OR Surname LIKE ? OR FirstName LIKE ?
      OR IdNumber LIKE ? OR PackageName LIKE ?
    )`);
    const q = `%${options.search}%`;
    params.push(q, q, q, q, q);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await membersPool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM ${MEMBERS_TABLE} ${where}`,
    params
  );

  const [rows] = await membersPool.execute<RowDataPacket[]>(
    `SELECT MemberID, PayrollNumber, Surname, FirstName, Initials, Premium, Cover,
            PackageName, Standing, CreatedDate, UpdatedDate, DOB, IdNumber, Gender, Age
     FROM ${MEMBERS_TABLE} ${where}
     ORDER BY Surname ASC, FirstName ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { rows, total: Number(countRows[0]?.cnt || 0) };
}

export async function getExcludedPayrolls(): Promise<Set<string>> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT payroll_number FROM tombstone_member_exclusions'
  );
  return new Set(rows.map((r: RowDataPacket) => String(r.payroll_number)));
}

function buildPersonRecord(
  member: RowDataPacket,
  index: number,
  prefix: string
): DependentRecord | null {
  const surname = pickField(member, [`${prefix}${index}Surname`, `${prefix}${index}SurName`]);
  const firstName = pickField(member, [`${prefix}${index}FirstName`, `${prefix}${index}Name`]);
  const relationship = pickField(member, [
    `${prefix}${index}Relationship`,
    `${prefix}${index}Rel`,
    `${prefix}${index}Relation`,
  ]);
  const gender = pickField(member, [`${prefix}${index}Gender`, `${prefix}${index}Sex`]);
  const age = pickField(member, [`${prefix}${index}Age`]);
  const premium = pickField(member, [`${prefix}${index}Premium`]);
  const cover = pickField(member, [`${prefix}${index}Cover`]);
  const package_name = pickField(member, [
    `${prefix}${index}PackageName`,
    `${prefix}${index}Package`,
  ]);

  if (!surname && !firstName && !relationship) return null;

  const name = `${firstName} ${surname}`.trim() || firstName || surname;
  return {
    index,
    name,
    surname,
    first_name: firstName,
    relationship,
    gender,
    age,
    premium,
    cover,
    package_name,
  };
}

export function parseDependents(member: RowDataPacket): DependentRecord[] {
  const deps: DependentRecord[] = [];
  for (let i = 1; i <= 20; i++) {
    const record = buildPersonRecord(member, i, 'C');
    if (record) deps.push(record);
  }
  return deps;
}

export function parseBeneficiaries(member: RowDataPacket): BeneficiaryRecord[] {
  const beneficiaries: BeneficiaryRecord[] = [];

  for (let i = 1; i <= 10; i++) {
    const record = buildPersonRecord(member, i, 'B');
    if (record) beneficiaries.push(record);
  }

  for (let i = 1; i <= 10; i++) {
    const record = buildPersonRecord(member, i, 'Ben');
    if (record) beneficiaries.push({ ...record, index: i + 100 });
  }

  const keys = Object.keys(member);
  for (const key of keys) {
    const match = key.match(/^Beneficiary(\d+)(Surname|FirstName|Name)$/i);
    if (!match) continue;
    const idx = parseInt(match[1], 10);
    const record = buildPersonRecord(member, idx, 'Beneficiary');
    if (record && !beneficiaries.some((b) => b.name === record.name && b.surname === record.surname)) {
      beneficiaries.push({ ...record, index: idx + 200 });
    }
  }

  return beneficiaries;
}

export async function countMembersByStanding(): Promise<{ total: number; active: number; inactive: number }> {
  const [rows] = await membersPool.execute<RowDataPacket[]>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN LOWER(TRIM(Standing)) = 'active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN LOWER(TRIM(Standing)) <> 'active' THEN 1 ELSE 0 END) AS inactive
    FROM ${MEMBERS_TABLE}
  `);
  return {
    total: Number(rows[0]?.total || 0),
    active: Number(rows[0]?.active || 0),
    inactive: Number(rows[0]?.inactive || 0),
  };
}

import { Router } from 'express';
import pool from '../../database/db';
import membersPool from '../../database/membersDb';
import { requireAccess, requireWrite } from '../../middleware/permissions';
import {
  listMembers,
  getMemberById,
  findMemberByPayroll,
  memberFullName,
  isActiveStanding,
  parseDependents,
  parseBeneficiaries,
  countMembersByStanding,
  getExcludedPayrolls,
  calculateNetPremium,
  sumNetPremiumForActiveMembers,
} from './members.service';
import {
  listWorkbookSheets,
  previewSheet,
} from './excelImport.service';
import { importCollectionsExcel, getMissingPayrolls } from './collectionsImport.service';
import type { RowDataPacket } from 'mysql2/promise';

const router = Router();
const MEMBERS_TABLE = '`Members-New`';

router.use(requireAccess);

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function previousPeriod(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

router.get('/dashboard', async (req, res) => {
  try {
    const defaults = currentPeriod();
    const month = parseInt(String(req.query.month || defaults.month));
    const year = parseInt(String(req.query.year || defaults.year));
    const prev = previousPeriod(month, year);

    const standing = await countMembersByStanding();

    const [currentMonth] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(c.paid_amount), 0) AS total_paid,
              COUNT(DISTINCT c.member_payroll_number) AS collected_count
       FROM tombstone_monthly_collections c
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [month, year]
    );

    const [prevMonth] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(c.paid_amount), 0) AS total_paid
       FROM tombstone_monthly_collections c
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [prev.month, prev.year]
    );

    const currentPaid = Number(currentMonth[0]?.total_paid || 0);
    const prevPaid = Number(prevMonth[0]?.total_paid || 0);
    const growth =
      prevPaid > 0 ? ((currentPaid - prevPaid) / prevPaid) * 100 : currentPaid > 0 ? 100 : 0;

    const collected = Number(currentMonth[0]?.collected_count || 0);

    const missingPayrolls = await getMissingPayrolls([], month, year);
    const missingCount = missingPayrolls.length;

    const expectedTotal = await sumNetPremiumForActiveMembers();
    const collectionsDifference = Math.round((currentPaid - expectedTotal) * 100) / 100;

    const [underpaidRow] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM tombstone_monthly_collections
       WHERE collection_month = ? AND collection_year = ? AND comparison_status = 'underpaid'`,
      [month, year]
    );
    const underpaidCount = Number(underpaidRow[0]?.cnt || 0);

    const [trends] = await pool.execute<RowDataPacket[]>(`
      SELECT c.collection_year AS year, c.collection_month AS month,
             SUM(c.paid_amount) AS total_paid,
             COALESCE(SUM(c.expected_amount), 0) AS total_expected,
             COUNT(DISTINCT c.member_payroll_number) AS member_count
      FROM tombstone_monthly_collections c
      GROUP BY c.collection_year, c.collection_month
      ORDER BY c.collection_year DESC, c.collection_month DESC
      LIMIT 12
    `);

    res.json({
      summary: {
        total_members: standing.total,
        active_members: standing.active,
        inactive_members: standing.inactive,
        current_month_paid: currentPaid,
        previous_month_paid: prevPaid,
        growth_percentage: Math.round(growth * 100) / 100,
        collected_this_month: collected,
        not_collected_this_month: missingCount,
        missing_collections_count: missingCount,
        expected_collections_total: expectedTotal,
        collections_difference: collectionsDifference,
        underpaid_count: underpaidCount,
        period: { month, year },
      },
      trends: trends.reverse().map((t) => ({
        ...t,
        paid_amount: t.total_paid,
        expected_amount: t.total_expected,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ detail: 'Failed to load dashboard' });
  }
});

router.get('/members', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = parseInt(String(req.query.limit || 50));
    const offset = parseInt(String(req.query.offset || 0));

    const { rows, total } = await listMembers({
      status: status === 'active' || status === 'inactive' ? status : 'all',
      search,
      limit,
      offset,
    });

    const excluded = await getExcludedPayrolls();
    const payrolls = rows.map((r) => String(r.PayrollNumber));

    let latestPayments: Record<string, { amount: number; month: number; year: number }> = {};
    if (payrolls.length > 0) {
      const placeholders = payrolls.map(() => '?').join(', ');
      const [payments] = await pool.execute<RowDataPacket[]>(
        `SELECT member_payroll_number, paid_amount, collection_month, collection_year
         FROM tombstone_monthly_collections
         WHERE member_payroll_number IN (${placeholders})
         ORDER BY collection_year DESC, collection_month DESC`,
        payrolls
      );
      for (const p of payments) {
        const key = String(p.member_payroll_number);
        if (!latestPayments[key]) {
          latestPayments[key] = {
            amount: Number(p.paid_amount),
            month: Number(p.collection_month),
            year: Number(p.collection_year),
          };
        }
      }
    }

    const mapped = rows.map((r) => {
      const payroll = String(r.PayrollNumber);
      const standingActive = isActiveStanding(r.Standing);
      const portalExcluded = excluded.has(payroll);
      const latest = latestPayments[payroll];
      return {
        id: r.MemberID,
        member_id: r.MemberID,
        payroll_number: payroll,
        full_name: memberFullName(r),
        premium: r.Premium,
        cover: r.Cover,
        package_name: r.PackageName,
        standing: r.Standing,
        status: portalExcluded ? 'excluded' : standingActive ? 'active' : 'inactive',
        is_active: standingActive && !portalExcluded,
        latest_payment: latest?.amount ?? null,
        latest_payment_period: latest
          ? { month: latest.month, year: latest.year }
          : null,
      };
    });

    res.json({ rows: mapped, total });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ detail: 'Failed to fetch members' });
  }
});


router.get('/members/:id', async (req, res) => {
  try {
    const param = String(req.params.id).trim();
    const numericId = parseInt(param, 10);
    let member =
      Number.isFinite(numericId) && /^\d+$/.test(param)
        ? await getMemberById(numericId)
        : null;
    if (!member) {
      member = await findMemberByPayroll(param);
    }
    if (!member) {
      return res.status(404).json({ detail: 'Member not found' });
    }

    const excluded = await getExcludedPayrolls();
    const payroll = String(member.PayrollNumber);

    const [collections] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM tombstone_monthly_collections
       WHERE member_payroll_number = ?
       ORDER BY collection_year DESC, collection_month DESC`,
      [payroll]
    );

    const dependents = parseDependents(member);
    const beneficiaries = parseBeneficiaries(member);

    const standingActive = isActiveStanding(member.Standing);
    const portalExcluded = excluded.has(payroll);
    const netPremium = calculateNetPremium(member);

    const latestCollection = collections[0]
      ? {
          ...collections[0],
          paid_amount: collections[0].paid_amount,
          expected_amount: collections[0].expected_amount,
          amount_difference: collections[0].amount_difference,
          comparison_status: collections[0].comparison_status,
        }
      : null;

    res.json({
      member: {
        id: member.MemberID,
        member_id: member.MemberID,
        payroll_number: payroll,
        full_name: memberFullName(member),
        surname: member.Surname,
        first_name: member.FirstName,
        initials: member.Initials,
        dob: member.DOB,
        id_number: member.IdNumber,
        gender: member.Gender,
        age: member.Age,
        premium: member.Premium,
        net_premium: netPremium,
        cover: member.Cover,
        package_name: member.PackageName,
        standing: member.Standing,
        status: portalExcluded ? 'excluded' : standingActive ? 'active' : 'inactive',
        created_date: member.CreatedDate,
        updated_date: member.UpdatedDate,
        dependents,
        beneficiaries,
        latest_paid_amount: latestCollection?.paid_amount ?? null,
        latest_expected_amount: latestCollection?.expected_amount ?? netPremium,
        latest_difference: latestCollection?.amount_difference ?? null,
        latest_comparison_status: latestCollection?.comparison_status ?? null,
      },
      collections,
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ detail: 'Failed to fetch member' });
  }
});


router.post('/members/:id/exclude', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const member = await getMemberById(id);
    if (!member) return res.status(404).json({ detail: 'Member not found' });

    const payroll = String(member.PayrollNumber);
    const username = req.body.excluded_by || req.headers['x-user-role'] || 'system';

    await pool.execute(
      `INSERT INTO tombstone_member_exclusions (payroll_number, excluded_by)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE excluded_by = VALUES(excluded_by)`,
      [payroll, username]
    );

    res.json({ success: true, message: 'Member excluded from portal analytics' });
  } catch (error) {
    console.error('Exclude member error:', error);
    res.status(500).json({ detail: 'Failed to exclude member' });
  }
});

router.post('/members/:id/activate', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const member = await getMemberById(id);
    if (!member) return res.status(404).json({ detail: 'Member not found' });

    await pool.execute('DELETE FROM tombstone_member_exclusions WHERE payroll_number = ?', [
      String(member.PayrollNumber),
    ]);

    res.json({ success: true, message: 'Member re-included in portal analytics' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to activate member' });
  }
});

router.post('/members/:id/deactivate', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const member = await getMemberById(id);
    if (!member) return res.status(404).json({ detail: 'Member not found' });

    const payroll = String(member.PayrollNumber);
    const username = req.body.excluded_by || 'system';

    await pool.execute(
      `INSERT INTO tombstone_member_exclusions (payroll_number, excluded_by)
       VALUES (?, ?) ON DUPLICATE KEY UPDATE excluded_by = VALUES(excluded_by)`,
      [payroll, username]
    );

    res.json({ success: true, message: 'Member excluded from portal analytics' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to deactivate member' });
  }
});

router.post('/upload/sheets', requireWrite, async (req, res) => {
  try {
    const { file_base64, filename } = req.body;
    if (!file_base64 || !filename) {
      return res.status(400).json({ detail: 'file_base64 and filename are required' });
    }
    if (!String(filename).toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ detail: 'Only .xlsx files are supported' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const sheets = listWorkbookSheets(buffer);

    res.json({ sheets, auto_select: sheets.length === 1 ? sheets[0] : null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read workbook';
    res.status(400).json({ detail: message });
  }
});

router.post('/upload/preview', requireWrite, async (req, res) => {
  try {
    const { file_base64, filename, sheet_name } = req.body;
    if (!file_base64 || !filename || !sheet_name) {
      return res.status(400).json({ detail: 'file_base64, filename, and sheet_name are required' });
    }
    if (!String(filename).toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ detail: 'Only .xlsx files are supported' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const preview = previewSheet(buffer, sheet_name);
    res.json(preview);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Preview failed';
    res.status(400).json({ detail: message });
  }
});

router.post('/upload', requireWrite, async (req, res) => {
  try {
    const { file_base64, filename, month, year, sheet_name, uploaded_by } = req.body;

    if (!file_base64 || !filename || !month || !year || !sheet_name) {
      return res.status(400).json({
        detail: 'file_base64, filename, month, year, and sheet_name are required',
      });
    }

    if (!String(filename).toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ detail: 'Only .xlsx files are supported' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const summary = await importCollectionsExcel({
      buffer,
      filename,
      sheetName: sheet_name,
      month: parseInt(String(month)),
      year: parseInt(String(year)),
      uploadedBy: uploaded_by,
    });

    res.json({ success: true, summary });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    res.status(400).json({ detail: message });
  }
});

router.get('/uploads', async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, filename, sheet_name, upload_date, uploaded_by, month, year,
              total_rows AS records_count, successful_rows, matched_rows AS matched_rows,
              failed_rows, summary_json
       FROM tombstone_upload_batches ORDER BY upload_date DESC LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    console.error('Uploads list error:', error);
    res.status(500).json({ detail: 'Failed to fetch uploads' });
  }
});

router.get('/reports/monthly', async (req, res) => {
  try {
    const month = parseInt(String(req.query.month || currentPeriod().month));
    const year = parseInt(String(req.query.year || currentPeriod().year));
    const search = String(req.query.search || '').trim();
    const limit = Math.min(parseInt(String(req.query.limit || 5000)), 10000);
    const offset = parseInt(String(req.query.offset || 0));

    const [totals] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT c.member_payroll_number) AS member_count,
              COALESCE(SUM(c.paid_amount), 0) AS total_paid,
              COALESCE(SUM(c.expected_amount), 0) AS total_expected,
              COALESCE(SUM(c.amount_difference), 0) AS total_difference
       FROM tombstone_monthly_collections c
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [month, year]
    );

    const webDb = process.env.BTU_WEB_DB_NAME || 'btuburia_web';

    let sql = `
      SELECT c.*, m.Surname, m.FirstName, m.Initials, m.Standing, m.PackageName
      FROM tombstone_monthly_collections c
      LEFT JOIN \`${webDb}\`.\`Members-New\` m ON m.PayrollNumber = c.member_payroll_number
      WHERE c.collection_month = ? AND c.collection_year = ?
    `;
    const params: (string | number)[] = [month, year];

    if (search) {
      sql += ` AND (c.member_payroll_number LIKE ? OR m.Surname LIKE ? OR m.FirstName LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY m.Surname ASC, m.FirstName ASC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    const mapped = rows.map((r) => ({
      full_name: memberFullName(r),
      payroll_number: r.member_payroll_number,
      paid_amount: r.paid_amount,
      expected_amount: r.expected_amount,
      amount_difference: r.amount_difference,
      comparison_status: r.comparison_status,
      package_name: r.PackageName,
      standing: r.Standing,
      collection_month: r.collection_month,
      collection_year: r.collection_year,
    }));

    res.json({
      period: { month, year },
      totals: totals[0],
      rows: mapped,
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ detail: 'Failed to generate monthly report' });
  }
});

router.get('/reports/missing', async (req, res) => {
  try {
    const month = parseInt(String(req.query.month || currentPeriod().month));
    const year = parseInt(String(req.query.year || currentPeriod().year));
    const search = String(req.query.search || '').trim();

    const missingPayrolls = await getMissingPayrolls([], month, year);

    if (missingPayrolls.length === 0) {
      return res.json({ period: { month, year }, count: 0, rows: [] });
    }

    const placeholders = missingPayrolls.map(() => '?').join(', ');
    let sql = `
      SELECT *
      FROM ${MEMBERS_TABLE}
      WHERE PayrollNumber IN (${placeholders})
    `;
    const params: string[] = [...missingPayrolls];

    if (search) {
      sql += ` AND (PayrollNumber LIKE ? OR Surname LIKE ? OR FirstName LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY Surname ASC, FirstName ASC';

    const [rows] = await membersPool.execute<RowDataPacket[]>(sql, params);

    const mapped = rows.map((r) => ({
      id: r.MemberID,
      full_name: memberFullName(r),
      payroll_number: r.PayrollNumber,
      standing: r.Standing,
      premium: r.Premium,
      net_premium: calculateNetPremium(r),
      package_name: r.PackageName,
      status: 'missing_payment',
    }));

    res.json({ period: { month, year }, count: mapped.length, rows: mapped });
  } catch (error) {
    console.error('Missing report error:', error);
    res.status(500).json({ detail: 'Failed to generate missing payments report' });
  }
});

router.get('/reports/inactive', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();

    let sql = `
      SELECT MemberID, PayrollNumber, Surname, FirstName, Initials, Standing, Premium, PackageName, UpdatedDate
      FROM ${MEMBERS_TABLE}
      WHERE LOWER(TRIM(Standing)) <> 'active'
    `;
    const params: string[] = [];

    if (search) {
      sql += ` AND (PayrollNumber LIKE ? OR Surname LIKE ? OR FirstName LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY Surname ASC, FirstName ASC LIMIT 5000';

    const [rows] = await membersPool.execute<RowDataPacket[]>(sql, params);

    const mapped = rows.map((r) => ({
      id: r.MemberID,
      full_name: memberFullName(r),
      payroll_number: r.PayrollNumber,
      standing: r.Standing,
      premium: r.Premium,
      package_name: r.PackageName,
      status: 'inactive',
      updated_date: r.UpdatedDate,
    }));

    res.json({ count: mapped.length, rows: mapped });
  } catch (error) {
    console.error('Inactive report error:', error);
    res.status(500).json({ detail: 'Failed to generate inactive report' });
  }
});

export default router;

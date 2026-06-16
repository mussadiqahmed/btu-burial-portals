import { Router } from 'express';
import pool from '../../database/db';
import { requireAccess, requireWrite } from '../../middleware/permissions';
import { calculateFees, getFormulaConfig } from './formulas';
import { importPensionersExcel } from './excelImport.service';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.use(requireAccess);

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function previousPeriod(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

// GET /dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const defaults = currentPeriod();
    const month = parseInt(String(req.query.month || defaults.month));
    const year = parseInt(String(req.query.year || defaults.year));
    const prev = previousPeriod(month, year);

    const [totals]: any = await pool.execute(`
      SELECT
        COUNT(*) AS total_pensioners,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_pensioners,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_pensioners
      FROM pensioners
    `);

    const [currentMonth]: any = await pool.execute(
      `SELECT
         COALESCE(SUM(c.paid_amount), 0) AS total_paid,
         COALESCE(SUM(c.net_premium), 0) AS total_net_premium,
         COALESCE(SUM(c.bona_life), 0) AS total_bona_life,
         COUNT(DISTINCT c.pensioner_id) AS collected_count
       FROM pensioner_monthly_collections c
       INNER JOIN pensioners p ON p.id = c.pensioner_id AND p.status = 'active'
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [month, year]
    );

    const [prevMonth]: any = await pool.execute(
      `SELECT COALESCE(SUM(c.paid_amount), 0) AS total_paid
       FROM pensioner_monthly_collections c
       INNER JOIN pensioners p ON p.id = c.pensioner_id AND p.status = 'active'
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [prev.month, prev.year]
    );

    const [activeCount]: any = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM pensioners WHERE status = 'active'"
    );

    const collected = Number(currentMonth[0]?.collected_count || 0);
    const activeTotal = Number(activeCount[0]?.cnt || 0);
    const currentPaid = Number(currentMonth[0]?.total_paid || 0);
    const prevPaid = Number(prevMonth[0]?.total_paid || 0);
    const growth =
      prevPaid > 0 ? ((currentPaid - prevPaid) / prevPaid) * 100 : currentPaid > 0 ? 100 : 0;

    const [missingCount]: any = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM pensioners p
       WHERE p.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM pensioner_monthly_collections c
           WHERE c.pensioner_id = p.id
             AND c.collection_month = ? AND c.collection_year = ?
         )`,
      [month, year]
    );

    const [trends]: any = await pool.execute(`
      SELECT c.collection_year AS year, c.collection_month AS month,
             SUM(c.paid_amount) AS total_paid,
             SUM(c.commission) AS total_commission,
             SUM(c.net_premium) AS total_net_premium,
             SUM(c.bona_life) AS total_bona_life
      FROM pensioner_monthly_collections c
      INNER JOIN pensioners p ON p.id = c.pensioner_id AND p.status = 'active'
      GROUP BY c.collection_year, c.collection_month
      ORDER BY c.collection_year DESC, c.collection_month DESC
      LIMIT 12
    `);

    res.json({
      summary: {
        total_pensioners: Number(totals[0]?.total_pensioners || 0),
        active_pensioners: Number(totals[0]?.active_pensioners || 0),
        inactive_pensioners: Number(totals[0]?.inactive_pensioners || 0),
        current_month_paid: currentPaid,
        previous_month_paid: prevPaid,
        growth_percentage: Math.round(growth * 100) / 100,
        collected_this_month: collected,
        not_collected_this_month: Math.max(activeTotal - collected, 0),
        missing_collections_count: Number(missingCount[0]?.cnt || 0),
        period: { month, year }
      },
      trends: trends.reverse()
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ detail: 'Failed to load dashboard' });
  }
});

// GET /pensioners
router.get('/pensioners', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM pensioner_monthly_collections c WHERE c.pensioner_id = p.id) AS collection_count,
        (SELECT c.paid_amount FROM pensioner_monthly_collections c
         WHERE c.pensioner_id = p.id
         ORDER BY c.collection_year DESC, c.collection_month DESC LIMIT 1) AS last_paid_amount
      FROM pensioners p
    `;
    const params: string[] = [];
    if (status === 'active' || status === 'inactive') {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY p.full_name ASC';

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    res.json(rows);
  } catch (error: any) {
    console.error('List pensioners error:', error);
    res.status(500).json({ detail: 'Failed to fetch pensioners' });
  }
});

// GET /pensioners/:id
router.get('/pensioners/:id', async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [pensioners] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM pensioners WHERE id = ?',
      [id]
    );
    if (pensioners.length === 0) {
      return res.status(404).json({ detail: 'Pensioner not found' });
    }

    const [collections] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM pensioner_monthly_collections
       WHERE pensioner_id = ?
       ORDER BY collection_year DESC, collection_month DESC`,
      [id]
    );

    res.json({ pensioner: pensioners[0], collections });
  } catch (error: any) {
    console.error('Get pensioner error:', error);
    res.status(500).json({ detail: 'Failed to fetch pensioner' });
  }
});

// POST /pensioners
router.post('/pensioners', requireWrite, async (req, res) => {
  try {
    const { full_name, payroll_number, status } = req.body;
    if (!full_name || !payroll_number) {
      return res.status(400).json({ detail: 'full_name and payroll_number are required' });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO pensioners (full_name, payroll_number, status) VALUES (?, ?, ?)',
      [full_name, String(payroll_number).trim(), status === 'inactive' ? 'inactive' : 'active']
    );

    res.status(201).json({ id: result.insertId, message: 'Pensioner created' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: 'Payroll number already exists' });
    }
    console.error('Create pensioner error:', error);
    res.status(500).json({ detail: 'Failed to create pensioner' });
  }
});

// PUT /pensioners/:id
router.put('/pensioners/:id', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { full_name, payroll_number, status } = req.body;

    await pool.execute(
      'UPDATE pensioners SET full_name = ?, payroll_number = ?, status = ? WHERE id = ?',
      [
        full_name,
        String(payroll_number).trim(),
        status === 'inactive' ? 'inactive' : 'active',
        id
      ]
    );

    res.json({ success: true, message: 'Pensioner updated' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: 'Payroll number already exists' });
    }
    console.error('Update pensioner error:', error);
    res.status(500).json({ detail: 'Failed to update pensioner' });
  }
});

// DELETE /pensioners/:id
router.delete('/pensioners/:id', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await pool.execute('DELETE FROM pensioners WHERE id = ?', [id]);
    res.json({ success: true, message: 'Pensioner deleted' });
  } catch (error: any) {
    console.error('Delete pensioner error:', error);
    res.status(500).json({ detail: 'Failed to delete pensioner' });
  }
});

// POST /pensioners/:id/activate
router.post('/pensioners/:id/activate', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await pool.execute("UPDATE pensioners SET status = 'active' WHERE id = ?", [id]);
    res.json({ success: true, message: 'Pensioner activated' });
  } catch (error: any) {
    res.status(500).json({ detail: 'Failed to activate pensioner' });
  }
});

// POST /pensioners/:id/deactivate
router.post('/pensioners/:id/deactivate', requireWrite, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await pool.execute("UPDATE pensioners SET status = 'inactive' WHERE id = ?", [id]);
    res.json({ success: true, message: 'Pensioner deactivated' });
  } catch (error: any) {
    res.status(500).json({ detail: 'Failed to deactivate pensioner' });
  }
});

// POST /upload
router.post('/upload', requireWrite, async (req, res) => {
  try {
    const { file_base64, filename, month, year, uploaded_by } = req.body;

    if (!file_base64 || !filename || !month || !year) {
      return res.status(400).json({
        detail: 'file_base64, filename, month, and year are required'
      });
    }

    if (!String(filename).toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ detail: 'Only .xlsx files are supported' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const summary = await importPensionersExcel({
      buffer,
      filename,
      month: parseInt(String(month)),
      year: parseInt(String(year)),
      uploadedBy: uploaded_by
    });

    res.json({ success: true, summary });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(400).json({ detail: error.message || 'Upload failed' });
  }
});

// GET /uploads
router.get('/uploads', async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM pensioner_upload_batches ORDER BY upload_date DESC LIMIT 100`
    );
    res.json(rows);
  } catch (error: any) {
    console.error('Uploads list error:', error);
    res.status(500).json({ detail: 'Failed to fetch uploads' });
  }
});

// GET /reports/monthly
router.get('/reports/monthly', async (req, res) => {
  try {
    const month = parseInt(String(req.query.month || currentPeriod().month));
    const year = parseInt(String(req.query.year || currentPeriod().year));

    const [totals]: any = await pool.execute(
      `SELECT
         COUNT(DISTINCT c.pensioner_id) AS pensioner_count,
         COALESCE(SUM(c.paid_amount), 0) AS total_paid,
         COALESCE(SUM(c.commission), 0) AS total_commission,
         COALESCE(SUM(c.admin_fee), 0) AS total_admin_fee,
         COALESCE(SUM(c.collection_fee), 0) AS total_collection_fee,
         COALESCE(SUM(c.net_premium), 0) AS total_net_premium,
         COALESCE(SUM(c.wht), 0) AS total_wht,
         COALESCE(SUM(c.bona_life), 0) AS total_bona_life
       FROM pensioner_monthly_collections c
       INNER JOIN pensioners p ON p.id = c.pensioner_id AND p.status = 'active'
       WHERE c.collection_month = ? AND c.collection_year = ?`,
      [month, year]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.full_name, p.payroll_number, c.*
       FROM pensioner_monthly_collections c
       INNER JOIN pensioners p ON p.id = c.pensioner_id
       WHERE c.collection_month = ? AND c.collection_year = ?
       ORDER BY p.full_name ASC`,
      [month, year]
    );

    res.json({
      period: { month, year },
      totals: totals[0],
      rows
    });
  } catch (error: any) {
    console.error('Monthly report error:', error);
    res.status(500).json({ detail: 'Failed to generate monthly report' });
  }
});

// GET /reports/missing
router.get('/reports/missing', async (req, res) => {
  try {
    const month = parseInt(String(req.query.month || currentPeriod().month));
    const year = parseInt(String(req.query.year || currentPeriod().year));

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.full_name, p.payroll_number, p.status
       FROM pensioners p
       WHERE p.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM pensioner_monthly_collections c
           WHERE c.pensioner_id = p.id
             AND c.collection_month = ? AND c.collection_year = ?
         )
       ORDER BY p.full_name ASC`,
      [month, year]
    );

    res.json({ period: { month, year }, count: rows.length, rows });
  } catch (error: any) {
    console.error('Missing report error:', error);
    res.status(500).json({ detail: 'Failed to generate missing collections report' });
  }
});

// GET /reports/inactive
router.get('/reports/inactive', async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*,
        (SELECT MAX(CONCAT(c.collection_year, '-', LPAD(c.collection_month, 2, '0')))
         FROM pensioner_monthly_collections c WHERE c.pensioner_id = p.id) AS last_collection_period
       FROM pensioners p
       WHERE p.status = 'inactive'
       ORDER BY p.full_name ASC`
    );

    res.json({ count: rows.length, rows });
  } catch (error: any) {
    console.error('Inactive report error:', error);
    res.status(500).json({ detail: 'Failed to generate inactive report' });
  }
});

// GET /formulas
router.get('/formulas', (_req, res) => {
  res.json(getFormulaConfig());
});

// POST /calculate-preview
router.post('/calculate-preview', (req, res) => {
  const { paid_amount } = req.body;
  if (paid_amount === undefined || paid_amount === null) {
    return res.status(400).json({ detail: 'paid_amount is required' });
  }
  res.json(calculateFees(Number(paid_amount)));
});

export default router;

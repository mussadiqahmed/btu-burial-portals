import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

function buildDateFilter(
  dateCol: string,
  range: string | undefined,
  startDate?: string,
  endDate?: string
): { filter: string; params: any[] } {
  if (!range || range === 'all') {
    return { filter: '', params: [] };
  }

  const params: any[] = [];
  let filter = '';

  switch (range) {
    case 'today':
      filter = ` AND DATE(${dateCol}) = CURDATE()`;
      break;
    case 'week':
      filter = ` AND YEARWEEK(${dateCol}, 1) = YEARWEEK(CURDATE(), 1)`;
      break;
    case 'month':
      filter = ` AND MONTH(${dateCol}) = MONTH(CURDATE()) AND YEAR(${dateCol}) = YEAR(CURDATE())`;
      break;
    case 'year':
      filter = ` AND YEAR(${dateCol}) = YEAR(CURDATE())`;
      break;
    case 'custom':
      if (startDate && endDate) {
        const start = startDate <= endDate ? startDate : endDate;
        const end = startDate <= endDate ? endDate : startDate;
        filter = ` AND DATE(${dateCol}) BETWEEN ? AND ?`;
        params.push(start, end);
      }
      break;
    case 'date':
      if (startDate) {
        filter = ` AND DATE(${dateCol}) = ?`;
        params.push(startDate);
      }
      break;
  }

  return { filter, params };
}

router.get('/:report_type', async (req, res) => {
  try {
    const { report_type } = req.params;
    const { status_filter, range, startDate, endDate, date } = req.query;
    const rangeStr = typeof range === 'string' ? range : undefined;
    const start = typeof startDate === 'string' ? startDate : (typeof date === 'string' ? date : undefined);
    const end = typeof endDate === 'string' ? endDate : (typeof date === 'string' ? date : undefined);

    if (report_type === 'orders') {
      const dateCol = 'COALESCE(order_date, created_at)';
      const { filter, params } = buildDateFilter(dateCol, rangeStr, start, end);
      let query = 'SELECT * FROM orders WHERE 1=1' + filter;
      const queryParams = [...params];
      if (status_filter) {
        query += ' AND status = ?';
        queryParams.push(status_filter);
      }
      const [rows] = await pool.execute(query, queryParams);
      return res.json(rows);
    }

    if (report_type === 'production') {
      const dateCol = 'COALESCE(o.order_date, o.created_at)';
      const { filter, params } = buildDateFilter(dateCol, rangeStr, start, end);
      const [rows] = await pool.execute(
        `SELECT pw.*, o.client_name, o.design_code, o.design_type
         FROM production_workflow pw
         JOIN orders o ON o.order_id = pw.order_id
         WHERE 1=1${filter}`,
        params
      );
      return res.json(rows);
    }

    if (report_type === 'inventory') {
      // Inventory is a snapshot; date range filters by last stock update when set
      const dateCol = 'COALESCE(last_updated, last_order_date)';
      const { filter, params } = buildDateFilter(dateCol, rangeStr, start, end);
      const [rows] = await pool.execute(
        'SELECT * FROM materials_inventory WHERE 1=1' + filter,
        params
      );
      return res.json(rows);
    }

    if (report_type === 'followup') {
      const dateCol = 'COALESCE(followup_date, created_at)';
      const { filter, params } = buildDateFilter(dateCol, rangeStr, start, end);
      const [rows] = await pool.execute(
        'SELECT * FROM client_followup WHERE 1=1' + filter,
        params
      );
      return res.json(rows);
    }

    if (report_type === 'extras') {
      const dateCol = 'created_at';
      const { filter, params } = buildDateFilter(dateCol, rangeStr, start, end);
      const [rows] = await pool.execute('SELECT * FROM extras WHERE 1=1' + filter, params);
      return res.json(rows);
    }

    return res.status(400).json({ error: 'Invalid report type' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

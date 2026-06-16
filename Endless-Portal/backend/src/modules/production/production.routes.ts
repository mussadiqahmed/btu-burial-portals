import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

const PRODUCTION_FIELDS = [
  'sorting', 'designing', 'cutting', 'grinding', 'polishing',
  'word_engraving', 'blasting', 'sampling', 'installation'
];

router.get('/', async (req, res) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT pw.*, o.client_name, o.design_code, o.design_type, o.status as order_status
      FROM production_workflow pw
      JOIN orders o ON o.order_id = pw.order_id
      ORDER BY pw.order_id DESC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:order_id', async (req, res) => {
  try {
    const orderId = parseInt(Array.isArray(req.params.order_id) ? req.params.order_id[0] : req.params.order_id);
    const [rows]: any = await pool.execute('SELECT * FROM production_workflow WHERE order_id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:order_id', async (req, res) => {
  try {
    const orderId = parseInt(Array.isArray(req.params.order_id) ? req.params.order_id[0] : req.params.order_id);
    const body = req.body;

    const fieldValues = PRODUCTION_FIELDS.map(f => (body[f] ? 1 : 0));
    const setClause = PRODUCTION_FIELDS.map(f => `${f} = ?`).join(', ');

    const [existing]: any = await pool.execute('SELECT order_id FROM production_workflow WHERE order_id = ?', [orderId]);

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO production_workflow (order_id, ${PRODUCTION_FIELDS.join(', ')}) VALUES (?, ${PRODUCTION_FIELDS.map(() => '?').join(', ')})`,
        [orderId, ...fieldValues]
      );
    } else {
      await pool.execute(
        `UPDATE production_workflow SET ${setClause} WHERE order_id = ?`,
        [...fieldValues, orderId]
      );
    }

    const [updatedItem]: any = await pool.execute('SELECT * FROM production_workflow WHERE order_id = ?', [orderId]);
    res.json(updatedItem[0]);
  } catch (error: any) {
    console.error('Production update error:', error);
    res.status(500).json({
      error: error.message,
      hint: 'Run migration_v2_amendments.sql section 4 to add production_workflow columns.'
    });
  }
});

export default router;

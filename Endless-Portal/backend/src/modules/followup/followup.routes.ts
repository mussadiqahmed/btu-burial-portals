import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM client_followup');
    res.json(rows);
  } catch (error: any) {
    console.error('List follow-ups error:', error);
    res.status(500).json({ error: 'Failed to load follow-ups.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const orderId = req.body.order_id ?? req.body.orderId ?? null;
    const clientName = req.body.client_name ?? req.body.clientName ?? null;
    if (!clientName) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const [result]: any = await pool.execute(
      `INSERT INTO client_followup (order_id, client_name, followup_date, feedback, action_taken) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        orderId,
        clientName,
        req.body.followup_date ? new Date(req.body.followup_date) : new Date(),
        req.body.feedback ?? null,
        req.body.action_taken ?? req.body.actionTaken ?? null,
      ]
    );
    const [newItem]: any = await pool.execute('SELECT * FROM client_followup WHERE followup_id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error: any) {
    console.error('Create follow-up error:', error);
    res.status(500).json({ error: 'Failed to create follow-up.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const orderId = req.body.order_id ?? req.body.orderId ?? null;
    const clientName = req.body.client_name ?? req.body.clientName ?? null;
    if (!clientName) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    await pool.execute(
      `UPDATE client_followup SET 
       order_id = ?, client_name = ?, followup_date = ?, feedback = ?, action_taken = ? 
       WHERE followup_id = ?`,
      [
        orderId,
        clientName,
        req.body.followup_date ? new Date(req.body.followup_date) : null,
        req.body.feedback ?? null,
        req.body.action_taken ?? req.body.actionTaken ?? null,
        id
      ]
    );
    const [updatedItem]: any = await pool.execute('SELECT * FROM client_followup WHERE followup_id = ?', [id]);
    res.json(updatedItem[0]);
  } catch (error: any) {
    console.error('Update follow-up error:', error);
    res.status(500).json({ error: 'Failed to update follow-up.' });
  }
});

export default router;

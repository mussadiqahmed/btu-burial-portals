import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM extras');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const [result]: any = await pool.execute(
      `INSERT INTO extras (extra_name, price) VALUES (?, ?)`,
      [req.body.extra_name || req.body.name, req.body.price]
    );
    const [newItem]: any = await pool.execute('SELECT * FROM extras WHERE extra_id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    await pool.execute(
      `UPDATE extras SET extra_name = ?, price = ? WHERE extra_id = ?`,
      [req.body.extra_name || req.body.name, req.body.price, id]
    );
    const [updatedItem]: any = await pool.execute('SELECT * FROM extras WHERE extra_id = ?', [id]);
    res.json(updatedItem[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM extras WHERE extra_id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

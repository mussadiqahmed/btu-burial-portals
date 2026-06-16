import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM materials_inventory');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const [result]: any = await pool.execute(
      `INSERT INTO materials_inventory (material_name, quantity, unit, reorder_level, supplier, last_order_date, piece_type, material_family) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.material_name || req.body.name,
        req.body.quantity,
        req.body.unit,
        req.body.reorder_level || req.body.reorderLevel || 10,
        req.body.supplier || null,
        req.body.last_order_date ? new Date(req.body.last_order_date) : null,
        req.body.piece_type || null,
        req.body.material_family || null
      ]
    );
    const [newItem]: any = await pool.execute('SELECT * FROM materials_inventory WHERE material_id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    await pool.execute(
      `UPDATE materials_inventory SET 
       material_name = ?, quantity = ?, unit = ?, reorder_level = ?, supplier = ?, last_order_date = ?, piece_type = ?, material_family = ?
       WHERE material_id = ?`,
      [
        req.body.material_name || req.body.name,
        req.body.quantity,
        req.body.unit,
        req.body.reorder_level || req.body.reorderLevel || 10,
        req.body.supplier || null,
        req.body.last_order_date ? new Date(req.body.last_order_date) : null,
        req.body.piece_type || null,
        req.body.material_family || null,
        id
      ]
    );
    const [updatedItem]: any = await pool.execute('SELECT * FROM materials_inventory WHERE material_id = ?', [id]);
    res.json(updatedItem[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM materials_inventory WHERE material_id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

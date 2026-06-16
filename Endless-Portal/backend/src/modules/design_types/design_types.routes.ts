import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM design_types ORDER BY category, price ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch design types' });
  }
});

router.get('/code/:code', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM design_types WHERE code = ?', [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ error: 'Design not found' });
    const design = rows[0];
    if (typeof design.components === 'string') {
      design.components = JSON.parse(design.components);
    }
    res.json(design);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, category, price, components, description } = req.body;
    const componentsJson = components ? JSON.stringify(components) : null;
    const [result]: any = await pool.query(
      'INSERT INTO design_types (code, name, category, price, components, description) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, category || null, price, componentsJson, description || null]
    );
    res.status(201).json({ id: result.insertId, code, name, category, price, components, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create design type' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, name, category, price, components, description } = req.body;
    const componentsJson = components ? JSON.stringify(components) : null;
    await pool.query(
      'UPDATE design_types SET code=?, name=?, category=?, price=?, components=?, description=? WHERE id = ?',
      [code, name, category, price, componentsJson, description, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update design type' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM design_types WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete design type' });
  }
});

export default router;

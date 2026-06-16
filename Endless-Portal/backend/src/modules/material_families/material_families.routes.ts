import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

function normalizeName(name: unknown): string {
  return String(name || '').trim();
}

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM material_families ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error: any) {
    console.error('List material families error:', error);
    res.status(500).json({ error: 'Failed to load material families.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    if (!name) {
      return res.status(400).json({ error: 'Material family name is required.' });
    }

    const [existing]: any = await pool.execute(
      'SELECT family_id FROM material_families WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A material family with this name already exists.' });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO material_families (name) VALUES (?)',
      [name]
    );
    const [rows]: any = await pool.execute(
      'SELECT * FROM material_families WHERE family_id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Create material family error:', error);
    res.status(500).json({ error: 'Failed to create material family.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const name = normalizeName(req.body.name);
    if (!name) {
      return res.status(400).json({ error: 'Material family name is required.' });
    }

    const [existing]: any = await pool.execute(
      'SELECT family_id FROM material_families WHERE LOWER(name) = LOWER(?) AND family_id != ?',
      [name, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A material family with this name already exists.' });
    }

    const [found]: any = await pool.execute(
      'SELECT family_id FROM material_families WHERE family_id = ?',
      [id]
    );
    if (found.length === 0) {
      return res.status(404).json({ error: 'Material family not found.' });
    }

    await pool.execute('UPDATE material_families SET name = ? WHERE family_id = ?', [name, id]);
    const [rows]: any = await pool.execute(
      'SELECT * FROM material_families WHERE family_id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Update material family error:', error);
    res.status(500).json({ error: 'Failed to update material family.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    const [found]: any = await pool.execute(
      'SELECT * FROM material_families WHERE family_id = ?',
      [id]
    );
    if (found.length === 0) {
      return res.status(404).json({ error: 'Material family not found.' });
    }

    const familyName = found[0].name;

    const [orderUsage]: any = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM orders WHERE material_family = ?',
      [familyName]
    );
    const [inventoryUsage]: any = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM materials_inventory WHERE material_family = ?',
      [familyName]
    );

    const inUse = (orderUsage[0]?.cnt || 0) + (inventoryUsage[0]?.cnt || 0);
    if (inUse > 0) {
      return res.status(400).json({
        error: `Cannot delete "${familyName}" — it is linked to ${inUse} order(s) or inventory item(s).`,
      });
    }

    await pool.execute('DELETE FROM material_families WHERE family_id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete material family error:', error);
    res.status(500).json({ error: 'Failed to delete material family.' });
  }
});

export default router;

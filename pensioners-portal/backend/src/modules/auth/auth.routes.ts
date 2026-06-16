import { Router } from 'express';
import pool from '../../database/db';
import { requireAdmin } from '../../middleware/permissions';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const router = Router();

const PENSIONERS_LOGIN_ROLES = ['admin', 'manager', 'data_analyst'];
const PENSIONERS_USER_ROLES = ['admin', 'manager', 'data_analyst'];

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const user = rows[0];
    const role = String(user.role || '').trim().toLowerCase();

    if (!PENSIONERS_LOGIN_ROLES.includes(role)) {
      return res.status(403).json({ detail: 'Access denied for this portal' });
    }

    res.json({ username: user.username, role });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Database connection error' });
  }
});

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id, username, role FROM users
       WHERE role IN ('admin', 'manager', 'data_analyst')
       ORDER BY username ASC`
    );
    res.json(rows);
  } catch (error: any) {
    console.error('Fetch users error:', error);
    res.status(500).json({ detail: 'Failed to fetch users' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const normalizedRole = String(role || '').trim().toLowerCase();

    if (!PENSIONERS_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        detail: `Invalid role. Must be one of: ${PENSIONERS_USER_ROLES.join(', ')}`
      });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, normalizedRole]
    );

    res.status(201).json({
      user_id: result.insertId,
      message: 'User created successfully'
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ detail: 'Failed to create user' });
  }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { username, role, password } = req.body;
    const normalizedRole = role ? String(role).trim().toLowerCase() : undefined;

    if (normalizedRole && !PENSIONERS_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        detail: `Invalid role. Must be one of: ${PENSIONERS_USER_ROLES.join(', ')}`
      });
    }

    if (password) {
      await pool.execute(
        'UPDATE users SET username = ?, role = ?, password = ? WHERE user_id = ?',
        [username, normalizedRole, password, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET username = ?, role = ? WHERE user_id = ?',
        [username, normalizedRole, id]
      );
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: 'Username already exists' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ detail: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await pool.execute('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ detail: 'Failed to delete user' });
  }
});

export default router;

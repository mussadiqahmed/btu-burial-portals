import { Router } from 'express';
import pool from '../../database/db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows]: any = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    const user = rows[0];
    res.json({ username: user.username, role: String(user.role || 'employee').trim().toLowerCase() });
  } catch (error: any) {
    console.error('Database connection error during login:', error);
    res.status(500).json({ detail: "Database connection error. Check API .env credentials on the server." });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const validRoles = ['admin', 'employee', 'sales', 'manager', 'marketing'];
    
    if (!validRoles.includes(role?.toLowerCase())) {
      return res.status(400).json({ detail: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role.toLowerCase()]
    );

    res.json({ status: "success", message: "User registered successfully" });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: "Username already exists" });
    }
    res.status(500).json({ detail: "Registration failed" });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id, username, role FROM users');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ detail: "Failed to fetch users" });
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, role, password } = req.body;
    const validRoles = ['admin', 'employee', 'sales', 'manager', 'marketing'];
    
    if (role && !validRoles.includes(role?.toLowerCase())) {
      return res.status(400).json({ detail: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (password) {
      await pool.execute(
        'UPDATE users SET username = ?, role = ?, password = ? WHERE user_id = ?',
        [username, role.toLowerCase(), password, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET username = ?, role = ? WHERE user_id = ?',
        [username, role.toLowerCase(), id]
      );
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ detail: "Username already exists" });
    }
    res.status(500).json({ detail: "Failed to update user" });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.execute('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ detail: "Failed to delete user" });
  }
});

export default router;

import pool from './db';

async function init() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS design_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert defaults if empty
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM design_types');
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO design_types (name, price) VALUES
        ('Standard', 1000.00),
        ('Executive', 1500.00),
        ('Presidential', 2000.00),
        ('Custom', 2500.00)
      `);
    }
    console.log('Design types table initialized');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

init();

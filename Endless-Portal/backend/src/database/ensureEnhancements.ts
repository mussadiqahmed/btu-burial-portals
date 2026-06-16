import pool from './db';

let ensured = false;

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows]: any = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0]?.cnt > 0;
}

export async function ensureEnhancements() {
  if (ensured) return;

  if (!(await columnExists('marketing_quotations', 'is_custom'))) {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN is_custom TINYINT(1) NOT NULL DEFAULT 0 AFTER design_code'
    );
  }
  if (!(await columnExists('marketing_quotations', 'design_name'))) {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN design_name VARCHAR(255) NULL AFTER is_custom'
    );
  }
  if (!(await columnExists('marketing_quotations', 'description'))) {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN description TEXT NULL AFTER design_name'
    );
  }
  if (!(await columnExists('marketing_quotations', 'dimensions'))) {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN dimensions VARCHAR(255) NULL AFTER description'
    );
  }
  if (!(await columnExists('marketing_quotations', 'pricing_details'))) {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN pricing_details TEXT NULL AFTER dimensions'
    );
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS material_families (
      family_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_material_families_name (name)
    )
  `);

  const seedFamilies = [
    'Rustenburg', 'Red Cape', 'Zim Black', 'Tropical Gold',
    'Rust', 'Marble', 'Granite', 'Namibian White',
  ];
  for (const name of seedFamilies) {
    await pool.execute('INSERT IGNORE INTO material_families (name) VALUES (?)', [name]);
  }

  if (!(await columnExists('orders', 'payment_status'))) {
    await pool.execute('ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) NULL AFTER deposit_paid');
  }

  ensured = true;
}

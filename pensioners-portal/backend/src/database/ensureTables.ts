import pool from './db';

let ensured = false;

export async function ensureTables() {
  if (ensured) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pensioners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      payroll_number VARCHAR(50) NOT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_payroll_number (payroll_number),
      INDEX idx_status (status)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pensioner_upload_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      uploaded_by VARCHAR(100) NULL,
      month TINYINT NOT NULL,
      year SMALLINT NOT NULL,
      records_count INT NOT NULL DEFAULT 0,
      new_pensioners INT NOT NULL DEFAULT 0,
      updated_pensioners INT NOT NULL DEFAULT 0,
      failed_rows INT NOT NULL DEFAULT 0,
      summary_json JSON NULL,
      INDEX idx_batch_period (year, month)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pensioner_monthly_collections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pensioner_id INT NOT NULL,
      collection_month TINYINT NOT NULL,
      collection_year SMALLINT NOT NULL,
      paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      commission DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      admin_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      collection_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      net_premium DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      wht DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      bona_life DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      uploaded_batch_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_pensioner_period (pensioner_id, collection_month, collection_year),
      INDEX idx_collection_period (collection_year, collection_month),
      CONSTRAINT fk_pmc_pensioner FOREIGN KEY (pensioner_id) REFERENCES pensioners(id) ON DELETE CASCADE,
      CONSTRAINT fk_pmc_batch FOREIGN KEY (uploaded_batch_id) REFERENCES pensioner_upload_batches(id) ON DELETE SET NULL
    )
  `);

  try {
    await pool.execute(`
      ALTER TABLE users MODIFY role ENUM(
        'admin', 'employee', 'sales', 'manager', 'marketing', 'data_analyst'
      ) NOT NULL
    `);
  } catch {
    /* role enum may already include data_analyst */
  }

  ensured = true;
}

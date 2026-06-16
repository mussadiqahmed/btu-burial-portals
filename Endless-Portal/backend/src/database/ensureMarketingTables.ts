import pool from './db';

let ensured = false;

export async function ensureMarketingTables() {
  if (ensured) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS marketing_leads (
      lead_id INT AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      contact_number VARCHAR(50) NULL,
      email VARCHAR(255) NULL,
      status ENUM('New', 'Contacted', 'Quoted', 'Negotiation', 'Closed', 'Lost') NOT NULL DEFAULT 'New',
      source VARCHAR(100) NULL,
      notes TEXT NULL,
      assigned_to VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS marketing_quotations (
      quotation_id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NULL,
      client_name VARCHAR(255) NOT NULL,
      contact_number VARCHAR(50) NULL,
      design_code VARCHAR(50) NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      status ENUM('Draft', 'Sent', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Draft',
      sent_date DATE NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS marketing_documents (
      document_id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category ENUM('Catalog', 'Tombstone Image', 'Marketing Material', 'Other') NOT NULL DEFAULT 'Other',
      file_url VARCHAR(500) NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await pool.execute(
      'ALTER TABLE marketing_quotations ADD COLUMN client_email VARCHAR(255) NULL AFTER contact_number'
    );
  } catch {
    /* column may already exist */
  }

  ensured = true;
}

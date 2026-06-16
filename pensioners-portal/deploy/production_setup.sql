-- =============================================================================
-- Pensioners Portal — standalone production setup
-- Database: btuburia_pensioner (cPanel)
-- phpMyAdmin → select database → Import → run this file
-- Safe to re-run (idempotent).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users (dedicated pensioners DB — not shared with memorial portal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM(
    'admin', 'employee', 'sales', 'manager', 'marketing', 'data_analyst'
  ) NOT NULL,
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure data_analyst role exists on older installs
SET @role_enum_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role'
    AND COLUMN_TYPE LIKE '%data_analyst%'
);

SET @alter_users_role := IF(
  @role_enum_exists = 0,
  'ALTER TABLE users MODIFY role ENUM(
    ''admin'', ''employee'', ''sales'', ''manager'', ''marketing'', ''data_analyst''
  ) NOT NULL',
  'SELECT ''users.role already includes data_analyst'' AS info'
);

PREPARE stmt FROM @alter_users_role;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- pensioners
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pensioners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  payroll_number VARCHAR(50) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_payroll_number (payroll_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- pensioner_upload_batches
-- ---------------------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- pensioner_monthly_collections
-- ---------------------------------------------------------------------------
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
  INDEX idx_collection_period (collection_year, collection_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @fk_pmc_pensioner_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pensioner_monthly_collections'
    AND CONSTRAINT_NAME = 'fk_pmc_pensioner'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_pmc_pensioner := IF(
  @fk_pmc_pensioner_exists = 0,
  'ALTER TABLE pensioner_monthly_collections
     ADD CONSTRAINT fk_pmc_pensioner
     FOREIGN KEY (pensioner_id) REFERENCES pensioners(id) ON DELETE CASCADE',
  'SELECT ''fk_pmc_pensioner already exists'' AS info'
);

PREPARE stmt FROM @add_fk_pmc_pensioner;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_pmc_batch_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pensioner_monthly_collections'
    AND CONSTRAINT_NAME = 'fk_pmc_batch'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_pmc_batch := IF(
  @fk_pmc_batch_exists = 0,
  'ALTER TABLE pensioner_monthly_collections
     ADD CONSTRAINT fk_pmc_batch
     FOREIGN KEY (uploaded_batch_id) REFERENCES pensioner_upload_batches(id) ON DELETE SET NULL',
  'SELECT ''fk_pmc_batch already exists'' AS info'
);

PREPARE stmt FROM @add_fk_pmc_batch;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Initial admin user (change password after first login)
-- Username: admin  |  Password: ChangeMe2026!
-- ---------------------------------------------------------------------------
INSERT INTO users (username, password, role)
SELECT 'admin', 'ChangeMe2026!', 'admin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, password, role)
SELECT 'jama', 'Admin@321', 'admin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'jama');

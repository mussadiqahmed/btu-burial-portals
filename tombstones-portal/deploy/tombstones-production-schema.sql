-- =============================================================================
-- BOTUBS Tombstones Portal — production schema (schema only, no seed data)
-- Database: btuburia_tombstones
-- Import via phpMyAdmin on a fresh database before first deploy.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS btuburia_tombstones
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE btuburia_tombstones;

-- Portal users (create accounts manually after import — no default users)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM(
    'admin', 'employee', 'sales', 'manager', 'marketing', 'data_analyst'
  ) NOT NULL,
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tombstone_upload_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(128) NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(100) NULL,
  month TINYINT NOT NULL,
  year SMALLINT NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  successful_rows INT NOT NULL DEFAULT 0,
  matched_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  summary_json JSON NULL,
  INDEX idx_batch_period (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tombstone_monthly_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_payroll_number VARCHAR(50) NOT NULL,
  member_id INT NULL COMMENT 'MemberID from btuburia_web.Members-New (reference only)',
  collection_month TINYINT NOT NULL,
  collection_year SMALLINT NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  expected_amount DECIMAL(12, 2) NULL,
  amount_difference DECIMAL(12, 2) NULL,
  comparison_status ENUM('match', 'underpaid', 'overpaid') NULL,
  upload_batch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_member_period (member_payroll_number, collection_month, collection_year),
  INDEX idx_collection_period (collection_year, collection_month),
  INDEX idx_payroll (member_payroll_number),
  INDEX idx_comparison_status (comparison_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tombstone_member_exclusions (
  payroll_number VARCHAR(50) PRIMARY KEY,
  excluded_by VARCHAR(100) NULL,
  excluded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional FK: collections → upload batch (idempotent)
SET @fk_tmc_batch_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tombstone_monthly_collections'
    AND CONSTRAINT_NAME = 'fk_tmc_batch'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_tmc_batch := IF(
  @fk_tmc_batch_exists = 0,
  'ALTER TABLE tombstone_monthly_collections
     ADD CONSTRAINT fk_tmc_batch
     FOREIGN KEY (upload_batch_id) REFERENCES tombstone_upload_batches(id) ON DELETE SET NULL',
  'SELECT ''fk_tmc_batch already exists'' AS info'
);

PREPARE stmt FROM @add_fk_tmc_batch;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

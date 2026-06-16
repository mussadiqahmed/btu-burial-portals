-- BOTUBS TOMBSTONES PORTAL — standalone database schema
-- Run against btuburia_tombstones (or your TOMBSTONES_DB_NAME)

CREATE DATABASE IF NOT EXISTS btuburia_tombstones
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE btuburia_tombstones;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee', 'sales', 'manager', 'marketing', 'data_analyst') NOT NULL,
  UNIQUE KEY uk_username (username)
);

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
);

CREATE TABLE IF NOT EXISTS tombstone_monthly_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_payroll_number VARCHAR(50) NOT NULL,
  member_id INT NULL,
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
);

CREATE TABLE IF NOT EXISTS tombstone_member_exclusions (
  payroll_number VARCHAR(50) PRIMARY KEY,
  excluded_by VARCHAR(100) NULL,
  excluded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production users: create manually via phpMyAdmin or the Users admin screen after deploy.
-- Do not commit seed credentials to version control.

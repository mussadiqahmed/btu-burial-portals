-- Endless Eternity Portal v2 - Enhancement Migration
-- Custom quotations, material families, payment status
-- Run once in phpMyAdmin or via ensureEnhancements on server startup.

-- 1. Custom quotation fields
ALTER TABLE marketing_quotations ADD COLUMN is_custom TINYINT(1) NOT NULL DEFAULT 0 AFTER design_code;
ALTER TABLE marketing_quotations ADD COLUMN design_name VARCHAR(255) NULL AFTER is_custom;
ALTER TABLE marketing_quotations ADD COLUMN description TEXT NULL AFTER design_name;
ALTER TABLE marketing_quotations ADD COLUMN dimensions VARCHAR(255) NULL AFTER description;
ALTER TABLE marketing_quotations ADD COLUMN pricing_details TEXT NULL AFTER dimensions;

-- 2. Material families lookup table
CREATE TABLE IF NOT EXISTS material_families (
  family_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_material_families_name (name)
);

INSERT IGNORE INTO material_families (name) VALUES
  ('Rustenburg'),
  ('Red Cape'),
  ('Zim Black'),
  ('Tropical Gold'),
  ('Rust'),
  ('Marble'),
  ('Granite'),
  ('Namibian White');

-- 3. Payment status on orders
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) NULL AFTER deposit_paid;

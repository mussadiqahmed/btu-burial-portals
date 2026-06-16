-- =============================================================================
-- Endless Eternity Portal — ONE-TIME PRODUCTION IMPORT (safe to re-run)
-- Database: endlesse_website (or your live DB) → phpMyAdmin → Import / SQL
-- Backup the database before running.
-- Skips anything that already exists — no duplicate-column errors.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: add column only if missing
-- -----------------------------------------------------------------------------
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'design_types' AND COLUMN_NAME = 'code') = 0,
  'ALTER TABLE design_types ADD COLUMN code VARCHAR(50) NULL AFTER id',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'design_types' AND COLUMN_NAME = 'category') = 0,
  'ALTER TABLE design_types ADD COLUMN category VARCHAR(50) NULL AFTER name',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'design_types' AND COLUMN_NAME = 'components') = 0,
  'ALTER TABLE design_types ADD COLUMN components JSON NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'design_types' AND COLUMN_NAME = 'description') = 0,
  'ALTER TABLE design_types ADD COLUMN description TEXT NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'design_types' AND INDEX_NAME = 'idx_design_types_code') = 0,
  'ALTER TABLE design_types ADD UNIQUE INDEX idx_design_types_code (code)',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- orders
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'design_code') = 0,
  'ALTER TABLE orders ADD COLUMN design_code VARCHAR(50) NULL AFTER design_type',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'is_custom_order') = 0,
  'ALTER TABLE orders ADD COLUMN is_custom_order TINYINT(1) NOT NULL DEFAULT 0 AFTER design_code',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'material_family') = 0,
  'ALTER TABLE orders ADD COLUMN material_family VARCHAR(50) NULL AFTER is_custom_order',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'extras_details') = 0,
  'ALTER TABLE orders ADD COLUMN extras_details JSON NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- materials_inventory
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials_inventory' AND COLUMN_NAME = 'piece_type') = 0,
  'ALTER TABLE materials_inventory ADD COLUMN piece_type VARCHAR(50) NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materials_inventory' AND COLUMN_NAME = 'material_family') = 0,
  'ALTER TABLE materials_inventory ADD COLUMN material_family VARCHAR(50) NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- production_workflow (9 process columns)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'sorting') = 0, 'ALTER TABLE production_workflow ADD COLUMN sorting TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'designing') = 0, 'ALTER TABLE production_workflow ADD COLUMN designing TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'cutting') = 0, 'ALTER TABLE production_workflow ADD COLUMN cutting TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'grinding') = 0, 'ALTER TABLE production_workflow ADD COLUMN grinding TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'polishing') = 0, 'ALTER TABLE production_workflow ADD COLUMN polishing TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'word_engraving') = 0, 'ALTER TABLE production_workflow ADD COLUMN word_engraving TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'blasting') = 0, 'ALTER TABLE production_workflow ADD COLUMN blasting TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'sampling') = 0, 'ALTER TABLE production_workflow ADD COLUMN sampling TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_workflow' AND COLUMN_NAME = 'installation') = 0, 'ALTER TABLE production_workflow ADD COLUMN installation TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- -----------------------------------------------------------------------------
-- Marketing tables
-- -----------------------------------------------------------------------------
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
);

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
);

CREATE TABLE IF NOT EXISTS marketing_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category ENUM('Catalog', 'Tombstone Image', 'Marketing Material', 'Other') NOT NULL DEFAULT 'Other',
  file_url VARCHAR(500) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'marketing_quotations' AND COLUMN_NAME = 'client_email') = 0,
  'ALTER TABLE marketing_quotations ADD COLUMN client_email VARCHAR(255) NULL AFTER contact_number',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Marketing user role (safe to re-run)
ALTER TABLE users MODIFY role ENUM('admin', 'employee', 'sales', 'manager', 'marketing') NOT NULL;

-- -----------------------------------------------------------------------------
-- Seed design types (only if code not already present)
-- -----------------------------------------------------------------------------
INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 01', 'PR 01 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":2},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_small","quantity":1}]', '2 ledgers, 2 kerbs long, 2 kerbs short, 1 headstone small'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 01');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 02', 'PR 02 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"slab","quantity":1}]', '2 kerbs long, 4 kerbs short, 2 ledgers, 1 headstone big, 1 metre slab'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 02');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 03', 'PR 03 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"slab","quantity":1},{"piece_type":"headstone_big","quantity":1}]', '2 kerbs long, 4 short kerbs, 2 ledgers, 1 metre slab, 1 big headstone'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 03');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 04', 'PR 04 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":4}]', '2 long kerbs, 2 short kerbs, 1 big headstone, 4 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 04');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 05', 'PR 05 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"frame_short","quantity":4},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":3}]', '2 long kerbs, 4 short frames, 1 big headstone, 3 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 05');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 06', 'PR 06 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":3},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2}]', '3 ledgers, 2 long kerbs, 2 short kerbs'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 06');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 07', 'PR 07 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_small","quantity":1},{"piece_type":"ledger","quantity":4}]', '2 long kerbs, 2 short kerbs, 1 small headstone, 4 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 07');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PR 08', 'PR 08 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":4},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":4}]', '4 long kerbs, 4 short kerbs, 4 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PR 08');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'TPEM-1125', 'TPEM-1125 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":2},{"piece_type":"base_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 1 big headstone, 2 ledgers, 1 big base'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'TPEM-1125');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'PLM-RG-2613', 'PLM-RG-2613 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":4},{"piece_type":"headstone_small","quantity":1},{"piece_type":"kerb_long","quantity":6},{"piece_type":"kerb_short","quantity":10}]', '4 ledgers, 1 small headstone, 6 long kerbs, 10 short kerbs'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'PLM-RG-2613');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'EH-2045', 'EH-2045 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":2},{"piece_type":"slab","quantity":2}]', '2 ledgers, 2 slabs'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'EH-2045');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'RSA-GT-5091', 'RSA-GT-5091 Presidential', 'Presidential', 35000.00, '[{"piece_type":"pillar","quantity":2},{"piece_type":"ledger","quantity":4}]', '2 pillars, 4 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'RSA-GT-5091');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'EX01', 'EX01 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3}]', '2 long kerbs, 2 short kerbs, 3 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'EX01');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'ECM-2025 RG', 'ECM-2025 RG Executive', 'Executive', 25000.00, '[{"piece_type":"ledger","quantity":4},{"piece_type":"headstone_small","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2}]', '4 ledgers, 1 small headstone, 2 long kerbs, 2 short kerbs'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'ECM-2025 RG');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'TCM-3120', 'TCM-3120 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3},{"piece_type":"base_small","quantity":1}]', '2 long kerbs, 2 short kerbs, 3 ledgers, 1 small base'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'TCM-3120');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'EX 04', 'EX 04 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"base_big","quantity":1}]', '2 long kerbs, 4 short kerbs, 2 ledgers, 1 big base'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'EX 04');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'RSAGT-6034', 'RSAGT-6034 Executive', 'Executive', 25000.00, '[{"piece_type":"ledger","quantity":3},{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":2}]', '3 ledgers, 2 short kerbs, 2 long kerbs'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'RSAGT-6034');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'BTU-RG-1274', 'BTU-RG-1274 Standard', 'Standard', 15000.00, '[{"piece_type":"headstone_big","quantity":1},{"piece_type":"base_small","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":2}]', '1 big headstone, 1 small base, 2 long kerbs, 2 short kerbs, 2 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'BTU-RG-1274');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'BTU-MLE-07', 'BTU-MLE-07 Standard', 'Standard', 15000.00, '[{"piece_type":"ledger","quantity":1},{"piece_type":"base_big","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1}]', '1 ledger, 1 base, 2 long kerbs, 2 short kerbs, 1 big headstone'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'BTU-MLE-07');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'BTU-SWV-23', 'BTU-SWV-23 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3},{"piece_type":"headstone_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 3 ledgers, 1 big headstone'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'BTU-SWV-23');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'RSA-GT-2037', 'RSA-GT-2037 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":3},{"piece_type":"ledger","quantity":3}]', '2 short kerbs, 3 long kerbs, 3 ledgers'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'RSA-GT-2037');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'STD 01', 'STD 01 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":1},{"piece_type":"offcut","quantity":1}]', '2 short kerbs, 2 long kerbs, 1 big headstone, 1 ledger, 1 offcut'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'STD 01');

INSERT INTO design_types (code, name, category, price, components, description)
SELECT 'STD 04', 'STD 04 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"base_big","quantity":1},{"piece_type":"ledger","quantity":1},{"piece_type":"headstone_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 1 big base, 1 ledger, 1 big headstone'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM design_types WHERE code = 'STD 04');

-- Extras (skip duplicates)
INSERT IGNORE INTO extras (extra_name, price) VALUES
('Bible design', 0),
('Heart design', 0),
('Zim Black vase', 0),
('Marble vase', 0),
('A4 coloured photo', 0),
('A4 engraved photo', 0),
('Pebbles', 0);

-- -----------------------------------------------------------------------------
-- Tag inventory for design-code stock deduction (safe to re-run)
-- -----------------------------------------------------------------------------
UPDATE materials_inventory SET piece_type = 'ledger', material_family = 'Rust'
  WHERE material_name LIKE '%Ledger%' AND material_name LIKE '%Rust%';

UPDATE materials_inventory SET piece_type = 'ledger', material_family = 'Marble'
  WHERE material_name LIKE '%Ledger%' AND material_name LIKE '%Marble%';

UPDATE materials_inventory SET piece_type = 'headstone_big', material_family = 'Rust'
  WHERE material_name LIKE '%Headstone%' AND material_name LIKE '%Rust%';

UPDATE materials_inventory SET piece_type = 'headstone_big', material_family = 'Marble'
  WHERE material_name LIKE '%Headstone%' AND material_name LIKE '%Marble%';

UPDATE materials_inventory SET piece_type = 'kerb_long', material_family = 'Rust'
  WHERE material_name LIKE '%Kerb%196%' AND material_name LIKE '%Rust%';

UPDATE materials_inventory SET piece_type = 'kerb_long', material_family = 'Marble'
  WHERE material_name LIKE '%Kerb%196%' AND material_name LIKE '%Marble%';

UPDATE materials_inventory SET piece_type = 'kerb_short', material_family = 'Rust'
  WHERE material_name LIKE '%Kerb%91%' AND material_name LIKE '%Rust%';

UPDATE materials_inventory SET piece_type = 'kerb_short', material_family = 'Marble'
  WHERE material_name LIKE '%Kerb%91%' AND material_name LIKE '%Marble%';

UPDATE materials_inventory SET piece_type = 'base_big', material_family = 'Rust'
  WHERE material_name LIKE '%Base%' AND material_name LIKE '%Rust%';

UPDATE materials_inventory SET piece_type = 'base_big', material_family = 'Marble'
  WHERE material_name LIKE '%Base%' AND material_name LIKE '%Marble%';

-- Granite (same name patterns as Rust/Marble)
UPDATE materials_inventory SET piece_type = 'ledger', material_family = 'Granite'
  WHERE material_name LIKE '%Ledger%' AND material_name LIKE '%Granite%';

UPDATE materials_inventory SET piece_type = 'headstone_big', material_family = 'Granite'
  WHERE material_name LIKE '%Headstone%' AND material_name LIKE '%Granite%';

UPDATE materials_inventory SET piece_type = 'kerb_long', material_family = 'Granite'
  WHERE material_name LIKE '%Kerb%196%' AND material_name LIKE '%Granite%';

UPDATE materials_inventory SET piece_type = 'kerb_short', material_family = 'Granite'
  WHERE material_name LIKE '%Kerb%91%' AND material_name LIKE '%Granite%';

UPDATE materials_inventory SET piece_type = 'base_big', material_family = 'Granite'
  WHERE material_name LIKE '%Base%' AND material_name LIKE '%Granite%';

-- -----------------------------------------------------------------------------
-- Done — quick verification (optional)
-- -----------------------------------------------------------------------------
SELECT 'production_import complete' AS status;
SHOW COLUMNS FROM production_workflow;
SELECT COUNT(*) AS design_types_with_code FROM design_types WHERE code IS NOT NULL AND code != '';

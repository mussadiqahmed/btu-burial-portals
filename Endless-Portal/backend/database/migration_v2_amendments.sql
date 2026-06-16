-- Endless Eternity Portal - Amendment Migration
-- Import in phpMyAdmin BEFORE deploying new backend/frontend.
-- If a column already exists, skip that ALTER line and continue.

-- 1. EXTEND design_types
ALTER TABLE design_types ADD COLUMN code VARCHAR(50) NULL AFTER id;
ALTER TABLE design_types ADD COLUMN category VARCHAR(50) NULL AFTER name;
ALTER TABLE design_types ADD COLUMN components JSON NULL;
ALTER TABLE design_types ADD COLUMN description TEXT NULL;
ALTER TABLE design_types ADD UNIQUE INDEX idx_design_types_code (code);

-- 2. EXTEND orders
ALTER TABLE orders ADD COLUMN design_code VARCHAR(50) NULL AFTER design_type;
ALTER TABLE orders ADD COLUMN is_custom_order TINYINT(1) NOT NULL DEFAULT 0 AFTER design_code;
ALTER TABLE orders ADD COLUMN material_family VARCHAR(50) NULL AFTER is_custom_order;

-- 3. EXTEND materials_inventory
ALTER TABLE materials_inventory ADD COLUMN piece_type VARCHAR(50) NULL;
ALTER TABLE materials_inventory ADD COLUMN material_family VARCHAR(50) NULL;

-- 4. EXTEND production_workflow (new processes)
ALTER TABLE production_workflow ADD COLUMN sorting TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN designing TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN cutting TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN grinding TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN word_engraving TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN blasting TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN sampling TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE production_workflow ADD COLUMN installation TINYINT(1) NOT NULL DEFAULT 0;

-- 5. MARKETING TABLES
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES marketing_leads(lead_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS marketing_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category ENUM('Catalog', 'Tombstone Image', 'Marketing Material', 'Other') NOT NULL DEFAULT 'Other',
  file_url VARCHAR(500) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SEED TOMBSTONE DESIGNS (run once; delete duplicates manually if re-run)
INSERT INTO design_types (code, name, category, price, components, description) VALUES
('PR 01', 'PR 01 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":2},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_small","quantity":1}]', '2 ledgers, 2 kerbs long, 2 kerbs short, 1 headstone small'),
('PR 02', 'PR 02 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"slab","quantity":1}]', '2 kerbs long, 4 kerbs short, 2 ledgers, 1 headstone big, 1 metre slab'),
('PR 03', 'PR 03 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"slab","quantity":1},{"piece_type":"headstone_big","quantity":1}]', '2 kerbs long, 4 short kerbs, 2 ledgers, 1 metre slab, 1 big headstone'),
('PR 04', 'PR 04 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":4}]', '2 long kerbs, 2 short kerbs, 1 big headstone, 4 ledgers'),
('PR 05', 'PR 05 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"frame_short","quantity":4},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":3}]', '2 long kerbs, 4 short frames, 1 big headstone, 3 ledgers'),
('PR 06', 'PR 06 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":3},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2}]', '3 ledgers, 2 long kerbs, 2 short kerbs'),
('PR 07', 'PR 07 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_small","quantity":1},{"piece_type":"ledger","quantity":4}]', '2 long kerbs, 2 short kerbs, 1 small headstone, 4 ledgers'),
('PR 08', 'PR 08 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":4},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":4}]', '4 long kerbs, 4 short kerbs, 4 ledgers'),
('TPEM-1125', 'TPEM-1125 Presidential', 'Presidential', 35000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":2},{"piece_type":"base_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 1 big headstone, 2 ledgers, 1 big base'),
('PLM-RG-2613', 'PLM-RG-2613 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":4},{"piece_type":"headstone_small","quantity":1},{"piece_type":"kerb_long","quantity":6},{"piece_type":"kerb_short","quantity":10}]', '4 ledgers, 1 small headstone, 6 long kerbs, 10 short kerbs'),
('EH-2045', 'EH-2045 Presidential', 'Presidential', 35000.00, '[{"piece_type":"ledger","quantity":2},{"piece_type":"slab","quantity":2}]', '2 ledgers, 2 slabs'),
('RSA-GT-5091', 'RSA-GT-5091 Presidential', 'Presidential', 35000.00, '[{"piece_type":"pillar","quantity":2},{"piece_type":"ledger","quantity":4}]', '2 pillars, 4 ledgers'),
('EX01', 'EX01 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3}]', '2 long kerbs, 2 short kerbs, 3 ledgers'),
('ECM-2025 RG', 'ECM-2025 RG Executive', 'Executive', 25000.00, '[{"piece_type":"ledger","quantity":4},{"piece_type":"headstone_small","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2}]', '4 ledgers, 1 small headstone, 2 long kerbs, 2 short kerbs'),
('TCM-3120', 'TCM-3120 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3},{"piece_type":"base_small","quantity":1}]', '2 long kerbs, 2 short kerbs, 3 ledgers, 1 small base'),
('EX 04', 'EX 04 Executive', 'Executive', 25000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":4},{"piece_type":"ledger","quantity":2},{"piece_type":"base_big","quantity":1}]', '2 long kerbs, 4 short kerbs, 2 ledgers, 1 big base'),
('RSAGT-6034', 'RSAGT-6034 Executive', 'Executive', 25000.00, '[{"piece_type":"ledger","quantity":3},{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":2}]', '3 ledgers, 2 short kerbs, 2 long kerbs'),
('BTU-RG-1274', 'BTU-RG-1274 Standard', 'Standard', 15000.00, '[{"piece_type":"headstone_big","quantity":1},{"piece_type":"base_small","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":2}]', '1 big headstone, 1 small base, 2 long kerbs, 2 short kerbs, 2 ledgers'),
('BTU-MLE-07', 'BTU-MLE-07 Standard', 'Standard', 15000.00, '[{"piece_type":"ledger","quantity":1},{"piece_type":"base_big","quantity":1},{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"headstone_big","quantity":1}]', '1 ledger, 1 base, 2 long kerbs, 2 short kerbs, 1 big headstone'),
('BTU-SWV-23', 'BTU-SWV-23 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"ledger","quantity":3},{"piece_type":"headstone_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 3 ledgers, 1 big headstone'),
('RSA-GT-2037', 'RSA-GT-2037 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":3},{"piece_type":"ledger","quantity":3}]', '2 short kerbs, 3 long kerbs, 3 ledgers'),
('STD 01', 'STD 01 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_short","quantity":2},{"piece_type":"kerb_long","quantity":2},{"piece_type":"headstone_big","quantity":1},{"piece_type":"ledger","quantity":1},{"piece_type":"offcut","quantity":1}]', '2 short kerbs, 2 long kerbs, 1 big headstone, 1 ledger, 1 offcut'),
('STD 04', 'STD 04 Standard', 'Standard', 15000.00, '[{"piece_type":"kerb_long","quantity":2},{"piece_type":"kerb_short","quantity":2},{"piece_type":"base_big","quantity":1},{"piece_type":"ledger","quantity":1},{"piece_type":"headstone_big","quantity":1}]', '2 long kerbs, 2 short kerbs, 1 big base, 1 ledger, 1 big headstone');

INSERT IGNORE INTO extras (extra_name, price) VALUES
('Bible design', 0), ('Heart design', 0), ('Zim Black vase', 0), ('Marble vase', 0),
('A4 coloured photo', 0), ('A4 engraved photo', 0), ('Pebbles', 0);

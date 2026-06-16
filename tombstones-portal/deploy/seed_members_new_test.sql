-- LOCAL DEVELOPMENT ONLY — do NOT import into production btuburia_web
-- Use only with btuburia_web_test and backend/.env.test
-- Not included in deploy/release/ package

CREATE DATABASE IF NOT EXISTS btuburia_web_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE btuburia_web_test;

CREATE TABLE IF NOT EXISTS `Members-New` (
  MemberID INT AUTO_INCREMENT PRIMARY KEY,
  PayrollNumber VARCHAR(50) NOT NULL,
  Surname VARCHAR(100),
  FirstName VARCHAR(100),
  Initials VARCHAR(20),
  DOB DATE NULL,
  IdNumber VARCHAR(50),
  Gender VARCHAR(20),
  Age INT,
  Premium DECIMAL(12,2),
  Cover DECIMAL(12,2),
  PackageName VARCHAR(100),
  Standing VARCHAR(50) DEFAULT 'Active',
  CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  C1Surname VARCHAR(100),
  C1FirstName VARCHAR(100),
  C1Relationship VARCHAR(50),
  C1Gender VARCHAR(20),
  C1Age INT,
  C1Premium DECIMAL(12,2),
  C1Cover DECIMAL(12,2),
  C1PackageName VARCHAR(100),
  B1Surname VARCHAR(100),
  B1FirstName VARCHAR(100),
  B1Relationship VARCHAR(50),
  UNIQUE KEY uk_payroll (PayrollNumber)
);

INSERT INTO `Members-New`
  (PayrollNumber, Surname, FirstName, Premium, Cover, PackageName, Standing,
   C1Surname, C1FirstName, C1Relationship, C1Gender, C1Age, C1Premium, C1Cover, C1PackageName,
   B1Surname, B1FirstName, B1Relationship)
VALUES
  ('800001001', 'Molefe', 'John', 150.00, 5000.00, 'Family Plan', 'Active',
   'Molefe', 'Mary', 'Spouse', 'Female', 45, 75.00, 2500.00, 'Family Plan',
   'Molefe', 'Peter', 'Beneficiary'),
  ('800001002', 'Kgosidintsi', 'Anna', 120.00, 4000.00, 'Standard', 'Active',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
   'Kgosidintsi', 'Boitumelo', 'Child'),
  ('800001003', 'Tawana', 'David', 95.00, 3000.00, 'Basic', 'Inactive',
   'Tawana', 'Sarah', 'Spouse', 'Female', 38, 50.00, 1500.00, 'Basic',
   NULL, NULL, NULL),
  ('800001004', 'Modise', 'Keabetswe', 100.00, 3500.00, 'Standard', 'Active',
   'Modise', 'Lerato', 'Spouse', 'Female', 42, 30.00, 1200.00, 'Standard',
   'Modise', 'Thabo', 'Beneficiary'),
  ('800001005', 'Sebego', 'Orapeleng', 250.00, 6000.00, 'Family Plan', 'Active',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
   'Sebego', 'Kgomotso', 'Child')
ON DUPLICATE KEY UPDATE Surname = VALUES(Surname);

-- For local testing set:
-- BTU_WEB_DB_NAME=btuburia_web_test

-- Drop ALL pensioners portal tables — then re-import production_setup.sql
-- phpMyAdmin → btuburia_pensioner → SQL

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS pensioner_monthly_collections;
DROP TABLE IF EXISTS pensioner_upload_batches;
DROP TABLE IF EXISTS pensioners;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Next step: import deploy/production_setup.sql (recreates tables + jama + admin users)

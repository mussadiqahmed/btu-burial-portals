import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/** BTU master member database (Members-New source of truth) */
const membersPool = mysql.createPool({
  host: process.env.BTU_WEB_DB_HOST || process.env.TOMBSTONES_DB_HOST,
  user: process.env.BTU_WEB_DB_USER || process.env.TOMBSTONES_DB_USER,
  password: process.env.BTU_WEB_DB_PASSWORD || process.env.TOMBSTONES_DB_PASSWORD,
  database: process.env.BTU_WEB_DB_NAME || 'btuburia_web',
  port: parseInt(process.env.BTU_WEB_DB_PORT || process.env.TOMBSTONES_DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default membersPool;

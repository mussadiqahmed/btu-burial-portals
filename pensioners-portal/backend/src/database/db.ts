import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.PENSIONERS_DB_HOST,
  user: process.env.PENSIONERS_DB_USER,
  password: process.env.PENSIONERS_DB_PASSWORD,
  database: process.env.PENSIONERS_DB_NAME,
  port: parseInt(process.env.PENSIONERS_DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;

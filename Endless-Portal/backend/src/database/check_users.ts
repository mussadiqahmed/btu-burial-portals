import pool from './db';

async function check() {
  try {
    const [rows]: any = await pool.query('DESCRIBE users');
    console.log(rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();

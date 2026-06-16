import pool from './db';

async function run() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN extras_details JSON;');
    console.log('Added extras_details column');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  }
  process.exit();
}

run();
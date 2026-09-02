import { pool } from './db/index.js';
import dotenv from 'dotenv';
dotenv.config();

async function viewDatabase() {
  console.log(`\n====================================================`);
  console.log(`📊 FRESVEG POSTGRESQL DATABASE INSPECTOR`);
  console.log(`   Host: ${process.env.PGHOST}:${process.env.PGPORT}`);
  console.log(`   Database: ${process.env.PGDATABASE}`);
  console.log(`====================================================\n`);

  try {
    const tables = ['users', 'shops', 'products', 'categories', 'orders', 'farms', 'carts'];

    for (const table of tables) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = countRes.rows[0].count;
        console.log(`📌 TABLE [${table.toUpperCase()}] - Total Records: ${count}`);

        if (parseInt(count) > 0) {
          const sampleRes = await pool.query(`SELECT * FROM ${table} LIMIT 5`);
          console.table(sampleRes.rows);
        } else {
          console.log(`   (Table is empty)\n`);
        }
        console.log(`----------------------------------------------------\n`);
      } catch (err) {
        console.log(`⚠️ Table ${table}: ${err.message}\n`);
      }
    }
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  } finally {
    await pool.end();
  }
}

viewDatabase();

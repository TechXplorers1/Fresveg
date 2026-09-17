import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '091653',
  database: 'fresveg'
});

async function main() {
  try {
    const accTables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'account'"
    );
    console.log('Account tables:', accTables.rows.map(r => r.table_name));

    const pubTables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Public tables:', pubTables.rows.map(r => r.table_name));

    for (const t of accTables.rows) {
      const cols = await pool.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'account' AND table_name = '${t.table_name}'`
      );
      console.log(`\nColumns for account.${t.table_name}:`);
      console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();

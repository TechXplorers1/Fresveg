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
    const r1 = await pool.query("SELECT user_id, display_name, email, oidc_issuer, oidc_subject FROM account.users WHERE display_name ILIKE '%Rahul%'");
    console.log('--- account.users ---');
    console.log(r1.rows);

    const r2 = await pool.query("SELECT id, display_name, email, role FROM users WHERE display_name ILIKE '%Rahul%'");
    console.log('--- public.users ---');
    console.log(r2.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();

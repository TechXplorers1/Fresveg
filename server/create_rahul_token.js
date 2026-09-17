import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '091653',
  database: 'fresveg'
});

const JWT_SECRET = 'fresveg_secret_key_2026_super_secure';

async function main() {
  try {
    const userId = '55e6d85d-362b-484e-90aa-d2d70f6f9e34';
    const email = 'rahul.sharma@example.com';
    const displayName = 'Rahul Sharma';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert into public.users
    await pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name`,
      [userId, email, passwordHash, displayName, 'customer', '+919876543210', '[]']
    );

    // Generate JWT Token
    const token = jwt.sign(
      { uid: userId, email: email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('=== USER CREDENTIALS & TOKEN ===');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n=== BEARER TOKEN (JWT) ===');
    console.log(token);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();

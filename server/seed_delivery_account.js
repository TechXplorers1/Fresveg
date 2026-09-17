import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Password@123' === '' ? '' : '091653',
  database: 'fresveg'
});

const JWT_SECRET = 'fresveg_secret_key_2026_super_secure';
const PASSWORD = 'Password@123';

async function seedDeliveryBoy() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();

    const deliveryId = 'de710003-0000-0000-0000-000000000003';
    const deliveryEmail = 'delivery@fresveg.com';
    const deliveryName = 'Arjun Kumar';
    const deliveryPhone = '+91 98765 33445';
    const deliveryAddress = [
      {
        id: 1789500003,
        label: 'Delivery Hub Base',
        recipientName: deliveryName,
        street: 'FresVeg Hub #4, MG Road, Shivaji Nagar',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411005',
        country: 'India',
        phone: deliveryPhone
      }
    ];

    // 1. Insert/Update public.users (Website Login & Express Backend)
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses, shops, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           phone = EXCLUDED.phone,
           addresses = EXCLUDED.addresses,
           shops = EXCLUDED.shops,
           photo_url = EXCLUDED.photo_url`,
      [
        deliveryId,
        deliveryEmail,
        passwordHash,
        deliveryName,
        'delivery_person',
        deliveryPhone,
        JSON.stringify(deliveryAddress),
        '[]',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80'
      ]
    );

    // Also update if email matches another ID
    await client.query(
      `UPDATE users 
       SET password_hash = $1, display_name = $2, role = 'delivery_person', phone = $3 
       WHERE LOWER(email) = LOWER($4) AND id != $5`,
      [passwordHash, deliveryName, deliveryPhone, deliveryEmail, deliveryId]
    );

    // 2. Insert/Update account.users (Spring Boot Microservices)
    await client.query(
      `INSERT INTO account.users (user_id, created_at, updated_at, version, oidc_issuer, oidc_subject, display_name, email, status)
       VALUES ($1, $2, $2, 0, 'https://identity.fresveg.test', 'sub_delivery_003', $3, $4, 'ACTIVE')
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           status = 'ACTIVE'`,
      [deliveryId, now, deliveryName, deliveryEmail]
    );

    // 3. Insert/Update account.customer_profiles
    await client.query(
      `INSERT INTO account.customer_profiles (customer_id, created_at, updated_at, version, user_id, full_name, contact_phone, status)
       VALUES ($1, $2, $2, 0, $1, $3, $4, 'ACTIVE')
       ON CONFLICT (customer_id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           contact_phone = EXCLUDED.contact_phone`,
      [deliveryId, now, deliveryName, deliveryPhone]
    );

    await client.query('COMMIT');
    console.log('✅ Successfully provisioned Delivery Boy account in PostgreSQL!');

    // 4. Generate Bearer Token
    const deliveryToken = jwt.sign(
      { uid: deliveryId, email: deliveryEmail, role: 'delivery_person' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('\n======================================================');
    console.log('           SAMPLE DELIVERY BOY ACCOUNT');
    console.log('======================================================');
    console.log('Name:         ', deliveryName);
    console.log('User ID:      ', deliveryId);
    console.log('Email:        ', deliveryEmail);
    console.log('Password:     ', PASSWORD);
    console.log('Role:         ', 'delivery_person');
    console.log('Role Title:   ', 'Delivery Boy / Delivery Partner');
    console.log('Phone:        ', deliveryPhone);
    console.log('\nDelivery Boy Bearer Token:');
    console.log(deliveryToken);
    console.log('======================================================\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error provisioning delivery boy account:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDeliveryBoy();

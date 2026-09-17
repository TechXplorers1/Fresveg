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
const PASSWORD = 'Password@123';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();

    // ─────────────────────────────────────────────────────────────
    // 1. CUSTOMER ACCOUNT SETUP
    // ─────────────────────────────────────────────────────────────
    const customerId = 'c0570001-0000-0000-0000-000000000001';
    const customerEmail = 'customer@fresveg.com';
    const customerName = 'Ananya Patel';
    const customerPhone = '+91 98765 11223';
    const customerAddress = [
      {
        id: 1789500001,
        label: 'Home',
        recipientName: customerName,
        street: 'Flat 402, Green Acre Heights, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400050',
        country: 'India',
        phone: customerPhone
      }
    ];

    // 1a. public.users (Used by Node Server & Website Login)
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses, shops, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           phone = EXCLUDED.phone,
           addresses = EXCLUDED.addresses`,
      [
        customerId,
        customerEmail,
        passwordHash,
        customerName,
        'customer',
        customerPhone,
        JSON.stringify(customerAddress),
        '[]',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
      ]
    );

    // 1b. account.users (Used by Spring Boot Microservices)
    await client.query(
      `INSERT INTO account.users (user_id, created_at, updated_at, version, oidc_issuer, oidc_subject, display_name, email, status)
       VALUES ($1, $2, $2, 0, 'https://identity.fresveg.test', 'sub_customer_001', $3, $4, 'ACTIVE')
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           status = 'ACTIVE'`,
      [customerId, now, customerName, customerEmail]
    );

    // 1c. account.customer_profiles
    await client.query(
      `INSERT INTO account.customer_profiles (customer_id, created_at, updated_at, version, user_id, full_name, contact_phone, status)
       VALUES ($1, $2, $2, 0, $1, $3, $4, 'ACTIVE')
       ON CONFLICT (customer_id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           contact_phone = EXCLUDED.contact_phone`,
      [customerId, now, customerName, customerPhone]
    );

    // 1d. account.user_roles (CUSTOMER role)
    const customerRoleId = '10000000-0000-0000-0000-000000000001';
    await client.query(
      `INSERT INTO account.user_roles (user_role_id, created_at, updated_at, version, user_id, role_id)
       VALUES (gen_random_uuid(), $1, $1, 0, $2, $3)
       ON CONFLICT DO NOTHING`,
      [now, customerId, customerRoleId]
    );

    // ─────────────────────────────────────────────────────────────
    // 2. VENDOR ACCOUNT SETUP
    // ─────────────────────────────────────────────────────────────
    const vendorId = 'be4d0002-0000-0000-0000-000000000002';
    const vendorEmail = 'vendor@fresveg.com';
    const vendorName = 'Vikram Singh';
    const vendorPhone = '+91 98765 99887';
    const vendorShopId = `shop_${vendorId}_green_earth_organics`;
    const vendorShop = {
      id: vendorShopId,
      shopName: 'Green Earth Organics',
      location: 'Nashik Highway, Igatpuri, Maharashtra',
      gstNumber: '27ABCDE1234F1Z5',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
      socialLinks: {
        instagram: 'https://instagram.com/greenearthorganics',
        facebook: 'https://facebook.com/greenearthorganics',
        whatsapp: '+91 98765 99887',
        website: 'https://greenearthorganics.in'
      }
    };

    // 2a. public.users
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses, shops, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           phone = EXCLUDED.phone,
           shops = EXCLUDED.shops`,
      [
        vendorId,
        vendorEmail,
        passwordHash,
        vendorName,
        'vendor',
        vendorPhone,
        '[]',
        JSON.stringify([vendorShop]),
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
      ]
    );

    // 2b. account.users
    await client.query(
      `INSERT INTO account.users (user_id, created_at, updated_at, version, oidc_issuer, oidc_subject, display_name, email, status)
       VALUES ($1, $2, $2, 0, 'https://identity.fresveg.test', 'sub_vendor_002', $3, $4, 'ACTIVE')
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           status = 'ACTIVE'`,
      [vendorId, now, vendorName, vendorEmail]
    );

    // 2c. account.vendors
    await client.query(
      `INSERT INTO account.vendors (vendor_id, created_at, updated_at, version, vendor_code, name, status)
       VALUES ($1, $2, $2, 0, 'VND-GREEN-EARTH', 'Green Earth Organics', 'ACTIVE')
       ON CONFLICT (vendor_id) DO UPDATE
       SET name = EXCLUDED.name,
           status = 'ACTIVE'`,
      [vendorId, now]
    );

    // 2d. account.vendor_users
    await client.query(
      `INSERT INTO account.vendor_users (vendor_user_id, created_at, updated_at, version, vendor_id, user_id, membership_role, status)
       VALUES (gen_random_uuid(), $1, $1, 0, $2, $2, 'VENDOR_ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [now, vendorId]
    );

    // 2e. account.user_roles (VENDOR_ADMIN role)
    const vendorRoleId = '10000000-0000-0000-0000-000000000002';
    await client.query(
      `INSERT INTO account.user_roles (user_role_id, created_at, updated_at, version, user_id, role_id)
       VALUES (gen_random_uuid(), $1, $1, 0, $2, $3)
       ON CONFLICT DO NOTHING`,
      [now, vendorId, vendorRoleId]
    );

    // 2f. public.shops
    await client.query(
      `INSERT INTO shops (id, vendor_id, shop_name, location, gst_number, image, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET shop_name = EXCLUDED.shop_name,
           location = EXCLUDED.location,
           gst_number = EXCLUDED.gst_number,
           image = EXCLUDED.image,
           social_links = EXCLUDED.social_links`,
      [
        vendorShop.id,
        vendorId,
        vendorShop.shopName,
        vendorShop.location,
        vendorShop.gstNumber,
        vendorShop.image,
        JSON.stringify(vendorShop.socialLinks)
      ]
    );

    // ─────────────────────────────────────────────────────────────
    // 3. DELIVERY BOY ACCOUNT SETUP
    // ─────────────────────────────────────────────────────────────
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

    // 3a. public.users
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

    // 3b. account.users
    await client.query(
      `INSERT INTO account.users (user_id, created_at, updated_at, version, oidc_issuer, oidc_subject, display_name, email, status)
       VALUES ($1, $2, $2, 0, 'https://identity.fresveg.test', 'sub_delivery_003', $3, $4, 'ACTIVE')
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           status = 'ACTIVE'`,
      [deliveryId, now, deliveryName, deliveryEmail]
    );

    // 3c. account.customer_profiles
    await client.query(
      `INSERT INTO account.customer_profiles (customer_id, created_at, updated_at, version, user_id, full_name, contact_phone, status)
       VALUES ($1, $2, $2, 0, $1, $3, $4, 'ACTIVE')
       ON CONFLICT (customer_id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           contact_phone = EXCLUDED.contact_phone`,
      [deliveryId, now, deliveryName, deliveryPhone]
    );

    await client.query('COMMIT');
    console.log('✅ Successfully seeded Customer, Vendor, and Delivery Boy accounts in PostgreSQL!');

    // ─────────────────────────────────────────────────────────────
    // 4. GENERATE BEARER TOKENS
    // ─────────────────────────────────────────────────────────────
    const customerToken = jwt.sign(
      { uid: customerId, email: customerEmail, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const vendorToken = jwt.sign(
      { uid: vendorId, email: vendorEmail, role: 'vendor' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const deliveryToken = jwt.sign(
      { uid: deliveryId, email: deliveryEmail, role: 'delivery_person' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('\n======================================================');
    console.log('            SAMPLE CUSTOMER ACCOUNT');
    console.log('======================================================');
    console.log('Name:         ', customerName);
    console.log('User ID:      ', customerId);
    console.log('Email:        ', customerEmail);
    console.log('Password:     ', PASSWORD);
    console.log('Role:         ', 'customer');
    console.log('\nCustomer Bearer Token:');
    console.log(customerToken);

    console.log('\n======================================================');
    console.log('             SAMPLE VENDOR ACCOUNT');
    console.log('======================================================');
    console.log('Name:         ', vendorName);
    console.log('User ID:      ', vendorId);
    console.log('Email:        ', vendorEmail);
    console.log('Password:     ', PASSWORD);
    console.log('Role:         ', 'vendor');
    console.log('Shop Name:    ', vendorShop.shopName);
    console.log('\nVendor Bearer Token:');
    console.log(vendorToken);

    console.log('\n======================================================');
    console.log('          SAMPLE DELIVERY BOY ACCOUNT');
    console.log('======================================================');
    console.log('Name:         ', deliveryName);
    console.log('User ID:      ', deliveryId);
    console.log('Email:        ', deliveryEmail);
    console.log('Password:     ', PASSWORD);
    console.log('Role:         ', 'delivery_person');
    console.log('Phone:        ', deliveryPhone);
    console.log('\nDelivery Boy Bearer Token:');
    console.log(deliveryToken);
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding accounts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

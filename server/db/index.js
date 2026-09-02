import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Connection Pool configuration
const poolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'fresveg_db',
};

export const pool = new Pool(poolConfig);

// Helper function for querying database
export const query = (text, params) => pool.query(text, params);

// Initialize Database schema and seed default data
export async function initDb() {
  // First, check if database exists, or connect to default 'postgres' db to create fresveg_db
  try {
    const defaultPool = new Pool({
      ...poolConfig,
      database: 'postgres'
    });
    
    const dbCheckRes = await defaultPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [poolConfig.database]
    );
    
    if (dbCheckRes.rowCount === 0) {
      console.log(`Database "${poolConfig.database}" does not exist. Creating now...`);
      await defaultPool.query(`CREATE DATABASE "${poolConfig.database}"`);
      console.log(`Database "${poolConfig.database}" created successfully!`);
    }
    await defaultPool.end();
  } catch (err) {
    console.warn(`Database check/creation notice: ${err.message}`);
  }

  // Connect to target database & create schema
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50);`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_phone VARCHAR(50);`);

    // Ensure all farms columns exist
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255);`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS cost_per_person NUMERIC(10, 2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS cost_type VARCHAR(50) DEFAULT 'free';`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS accommodation_price NUMERIC(10, 2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS accommodations JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS crops JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS fruits JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS livestock JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS kids_activities JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_products JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS stay_list JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS visit_days VARCHAR(255) DEFAULT 'Weekends Only';`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS visit_timings VARCHAR(255) DEFAULT 'Morning 9AM – 6PM';`);
    await pool.query(`ALTER TABLE farms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);

    // Ensure all farm_bookings columns exist
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS farm_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS date VARCHAR(100);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS visitors_count INTEGER DEFAULT 1;`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS include_stay BOOLEAN DEFAULT false;`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS accommodation_title VARCHAR(255);`);
    await pool.query(`ALTER TABLE farm_bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);`);

    // Sync existing vendor shops into shops table
    try {
      const usersRes = await pool.query(`SELECT id, shops FROM users WHERE shops IS NOT NULL AND jsonb_array_length(shops) > 0`);
      for (const u of usersRes.rows) {
        if (Array.isArray(u.shops)) {
          for (const s of u.shops) {
            const shopId = s.id || `shop_${u.id}_${(s.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
            await pool.query(
              `INSERT INTO shops (id, vendor_id, shop_name, location, gst_number, image, social_links)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE
               SET shop_name = EXCLUDED.shop_name,
                   location = EXCLUDED.location,
                   gst_number = EXCLUDED.gst_number,
                   image = EXCLUDED.image,
                   social_links = EXCLUDED.social_links`,
              [shopId, u.id, s.shopName || 'Vendor Shop', s.location || '', s.gstNumber || '', s.image || '', JSON.stringify(s.socialLinks || {})]
            );
          }
        }
      }
    } catch (err) {
      console.warn('Notice syncing shops table:', err.message);
    }

    console.log('PostgreSQL schema tables created/verified successfully!');

    // Seed default categories if table is empty
    const catRes = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catRes.rows[0].count) === 0) {
      console.log('Seeding default categories into PostgreSQL...');
      const defaultCategories = [
        { name: 'Tomatoes', image: '/cherry_tomatoes.png' },
        { name: 'Potatoes', image: '/sweet_potatoes.png' },
        { name: 'Onions', image: '/red_onions.png' },
        { name: 'Brinjal', image: '/fresh_brinjal.png' },
        { name: 'Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80' },
        { name: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80' },
        { name: 'Capsicum', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=200&q=80' },
        { name: 'Broccoli', image: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=200&q=80' },
        { name: 'Garlic', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80' },
        { name: 'Apples', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=200&q=80' },
        { name: 'Bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80' },
        { name: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80' },
        { name: 'Oranges', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=200&q=80' },
        { name: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80' },
        { name: 'Butter', image: '/salted_butter.png' },
        { name: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=200&q=80' },
        { name: 'Yogurt', image: 'https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?auto=format&fit=crop&w=200&q=80' },
        { name: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=200&q=80' }
      ];

      for (const cat of defaultCategories) {
        await pool.query(
          `INSERT INTO categories (name, image) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
          [cat.name, cat.image]
        );
      }
    }

    // Seed initial products if table is empty
    const prodRes = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodRes.rows[0].count) === 0) {
      console.log('Seeding initial products into PostgreSQL...');
      const initialProducts = [
        { id: '1', name: 'Organic Red Tomatoes', price: 4.99, mrp: 6.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
        { id: '2', name: 'Farm Fresh Tomatoes', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },
        { id: '3', name: 'Cherry Tomatoes', price: 6.00, mrp: 8.50, unit: 'box', category: 'Tomatoes', image: '/cherry_tomatoes.png', vendor: 'Root Essentials', rating: 4.9 },
        { id: '4', name: 'Russet Potatoes', price: 2.10, mrp: 3.00, unit: 'kg', category: 'Potatoes', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.6 },
        { id: '5', name: 'Sweet Potatoes', price: 3.20, mrp: 4.50, unit: 'kg', category: 'Potatoes', image: '/sweet_potatoes.png', vendor: 'Root Essentials', rating: 4.8 },
        { id: '6', name: 'Red Onions', price: 1.80, mrp: 2.50, unit: 'kg', category: 'Onions', image: '/red_onions.png', vendor: 'Sunshine Produce', rating: 4.7 },
        { id: '7', name: 'White Onions', price: 1.50, mrp: 2.20, unit: 'kg', category: 'Onions', image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.5 },
        { id: '8', name: 'Fresh Brinjal', price: 2.20, mrp: 3.00, unit: 'kg', category: 'Brinjal', image: '/fresh_brinjal.png', vendor: 'Green Valley Farm', rating: 4.4 },
        { id: '9', name: 'Organic Baby Brinjal', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Brinjal', image: '/baby_brinjal.png', vendor: 'Root Essentials', rating: 4.8 },
        { id: '10', name: 'Farm Fresh Milk', price: 3.20, mrp: 4.20, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.7 },
        { id: '11', name: 'Organic Whole Milk', price: 4.00, mrp: 5.50, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },
        { id: '12', name: 'Organic Butter', price: 4.50, mrp: 6.00, unit: '250g', category: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },
        { id: '13', name: 'Salted Butter Block', price: 3.80, mrp: 5.00, unit: '250g', category: 'Butter', image: '/salted_butter.png', vendor: 'Happy Cows Dairy', rating: 4.7 },
        { id: '14', name: 'Fresh Carrots', price: 1.80, mrp: 2.50, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
        { id: '15', name: 'Organic Baby Carrots', price: 2.50, mrp: 3.50, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },
        { id: '16', name: 'Fuji Apples', price: 4.00, mrp: 5.80, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.8 },
        { id: '17', name: 'Green Granny Smith', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },
        { id: '18', name: 'Organic Bananas', price: 1.99, mrp: 2.99, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },
        { id: '19', name: 'Plantains', price: 2.50, mrp: 3.60, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80', vendor: 'Tropical Farms', rating: 4.5 },
        { id: '20', name: 'Fresh Spinach', price: 2.00, mrp: 2.80, unit: 'bunch', category: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.9 },
        { id: '21', name: 'Baby Spinach Pack', price: 3.50, mrp: 4.99, unit: 'pack', category: 'Spinach', image: 'https://images.unsplash.com/photo-1622484211148-522db14e2c14?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },
        { id: '22', name: 'Red Bell Pepper', price: 1.50, mrp: 2.20, unit: 'item', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&q=80', vendor: 'Root Essentials', rating: 4.7 },
        { id: '23', name: 'Mixed Bell Peppers', price: 4.00, mrp: 5.80, unit: 'pack', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1601275868399-45be508112fa?w=500&q=80', vendor: 'Happy Harvest', rating: 4.8 },
        { id: '24', name: 'Cheddar Block', price: 6.50, mrp: 8.99, unit: '500g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.9 },
        { id: '25', name: 'Mozzarella', price: 5.00, mrp: 7.25, unit: '250g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },
        { id: '26', name: 'Greek Yogurt', price: 4.00, mrp: 5.80, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
        { id: '27', name: 'Strawberry Yogurt', price: 4.50, mrp: 6.20, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1557925923-33b251d592cd?w=500&q=80', vendor: 'Meadow Farms', rating: 4.7 },
        { id: '28', name: 'Fresh Broccoli', price: 2.50, mrp: 3.60, unit: 'head', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
        { id: '29', name: 'Organic Broccoli Florets', price: 3.50, mrp: 4.99, unit: 'pack', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },
        { id: '30', name: 'Garlic Bulbs', price: 1.00, mrp: 1.50, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
        { id: '31', name: 'Peeled Garlic', price: 2.00, mrp: 2.99, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1587049352847-4d4b1a13437e?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },
        { id: '32', name: 'Fresh Strawberries', price: 5.00, mrp: 7.25, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.9 },
        { id: '33', name: 'Organic Strawberries', price: 6.50, mrp: 8.99, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },
        { id: '34', name: 'Navel Oranges', price: 3.00, mrp: 4.20, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.6 },
        { id: 35, name: 'Juicing Oranges', price: 2.50, mrp: 3.60, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80', vendor: 'Tropical Farms', rating: 4.7 },
        { id: '36', name: 'Fresh Paneer Block', price: 5.50, mrp: 7.99, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
        { id: '37', name: 'Malai Paneer', price: 6.00, mrp: 8.50, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1589115715509-bba91b264e16?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 }
      ];

      for (const p of initialProducts) {
        await pool.query(
          `INSERT INTO products (id, name, price, mrp, unit, category, image, vendor, rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.price, p.mrp, p.unit, p.category, p.image, p.vendor, p.rating]
        );
      }
    }
  } catch (error) {
    console.error('Error during PostgreSQL database init:', error);
  }
}

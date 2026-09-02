-- PostgreSQL Schema for FresVeg Web Application

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer',
  photo_url TEXT,
  phone VARCHAR(50),
  shops JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  image TEXT NOT NULL
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  mrp NUMERIC(10, 2),
  unit VARCHAR(50) DEFAULT 'kg',
  category VARCHAR(255) NOT NULL,
  sub_category VARCHAR(255) DEFAULT '',
  image TEXT,
  vendor VARCHAR(255) DEFAULT 'Local Vendor',
  vendor_id VARCHAR(255),
  vendor_phone VARCHAR(50),
  shop_location VARCHAR(255),
  rating NUMERIC(3, 2) DEFAULT 5.0,
  is_deliverable BOOLEAN DEFAULT true,
  fulfillment_type VARCHAR(50) DEFAULT 'deliverable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Carts Table
CREATE TABLE IF NOT EXISTS carts (
  user_id VARCHAR(255) PRIMARY KEY,
  items JSONB DEFAULT '[]'::jsonb,
  address TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  vendor_phone VARCHAR(50),
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC(10, 2) NOT NULL,
  address TEXT,
  payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
  status VARCHAR(50) DEFAULT 'pending',
  delivery_status VARCHAR(50),
  delivery_boy_id VARCHAR(255),
  delivery_boy_name VARCHAR(255),
  delivery_boy_phone VARCHAR(50),
  delivery_boy_location JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link VARCHAR(255) DEFAULT '/profile',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Farms Table
CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  farm_name VARCHAR(255),
  location TEXT NOT NULL,
  owner_id VARCHAR(255),
  vendor_id VARCHAR(255),
  vendor_name VARCHAR(255),
  vendor_email VARCHAR(255),
  image TEXT,
  description TEXT,
  cost_per_person NUMERIC(10, 2) DEFAULT 0,
  price_per_person NUMERIC(10, 2) DEFAULT 0,
  cost_type VARCHAR(50) DEFAULT 'free',
  accommodation_price NUMERIC(10, 2) DEFAULT 0,
  accommodations JSONB DEFAULT '[]'::jsonb,
  crops JSONB DEFAULT '[]'::jsonb,
  fruits JSONB DEFAULT '[]'::jsonb,
  livestock JSONB DEFAULT '[]'::jsonb,
  kids_activities JSONB DEFAULT '[]'::jsonb,
  farm_products JSONB DEFAULT '[]'::jsonb,
  stay_list JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  crop_photos JSONB DEFAULT '[]'::jsonb,
  livestock_photos JSONB DEFAULT '[]'::jsonb,
  kids_photos JSONB DEFAULT '[]'::jsonb,
  accommodation_photos JSONB DEFAULT '[]'::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  visit_days VARCHAR(255) DEFAULT 'Weekends Only',
  visit_timings VARCHAR(255) DEFAULT 'Morning 9AM – 6PM',
  rating NUMERIC(3, 2) DEFAULT 4.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Farm Bookings Table
CREATE TABLE IF NOT EXISTS farm_bookings (
  id VARCHAR(255) PRIMARY KEY,
  farm_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(50),
  visit_date VARCHAR(100),
  guests INTEGER DEFAULT 1,
  total_price NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Farm Reviews Table
CREATE TABLE IF NOT EXISTS farm_reviews (
  id VARCHAR(255) PRIMARY KEY,
  farm_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  rating NUMERIC(3, 2) DEFAULT 5.0,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Home Content Table
CREATE TABLE IF NOT EXISTS home_content (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  content JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Shops Table
CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255),
  shop_name VARCHAR(255) NOT NULL,
  location TEXT,
  gst_number VARCHAR(100),
  image TEXT,
  banner TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

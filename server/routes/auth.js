import express from 'express';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fresveg_secret_key_2026_super_secure';

// Helper to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { uid: user.id, email: user.email, role: user.role || 'customer' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to format user response payload
const formatUser = (row) => ({
  uid: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role || 'customer',
  photoURL: row.photo_url || '',
  phone: row.phone || '',
  shops: row.shops || [],
  addresses: row.addresses || [],
  createdAt: row.created_at
});

// 1. User Registration (PostgreSQL + JWT)
router.post('/register', async (req, res) => {
  const { email, password, displayName, role, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const insertRes = await query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, email.trim().toLowerCase(), passwordHash, displayName || 'User', role || 'customer', phone || '', '[]']
    );

    const row = insertRes.rows[0];
    const userObj = formatUser(row);
    const token = generateToken(row);
    res.status(201).json({ token, user: userObj });
  } catch (err) {
    console.error('Error during PostgreSQL registration:', err);
    res.status(500).json({ error: 'Registration failed. ' + err.message });
  }
});

// 2. User Login (PostgreSQL + JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const row = userRes.rows[0];

    if (!row.password_hash) {
      return res.status(401).json({ error: 'Account has no password set. Please sign up again.' });
    }

    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = formatUser(row);
    const token = generateToken(row);
    res.json({ token, user: userObj });
  } catch (err) {
    console.error('Error during PostgreSQL login:', err);
    res.status(500).json({ error: 'Login failed. ' + err.message });
  }
});

// 3. Get Current Authenticated User via JWT Token
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await query('SELECT * FROM users WHERE id = $1', [decoded.uid]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = userRes.rows[0];
    res.json(formatUser(row));
  } catch (err) {
    console.error('JWT Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// 4. Get Profile by User ID (Public/Service)
router.get('/user/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [uid]);
    if (userRes.rows.length === 0) {
      return res.json({
        uid,
        email: '',
        displayName: 'User',
        role: 'customer',
        shops: [],
        addresses: [],
        createdAt: new Date().toISOString()
      });
    }
    const row = userRes.rows[0];
    res.json(formatUser(row));
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// 5. Update Profile
router.put('/user/:uid', async (req, res) => {
  const { uid } = req.params;
  const { displayName, phone, photoURL, shops, addresses } = req.body;

  try {
    const currentUser = await query('SELECT * FROM users WHERE id = $1', [uid]);
    if (currentUser.rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, display_name, phone, photo_url, shops, addresses)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uid,
          req.body.email || '',
          displayName || 'User',
          phone || '',
          photoURL || '',
          JSON.stringify(shops || []),
          JSON.stringify(addresses || [])
        ]
      );
    } else {
      await query(
        `UPDATE users
         SET display_name = COALESCE($1, display_name),
             phone = COALESCE($2, phone),
             photo_url = COALESCE($3, photo_url),
             shops = COALESCE($4, shops),
             addresses = COALESCE($5, addresses)
         WHERE id = $6`,
        [
          displayName !== undefined ? displayName : null,
          phone !== undefined ? phone : null,
          photoURL !== undefined ? photoURL : null,
          shops !== undefined ? JSON.stringify(shops) : null,
          addresses !== undefined ? JSON.stringify(addresses) : null,
          uid
        ]
      );
    }

    if (Array.isArray(shops)) {
      for (const s of shops) {
        const shopId = s.id || `shop_${uid}_${(s.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        await query(
          `INSERT INTO shops (id, vendor_id, shop_name, location, gst_number, image, social_links)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE
           SET shop_name = EXCLUDED.shop_name,
               location = EXCLUDED.location,
               gst_number = EXCLUDED.gst_number,
               image = EXCLUDED.image,
               social_links = EXCLUDED.social_links`,
          [shopId, uid, s.shopName || 'Vendor Shop', s.location || '', s.gstNumber || '', s.image || '', JSON.stringify(s.socialLinks || {})]
        );
      }
    }

    const updated = await query('SELECT * FROM users WHERE id = $1', [uid]);
    const row = updated.rows[0];
    res.json(formatUser(row));
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// 6. Save Role
router.post('/save-role', async (req, res) => {
  const { uid, role } = req.body;
  if (!uid || !role) {
    return res.status(400).json({ error: 'Missing uid or role' });
  }

  try {
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, uid]);
    res.json({ success: true, uid, role });
  } catch (err) {
    console.error('Error saving role:', err);
    res.status(500).json({ error: 'Failed to save role' });
  }
});

// 7. Get Public Shops
router.get('/public-shops', async (req, res) => {
  try {
    const usersWithShops = await query(`SELECT id, display_name, shops FROM users WHERE shops IS NOT NULL AND jsonb_array_length(shops) > 0`);
    const shopsMap = {};
    usersWithShops.rows.forEach(u => {
      shopsMap[u.id] = u.shops;
    });
    res.json(shopsMap);
  } catch (err) {
    console.error('Error fetching public shops:', err);
    res.status(500).json({ error: 'Failed to fetch public shops' });
  }
});

// 8. Get All Users (Admin/System)
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows.map(formatUser));
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 9. Update User Role (Admin)
router.put('/users/:uid/role', async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }
  try {
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, uid]);
    res.json({ success: true, uid, role });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;

import express from 'express';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  loginWithKeycloak,
  registerWithKeycloak,
  verifyKeycloakToken,
  refreshKeycloakToken,
  mapKeycloakRolesToAppRole
} from '../services/keycloak.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fresveg_secret_key_2026_super_secure';

// Helper to generate legacy JWT Token if needed
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
  bankDetails: typeof row.bank_details === 'string' ? JSON.parse(row.bank_details) : (row.bank_details || {}),
  createdAt: row.created_at
});

// 1. User Registration (Keycloak OIDC + PostgreSQL User Sync)
router.post('/register', async (req, res) => {
  const { email, password, displayName, role, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const nameParts = (displayName || '').trim().split(' ');
    const firstName = nameParts[0] || 'FresVeg';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // 1. Register in Keycloak (creates user, assigns realm role, and completes login)
    const kcResult = await registerWithKeycloak({
      email: cleanEmail,
      password,
      firstName,
      lastName,
      role: role || 'customer',
      phone: phone || ''
    });

    const userId = kcResult.keycloakUserId || kcResult.claims.sub;
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Insert or update user record in PostgreSQL
    const existing = await query('SELECT * FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)', [userId, cleanEmail]);
    let row;

    if (existing.rows.length > 0) {
      const updateRes = await query(
        `UPDATE users
         SET id = $1,
             display_name = $2,
             role = $3,
             phone = COALESCE(NULLIF($4, ''), phone),
             password_hash = $5
         WHERE id = $1 OR LOWER(email) = LOWER($6)
         RETURNING *`,
        [userId, displayName || `${firstName} ${lastName}`, role || 'customer', phone || '', passwordHash, cleanEmail]
      );
      row = updateRes.rows[0];
    } else {
      const insertRes = await query(
        `INSERT INTO users (id, email, password_hash, display_name, role, phone, addresses, shops)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, cleanEmail, passwordHash, displayName || `${firstName} ${lastName}`, role || 'customer', phone || '', '[]', '[]']
      );
      row = insertRes.rows[0];
    }

    // 3. Optional sync to account.users for Spring Boot microservices
    try {
      await query(
        `INSERT INTO account.users (user_id, created_at, updated_at, version, oidc_issuer, oidc_subject, display_name, email, status)
         VALUES ($1, NOW(), NOW(), 0, $2, $1, $3, $4, 'ACTIVE')
         ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email`,
        [userId, 'http://localhost:8180/realms/fresveg', displayName || 'User', cleanEmail]
      );
    } catch {
      // Ignore if account schema is not accessible directly
    }

    const userObj = formatUser(row);
    res.status(201).json({
      token: kcResult.tokens.access_token,
      refreshToken: kcResult.tokens.refresh_token,
      idToken: kcResult.tokens.id_token,
      user: userObj
    });
  } catch (err) {
    console.error('Error during Keycloak registration:', err.message);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// 2. User Login (Keycloak OIDC Direct Access Grant + PostgreSQL User Sync)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate with Keycloak
    const kcResult = await loginWithKeycloak(cleanEmail, password);
    const { tokens, claims } = kcResult;
    const userId = claims.sub;

    // 2. Fetch or provision user record in PostgreSQL
    const userRes = await query('SELECT * FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)', [userId, cleanEmail]);
    let row;

    if (userRes.rows.length > 0) {
      row = userRes.rows[0];
      // Sync ID to Keycloak UUID if different
      if (row.id !== userId) {
        await query('UPDATE users SET id = $1 WHERE id = $2', [userId, row.id]);
        row.id = userId;
      }
    } else {
      // Auto-provision user from Keycloak token claims
      const detectedRole = mapKeycloakRolesToAppRole(claims.realm_access?.roles, 'customer');
      const displayName = claims.name || cleanEmail.split('@')[0];
      const insertRes = await query(
        `INSERT INTO users (id, email, display_name, role, phone, addresses, shops)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, cleanEmail, displayName, detectedRole, '', '[]', '[]']
      );
      row = insertRes.rows[0];
    }

    const userObj = formatUser(row);
    res.json({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      user: userObj
    });
  } catch (err) {
    console.error('Error during Keycloak login:', err.message);
    res.status(401).json({ error: err.message || 'Invalid email or password' });
  }
});

// 3. Get Current Authenticated User via Keycloak JWT Token
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    let decoded;
    try {
      // 1. Primary: Verify RS256 token against Keycloak JWKS
      decoded = await verifyKeycloakToken(token);
    } catch (kcErr) {
      // Fallback: Verify legacy HS256 local token or decode
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        decoded = jwt.decode(token);
        if (!decoded) throw kcErr;
      }
    }

    const userId = decoded.sub || decoded.uid;
    const userEmail = (decoded.email || '').toLowerCase();

    const userRes = await query(
      'SELECT * FROM users WHERE id = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2))',
      [userId, userEmail]
    );

    if (userRes.rows.length === 0) {
      const detectedRole = mapKeycloakRolesToAppRole(decoded.realm_access?.roles, decoded.role || 'customer');
      return res.json({
        uid: userId,
        email: userEmail,
        displayName: decoded.name || decoded.displayName || 'FresVeg User',
        role: detectedRole,
        photoURL: '',
        phone: '',
        shops: [],
        addresses: []
      });
    }

    const row = userRes.rows[0];
    res.json(formatUser(row));
  } catch (err) {
    console.error('JWT Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// 4. Token Refresh Endpoint
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const kcResult = await refreshKeycloakToken(refreshToken);
    res.json({
      token: kcResult.tokens.access_token,
      refreshToken: kcResult.tokens.refresh_token,
      idToken: kcResult.tokens.id_token
    });
  } catch (err) {
    console.error('Error refreshing Keycloak token:', err.message);
    res.status(401).json({ error: err.message || 'Token refresh failed' });
  }
});

// 5. Get Profile by User ID (Public/Service)
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

// 6. Update Profile
router.put('/user/:uid', async (req, res) => {
  const { uid } = req.params;
  const { displayName, phone, photoURL, shops, addresses, bankDetails } = req.body;

  try {
    const currentUser = await query('SELECT * FROM users WHERE id = $1', [uid]);
    if (currentUser.rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, display_name, phone, photo_url, shops, addresses, bank_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uid,
          req.body.email || '',
          displayName || 'User',
          phone || '',
          photoURL || '',
          JSON.stringify(shops || []),
          JSON.stringify(addresses || []),
          JSON.stringify(bankDetails || {})
        ]
      );
    } else {
      await query(
        `UPDATE users
         SET display_name = COALESCE($1, display_name),
             phone = COALESCE($2, phone),
             photo_url = COALESCE($3, photo_url),
             shops = COALESCE($4, shops),
             addresses = COALESCE($5, addresses),
             bank_details = COALESCE($6, bank_details)
         WHERE id = $7`,
        [
          displayName !== undefined ? displayName : null,
          phone !== undefined ? phone : null,
          photoURL !== undefined ? photoURL : null,
          shops !== undefined ? JSON.stringify(shops) : null,
          addresses !== undefined ? JSON.stringify(addresses) : null,
          bankDetails !== undefined ? JSON.stringify(bankDetails) : null,
          uid
        ]
      );
    }

    if (bankDetails !== undefined) {
      await query(`UPDATE shops SET bank_details = $1 WHERE vendor_id = $2`, [JSON.stringify(bankDetails), uid]);
    }

    if (Array.isArray(shops)) {
      for (const s of shops) {
        const shopId = s.id || `shop_${uid}_${(s.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const shopBank = s.bankDetails || bankDetails || {};
        await query(
          `INSERT INTO shops (id, vendor_id, shop_name, location, gst_number, image, bank_details, social_links)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE
           SET shop_name = EXCLUDED.shop_name,
               location = EXCLUDED.location,
               gst_number = EXCLUDED.gst_number,
               image = EXCLUDED.image,
               bank_details = COALESCE(EXCLUDED.bank_details, shops.bank_details),
               social_links = EXCLUDED.social_links`,
          [shopId, uid, s.shopName || 'Vendor Shop', s.location || '', s.gstNumber || '', s.image || '', JSON.stringify(shopBank), JSON.stringify(s.socialLinks || {})]
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

// 6b. Get Vendor Bank & Payout Details (Public for Checkout & Order Settlement)
router.get('/vendor-bank-details', async (req, res) => {
  const { vendorId, shopName, vendorEmail } = req.query;
  try {
    let row = null;
    if (vendorId) {
      const uRes = await query('SELECT id, display_name, email, phone, bank_details, shops FROM users WHERE id = $1', [vendorId]);
      if (uRes.rows.length > 0) row = uRes.rows[0];
    }
    if (!row && shopName) {
      const shopRes = await query(
        `SELECT s.*, u.id as u_id, u.display_name as u_name, u.email as u_email, u.phone as u_phone, u.bank_details as u_bank
         FROM shops s 
         LEFT JOIN users u ON s.vendor_id = u.id 
         WHERE LOWER(s.shop_name) = LOWER($1) OR LOWER(s.shop_name) LIKE LOWER($2)`,
        [shopName.trim(), `%${shopName.trim()}%`]
      );
      if (shopRes.rows.length > 0) {
        const s = shopRes.rows[0];
        const sBank = s.bank_details && Object.keys(s.bank_details).length > 0 ? s.bank_details : (s.u_bank || {});
        return res.json({
          vendorId: s.u_id || s.vendor_id,
          vendorName: s.u_name || s.shop_name,
          shopName: s.shop_name,
          phone: s.u_phone,
          bankDetails: typeof sBank === 'string' ? JSON.parse(sBank) : sBank
        });
      }
    }
    if (!row && vendorEmail) {
      const uRes = await query('SELECT id, display_name, email, phone, bank_details, shops FROM users WHERE LOWER(email) = LOWER($1)', [vendorEmail.trim()]);
      if (uRes.rows.length > 0) row = uRes.rows[0];
    }

    if (row) {
      const bank = typeof row.bank_details === 'string' ? JSON.parse(row.bank_details) : (row.bank_details || {});
      return res.json({
        vendorId: row.id,
        vendorName: row.display_name,
        email: row.email,
        phone: row.phone,
        bankDetails: bank
      });
    }

    // Default verified vendor payout details if not configured yet
    return res.json({
      vendorId: vendorId || 'default_vendor',
      vendorName: 'FresVeg Partner Vendor',
      bankDetails: {
        accountHolderName: 'FresVeg Certified Vendor',
        bankName: 'Access Bank',
        accountNumber: '0128945678',
        ifscCode: '044 (Access Bank)',
        accountType: 'Current',
        branchName: 'Ikeja Branch, Lagos State',
        upiId: 'fresveg.vendor@accessbank',
        isVerified: true,
        acceptDirectPayments: true,
        paymentInstructions: 'Please add your Order ID in transfer remarks for instant automated verification.'
      }
    });
  } catch (err) {
    console.error('Error fetching vendor bank details:', err);
    res.status(500).json({ error: 'Failed to fetch vendor bank details' });
  }
});

// 7. Save Role
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

// 8. Get Public Shops
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

// 9. Get All Users (Admin/System)
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows.map(formatUser));
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 10. Update User Role (Admin)
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

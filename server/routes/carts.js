import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get Cart by User ID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.json({ items: [], address: '' });
    }
    const row = result.rows[0];
    res.json({
      items: row.items || [],
      address: row.address || ''
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Save / Update Cart for User
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { items, address } = req.body;

  try {
    await query(
      `INSERT INTO carts (user_id, items, address, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE
       SET items = EXCLUDED.items,
           address = EXCLUDED.address,
           updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(items || []), address || '']
    );
    res.json({ success: true, items: items || [], address: address || '' });
  } catch (err) {
    console.error('Error saving cart:', err);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

export default router;

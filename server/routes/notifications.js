import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get Notifications for User
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const notifications = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.read,
      link: row.link,
      createdAt: row.created_at
    }));
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create Notification
router.post('/', async (req, res) => {
  const { userId, title, message, type, link } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title are required' });
  }

  const id = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO notifications (id, user_id, title, message, type, read, link)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING *`,
      [id, userId, title, message || '', type || 'info', link || '/profile']
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.read,
      link: row.link,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark Notification as Read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE notifications SET read = true WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark All Notifications as Read for User
router.put('/user/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  try {
    await query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete Notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;

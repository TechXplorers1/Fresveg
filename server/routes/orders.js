import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Helper to format order row into JSON object
const formatOrder = (row) => ({
  id: row.order_id,
  orderId: row.order_id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  vendorPhone: row.vendor_phone,
  items: row.items,
  total: parseFloat(row.total),
  address: row.address,
  paymentMethod: row.payment_method,
  status: row.status,
  deliveryStatus: row.delivery_status || null,
  deliveryBoyId: row.delivery_boy_id || null,
  deliveryBoyName: row.delivery_boy_name || null,
  deliveryBoyPhone: row.delivery_boy_phone || null,
  deliveryBoyLocation: row.delivery_boy_location || {},
  timestamp: row.timestamp
});

// 1. Get All Orders (for Admin or Vendor)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY timestamp DESC');
    res.json(result.rows.map(formatOrder));
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 2. Get User Orders (Customer)
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY timestamp DESC', [userId]);
    res.json(result.rows.map(formatOrder));
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// 3. Get Single Order by Order ID
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(formatOrder(result.rows[0]));
  } catch (err) {
    console.error('Error fetching single order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 4. Place New Order
router.post('/', async (req, res) => {
  const { orderId, customerId, customerName, customerEmail, customerPhone, vendorPhone, items, total, address, paymentMethod, status } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer ID and items are required' });
  }

  const generatedId = orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO orders (order_id, customer_id, customer_name, customer_email, customer_phone, vendor_phone, items, total, address, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        generatedId,
        customerId,
        customerName || 'Customer',
        customerEmail || '',
        customerPhone || '',
        vendorPhone || '',
        JSON.stringify(items),
        total || 0,
        address || '',
        paymentMethod || 'Cash on Delivery',
        status || 'pending'
      ]
    );

    const orderRow = result.rows[0];

    // Real Notification for Customer
    try {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, read, link)
         VALUES ($1, $2, $3, $4, $5, false, $6)`,
        [
          `notif_${Date.now()}_oc`,
          customerId,
          '📦 Order Placed Successfully',
          `Your order #${generatedId} for ₹${parseFloat(total || 0).toFixed(2)} has been placed successfully.`,
          'order',
          '/profile?tab=orders'
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to insert order customer notification:', notifErr);
    }

    res.status(201).json(formatOrder(orderRow));
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// 5. Update Order Status & Delivery Fields
router.put('/:orderId/status', async (req, res) => {
  const targetId = decodeURIComponent(req.params.orderId);
  const { status, deliveryStatus, deliveryBoyId, deliveryBoyName, deliveryBoyPhone } = req.body;

  try {
    const result = await query(
      `UPDATE orders 
       SET status = COALESCE($1, status),
           delivery_status = COALESCE($2, delivery_status),
           delivery_boy_id = COALESCE($3, delivery_boy_id),
           delivery_boy_name = COALESCE($4, delivery_boy_name),
           delivery_boy_phone = COALESCE($5, delivery_boy_phone)
       WHERE order_id = $6 OR LOWER(order_id) = LOWER($6)
       RETURNING *`,
      [
        status || null,
        deliveryStatus || null,
        deliveryBoyId || null,
        deliveryBoyName || null,
        deliveryBoyPhone || null,
        targetId
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedRow = result.rows[0];

    // Real Notification for Status Update
    try {
      if (updatedRow && updatedRow.customer_id) {
        const isDelivered = (deliveryStatus === 'delivered' || status === 'delivered');
        const isOut = (deliveryStatus === 'out_for_delivery' || status === 'out_for_delivery');
        if (isDelivered || isOut) {
          await query(
            `INSERT INTO notifications (id, user_id, title, message, type, read, link)
             VALUES ($1, $2, $3, $4, $5, false, $6)`,
            [
              `notif_${Date.now()}_st`,
              updatedRow.customer_id,
              isDelivered ? '✅ Order Delivered!' : '🛵 Order Out for Delivery',
              isDelivered
                ? `Your order #${targetId} has been delivered. Thank you for choosing FresVeg!`
                : `Your order #${targetId} is out for delivery. ${deliveryBoyName ? `${deliveryBoyName} is on the way!` : ''}`,
              'order',
              '/profile?tab=orders'
            ]
          );
        }
      }
    } catch (notifErr) {
      console.warn('Failed to insert order status update notification:', notifErr);
    }

    res.json(formatOrder(updatedRow));
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 6. Update Delivery Partner Live Location
router.put('/:orderId/location', async (req, res) => {
  const { orderId } = req.params;
  const { lat, lng } = req.body;

  try {
    const locObj = { lat, lng, updatedAt: new Date().toISOString() };
    await query(
      `UPDATE orders SET delivery_boy_location = $1 WHERE order_id = $2`,
      [JSON.stringify(locObj), orderId]
    );
    res.json({ success: true, location: locObj });
  } catch (err) {
    console.error('Error updating delivery location:', err);
    res.status(500).json({ error: 'Failed to update delivery location' });
  }
});

export default router;

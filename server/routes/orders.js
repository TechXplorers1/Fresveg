import express from 'express';
import { query } from '../db/index.js';
import { recordOrderPayouts } from './payouts.js';

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
  items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
  total: parseFloat(row.total || 0),
  address: row.address,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status || 'pending',
  paymentDetails: typeof row.payment_details === 'string' ? JSON.parse(row.payment_details) : (row.payment_details || {}),
  status: row.status,
  deliveryStatus: row.delivery_status || null,
  deliveryBoyId: row.delivery_boy_id || null,
  deliveryBoyName: row.delivery_boy_name || null,
  deliveryBoyPhone: row.delivery_boy_phone || null,
  deliveryBoyLocation: typeof row.delivery_boy_location === 'string' ? JSON.parse(row.delivery_boy_location) : (row.delivery_boy_location || {}),
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
    const result = await query('SELECT * FROM orders WHERE customer_id = $1 OR LOWER(customer_id) = LOWER($1) ORDER BY timestamp DESC', [userId]);
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
    const result = await query('SELECT * FROM orders WHERE order_id = $1 OR LOWER(order_id) = LOWER($1)', [orderId]);
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
  const { orderId, customerId, customerName, customerEmail, customerPhone, vendorPhone, items, total, address, paymentMethod, status, paymentDetails, paymentStatus } = req.body;

  const resolvedCustomerId = customerId || req.body.userId || (req.body.user && (req.body.user.uid || req.body.user.id));
  if (!resolvedCustomerId || !items || (Array.isArray(items) && items.length === 0)) {
    return res.status(400).json({ error: 'Customer ID and items are required' });
  }

  const generatedId = orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
  const numTotal = parseFloat(total || 0);
  const initialPaymentStatus = paymentStatus || (paymentMethod?.includes('Bank') ? 'pending_verification' : 'pending');

  try {
    const result = await query(
      `INSERT INTO orders (order_id, customer_id, customer_name, customer_email, customer_phone, vendor_phone, items, total, address, payment_method, status, payment_details, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        generatedId,
        resolvedCustomerId,
        customerName || 'Customer',
        customerEmail || '',
        customerPhone || '',
        vendorPhone || '',
        itemsJson,
        numTotal,
        address || '',
        paymentMethod || 'Cash on Delivery',
        status || 'pending',
        JSON.stringify(paymentDetails || {}),
        initialPaymentStatus
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
          resolvedCustomerId,
          '📦 Order Placed Successfully',
          `Your order #${generatedId} for ₹${parseFloat(total || 0).toFixed(2)} has been placed successfully.`,
          'order',
          '/profile?tab=orders'
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to insert order customer notification:', notifErr);
    }

    // Real Notification for Vendor if Direct Bank Transfer
    try {
      const isBank = String(paymentMethod || '').toLowerCase().includes('bank');
      const firstItem = Array.isArray(items) && items[0];
      const targetVendorId = (firstItem && (firstItem.vendorId || firstItem.vendor_id)) || null;
      if (isBank && targetVendorId) {
        const utr = (paymentDetails && (paymentDetails.utrNumber || paymentDetails.referenceId)) || 'Pending';
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type, read, link)
           VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [
            `notif_${Date.now()}_vb`,
            targetVendorId,
            '💳 New Bank Transfer Order Received',
            `Order #${generatedId} of ₹${numTotal.toFixed(2)} received with UTR: ${utr}. Please check your bank account and verify payment.`,
            'order',
            '/profile?tab=orders'
          ]
        );
      }
    } catch (vErr) {
      console.warn('Notice sending vendor bank order notification:', vErr.message);
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

// 7. Delete Order
router.delete('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    await query('DELETE FROM orders WHERE order_id = $1 OR LOWER(order_id) = LOWER($1)', [orderId]);
    res.json({ success: true, message: `Order ${orderId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// 8. Verify Vendor Bank Payment
router.put('/:orderId/verify-payment', async (req, res) => {
  const targetId = decodeURIComponent(req.params.orderId);
  const { paymentStatus = 'verified', status = 'confirmed' } = req.body;

  try {
    const result = await query(
      `UPDATE orders 
       SET payment_status = $1,
           status = COALESCE($2, status)
       WHERE order_id = $3 OR LOWER(order_id) = LOWER($3)
       RETURNING *`,
      [paymentStatus, status, targetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedRow = result.rows[0];

    // Notification for Customer
    try {
      if (updatedRow.customer_id) {
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type, read, link)
           VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [
            `notif_${Date.now()}_pv`,
            updatedRow.customer_id,
            '✅ Bank Payment Verified by Vendor!',
            `The vendor has confirmed receipt of your direct bank transfer for order #${targetId}. Your order is now confirmed and packed!`,
            'order',
            '/profile?tab=orders'
          ]
        );
      }
    } catch (notifErr) {
      console.warn('Failed to insert payment verification notification:', notifErr);
    }
    // Record commission & vendor payout
    try {
      await recordOrderPayouts(targetId);
    } catch (pErr) {
      console.warn('Notice recording order payout on payment verify:', pErr.message);
    }

    res.json(formatOrder(updatedRow));
  } catch (err) {
    console.error('Error verifying order payment:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;


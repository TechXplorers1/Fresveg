import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ── Helper: Get Platform Commission Rate ─────────────────────────────────────
export const getPlatformCommissionRate = async () => {
  try {
    const res = await query(`SELECT value FROM platform_settings WHERE key = 'commission'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      const val = res.rows[0].value;
      const rate = parseFloat(val.defaultRate);
      if (!isNaN(rate)) return rate;
    }
  } catch (err) {
    console.warn('Error fetching commission rate from DB, using fallback:', err.message);
  }
  return parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || 10.00);
};

// ── Core Function: Record Vendor Payouts & Company Commission ────────────────
export const recordOrderPayouts = async (orderId) => {
  try {
    // 1. Fetch order details
    const orderRes = await query(
      `SELECT * FROM orders WHERE order_id = $1 OR LOWER(order_id) = LOWER($1)`,
      [orderId]
    );
    if (orderRes.rows.length === 0) return null;

    const order = orderRes.rows[0];
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const paymentMethod = order.payment_method || 'PhonePe';
    const commissionRate = await getPlatformCommissionRate();

    // 2. Group order items by vendor
    const vendorMap = new Map();
    items.forEach((item) => {
      const vendorId = item.vendorId || item.vendor_id || item.ownerId || item.vendor || 'default_vendor';
      const vendorName = item.vendorName || item.vendor || item.shopName || 'Verified Vendor';
      const vendorEmail = item.vendorEmail || item.vendor_email || '';
      const itemPrice = parseFloat(item.price || 0);
      const itemQty = parseInt(item.quantity || 1, 10);
      const itemTotal = itemPrice * itemQty;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          vendorEmail,
          total: 0,
          items: []
        });
      }
      const entry = vendorMap.get(vendorId);
      entry.total += itemTotal;
      entry.items.push(item);
    });

    let totalPlatformCommission = 0;
    let totalVendorPayout = 0;
    const createdPayouts = [];

    // 3. For each vendor in the order, compute share & create payout record
    for (const [vendorId, data] of vendorMap.entries()) {
      const vendorGross = data.total;
      const commissionAmount = Math.round((vendorGross * (commissionRate / 100)) * 100) / 100;
      const payoutAmount = Math.round((vendorGross - commissionAmount) * 100) / 100;

      totalPlatformCommission += commissionAmount;
      totalVendorPayout += payoutAmount;

      // Lookup vendor's bank details from users or shops
      let bankDetails = {};
      let vendorDisplayName = data.vendorName;
      let vendorEmail = data.vendorEmail;

      try {
        const userRes = await query(
          `SELECT id, display_name, email, bank_details FROM users 
           WHERE id = $1 OR LOWER(email) = LOWER($1) OR display_name = $1 LIMIT 1`,
          [vendorId]
        );
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          bankDetails = u.bank_details || {};
          vendorDisplayName = u.display_name || vendorDisplayName;
          vendorEmail = u.email || vendorEmail;
        } else {
          // Check shops table
          const shopRes = await query(
            `SELECT bank_details FROM shops WHERE vendor_id = $1 OR shop_name = $1 LIMIT 1`,
            [vendorId]
          );
          if (shopRes.rows.length > 0 && shopRes.rows[0].bank_details) {
            bankDetails = shopRes.rows[0].bank_details;
          }
        }
      } catch (lookupErr) {
        console.warn('Notice looking up vendor bank details:', lookupErr.message);
      }

      // Check if payout already recorded for this order & vendor
      const existingPayout = await query(
        `SELECT id FROM vendor_payouts WHERE order_id = $1 AND vendor_id = $2`,
        [order.order_id, vendorId]
      );

      let payoutRecord;
      if (existingPayout.rows.length > 0) {
        // Update existing record
        const updateRes = await query(
          `UPDATE vendor_payouts 
           SET order_amount = $1, commission_rate = $2, commission_amount = $3, payout_amount = $4, bank_details = $5
           WHERE id = $6 RETURNING *`,
          [vendorGross, commissionRate, commissionAmount, payoutAmount, JSON.stringify(bankDetails), existingPayout.rows[0].id]
        );
        payoutRecord = updateRes.rows[0];
      } else {
        // Insert new payout ledger record
        const payoutId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const insertRes = await query(
          `INSERT INTO vendor_payouts (
            id, order_id, vendor_id, vendor_name, vendor_email,
            order_amount, commission_rate, commission_amount, payout_amount,
            payment_method, bank_details, payout_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
          RETURNING *`,
          [
            payoutId,
            order.order_id,
            vendorId,
            vendorDisplayName,
            vendorEmail,
            vendorGross,
            commissionRate,
            commissionAmount,
            payoutAmount,
            paymentMethod,
            JSON.stringify(bankDetails)
          ]
        );
        payoutRecord = insertRes.rows[0];

        // Send Vendor Notification
        try {
          await query(
            `INSERT INTO notifications (id, user_id, title, message, type, read, link)
             VALUES ($1, $2, $3, $4, 'payout', false, $5)`,
            [
              `notif_${Date.now()}_po`,
              vendorId,
              '💰 New Payout Recorded (Order Confirmed)',
              `Order #${order.order_id}: ₹${payoutAmount.toFixed(2)} is credited to your pending payout balance after ₹${commissionAmount.toFixed(2)} (${commissionRate}%) FresVeg platform fee.`,
              '/profile?tab=earnings'
            ]
          );
        } catch (nErr) {
          console.warn('Notice sending payout notification:', nErr.message);
        }
      }

      createdPayouts.push(payoutRecord);
    }

    // 4. Update the parent order with platform commission and vendor payout totals
    await query(
      `UPDATE orders 
       SET platform_commission = $1, vendor_payout_amount = $2, payout_status = 'pending'
       WHERE order_id = $3`,
      [totalPlatformCommission, totalVendorPayout, order.order_id]
    );

    return {
      orderId: order.order_id,
      commissionRate,
      totalPlatformCommission,
      totalVendorPayout,
      payouts: createdPayouts
    };
  } catch (err) {
    console.error('[Payouts Error] Failed to calculate and record order payouts:', err);
    throw err;
  }
};

// ── 1. Get Payouts & Earnings for a Specific Vendor ──────────────────────────
router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  try {
    const commissionRate = await getPlatformCommissionRate();

    // Fetch all payouts for this vendor
    const payoutsRes = await query(
      `SELECT * FROM vendor_payouts 
       WHERE vendor_id = $1 OR LOWER(vendor_id) = LOWER($1) OR LOWER(vendor_email) = LOWER($1)
       ORDER BY created_at DESC`,
      [vendorId]
    );

    const rows = payoutsRes.rows;

    let totalGross = 0;
    let totalCommission = 0;
    let totalPayout = 0;
    let disbursedAmount = 0;
    let pendingAmount = 0;

    rows.forEach(p => {
      const gross = parseFloat(p.order_amount || 0);
      const comm = parseFloat(p.commission_amount || 0);
      const net = parseFloat(p.payout_amount || 0);

      totalGross += gross;
      totalCommission += comm;
      totalPayout += net;

      if (p.payout_status === 'completed' || p.payout_status === 'paid') {
        disbursedAmount += net;
      } else {
        pendingAmount += net;
      }
    });

    // Lookup current vendor bank details from users table
    let currentBankDetails = {};
    const userRes = await query(
      `SELECT bank_details FROM users WHERE id = $1 OR LOWER(email) = LOWER($1) LIMIT 1`,
      [vendorId]
    );
    if (userRes.rows.length > 0 && userRes.rows[0].bank_details) {
      currentBankDetails = userRes.rows[0].bank_details;
    }

    res.json({
      success: true,
      vendorId,
      commissionRate,
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
        disbursedAmount: Math.round(disbursedAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        orderCount: rows.length
      },
      bankDetails: currentBankDetails,
      payouts: rows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        vendorId: r.vendor_id,
        vendorName: r.vendor_name,
        orderAmount: parseFloat(r.order_amount || 0),
        commissionRate: parseFloat(r.commission_rate || 0),
        commissionAmount: parseFloat(r.commission_amount || 0),
        payoutAmount: parseFloat(r.payout_amount || 0),
        paymentMethod: r.payment_method,
        bankDetails: typeof r.bank_details === 'string' ? JSON.parse(r.bank_details) : (r.bank_details || {}),
        status: r.payout_status,
        reference: r.payout_reference,
        disbursedAt: r.disbursed_at,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching vendor payouts:', err);
    res.status(500).json({ error: 'Failed to fetch vendor payouts', message: err.message });
  }
});

// ── 2. Admin Summary (Company Revenue vs Vendor Disbursals) ──────────────────
router.get('/admin/summary', async (req, res) => {
  try {
    const commissionRate = await getPlatformCommissionRate();

    const aggRes = await query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(order_amount), 0) as total_volume,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COALESCE(SUM(payout_amount), 0) as total_vendor_share,
        COALESCE(SUM(CASE WHEN payout_status IN ('completed', 'paid') THEN payout_amount ELSE 0 END), 0) as total_disbursed,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN payout_amount ELSE 0 END), 0) as total_pending
      FROM vendor_payouts
    `);

    const stats = aggRes.rows[0];

    res.json({
      success: true,
      commissionRate,
      totalVolumeProcessed: parseFloat(stats.total_volume),
      totalPlatformCommission: parseFloat(stats.total_commission),
      totalVendorShare: parseFloat(stats.total_vendor_share),
      totalDisbursed: parseFloat(stats.total_disbursed),
      totalPendingDisbursal: parseFloat(stats.total_pending),
      payoutCount: parseInt(stats.total_count, 10)
    });
  } catch (err) {
    console.error('Error fetching admin payout summary:', err);
    res.status(500).json({ error: 'Failed to fetch admin payout summary', message: err.message });
  }
});

// ── 3. Admin All Payouts List ────────────────────────────────────────────────
router.get('/admin/all', async (req, res) => {
  const { status } = req.query;
  try {
    let q = 'SELECT * FROM vendor_payouts';
    const params = [];

    if (status) {
      q += ' WHERE payout_status = $1';
      params.push(status);
    }

    q += ' ORDER BY created_at DESC';

    const result = await query(q, params);

    res.json(result.rows.map(r => ({
      id: r.id,
      orderId: r.order_id,
      vendorId: r.vendor_id,
      vendorName: r.vendor_name,
      vendorEmail: r.vendor_email,
      orderAmount: parseFloat(r.order_amount || 0),
      commissionRate: parseFloat(r.commission_rate || 0),
      commissionAmount: parseFloat(r.commission_amount || 0),
      payoutAmount: parseFloat(r.payout_amount || 0),
      paymentMethod: r.payment_method,
      bankDetails: typeof r.bank_details === 'string' ? JSON.parse(r.bank_details) : (r.bank_details || {}),
      status: r.payout_status,
      reference: r.payout_reference,
      disbursedAt: r.disbursed_at,
      createdAt: r.created_at
    })));
  } catch (err) {
    console.error('Error fetching all payouts:', err);
    res.status(500).json({ error: 'Failed to fetch all payouts' });
  }
});

// ── 4. Disburse Payout to Vendor (PhonePe Payouts API / IMPS transfer) ────────
router.post('/:payoutId/disburse', async (req, res) => {
  const { payoutId } = req.params;
  const { utrNumber, note } = req.body || {};

  try {
    const payoutRes = await query(`SELECT * FROM vendor_payouts WHERE id = $1`, [payoutId]);
    if (payoutRes.rows.length === 0) {
      return res.status(404).json({ error: 'Payout record not found' });
    }

    const payout = payoutRes.rows[0];
    const payoutRef = utrNumber || `PP_DISB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const updateRes = await query(
      `UPDATE vendor_payouts 
       SET payout_status = 'completed', payout_reference = $1, disbursed_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [payoutRef, payoutId]
    );

    const updated = updateRes.rows[0];

    // Notify Vendor about successful bank disbursal
    try {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, read, link)
         VALUES ($1, $2, $3, $4, 'payout', false, '/profile?tab=earnings')`,
        [
          `notif_${Date.now()}_pd`,
          payout.vendor_id,
          '🏦 Bank Payout Disbursed Successfully!',
          `₹${parseFloat(payout.payout_amount).toFixed(2)} has been transferred to your registered bank account for Order #${payout.order_id}. Reference UTR: ${payoutRef}.`,
          '/profile?tab=earnings'
        ]
      );
    } catch (nErr) {
      console.warn('Notice sending disbursal notification:', nErr.message);
    }

    res.json({
      success: true,
      message: `₹${parseFloat(payout.payout_amount).toFixed(2)} disbursed to vendor bank account.`,
      payout: {
        id: updated.id,
        orderId: updated.order_id,
        vendorId: updated.vendor_id,
        payoutAmount: parseFloat(updated.payout_amount),
        status: updated.payout_status,
        reference: updated.payout_reference,
        disbursedAt: updated.disbursed_at
      }
    });
  } catch (err) {
    console.error('Error disbursing vendor payout:', err);
    res.status(500).json({ error: 'Failed to disburse payout', message: err.message });
  }
});

// ── 5. Platform Commission Settings ──────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const rate = await getPlatformCommissionRate();
    res.json({
      success: true,
      defaultRate: rate,
      model: 'percentage',
      description: 'Platform service & payment processing commission deducted from vendor gross sales.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  const { defaultRate } = req.body;
  const numRate = parseFloat(defaultRate);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return res.status(400).json({ error: 'Invalid commission rate. Must be between 0 and 100.' });
  }

  try {
    const payload = {
      defaultRate: numRate,
      model: 'percentage',
      updatedAt: new Date().toISOString()
    };

    await query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ('commission', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(payload)]
    );

    res.json({
      success: true,
      message: `Platform commission rate updated to ${numRate}%`,
      defaultRate: numRate
    });
  } catch (err) {
    console.error('Error updating commission settings:', err);
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
});

export default router;

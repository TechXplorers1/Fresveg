import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Starter',
    durationMonths: 1,
    days: 30,
    price: 499,
    originalPrice: 699,
    discount: '28% OFF',
    billingCycle: 'Billed monthly',
    badge: 'Flexible',
    popular: false,
    features: [
      'Display unlimited Paid & Free/Unpaid Farms',
      'Full visibility on Agritourism & Farm Tours directory',
      'Receive customer tour bookings & stay reservations',
      'Direct customer inquiries & contact calls/WhatsApp',
      'Verified Farm Host badge on farm profile',
      'Standard search ranking'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pro',
    durationMonths: 3,
    days: 90,
    price: 1299,
    originalPrice: 2097,
    discount: '38% OFF',
    monthlyEquivalent: 433,
    billingCycle: 'Billed every 3 months',
    badge: 'Most Popular',
    popular: true,
    features: [
      'Everything in Monthly Starter',
      'Priority search placement in Agritourism directory',
      '"Featured Farm" gold highlight badge',
      'Promote seasonal harvest, picking & festival tours',
      'Host multiple farm locations & activities',
      'Zero platform booking commission'
    ]
  },
  {
    id: 'half_yearly',
    name: 'Half-Yearly Master',
    durationMonths: 6,
    days: 180,
    price: 2299,
    originalPrice: 4194,
    discount: '45% OFF',
    monthlyEquivalent: 383,
    billingCycle: 'Billed every 6 months',
    badge: 'Best Value',
    popular: false,
    isBestValue: true,
    features: [
      'Everything in Quarterly Pro',
      'Top Homepage & Marketplace spotlight banner',
      'Verified Organic Agritourism Partner seal',
      'Maximum visibility across all search districts',
      'Dedicated seasonal farm video promotions',
      'Priority customer booking dispute resolution'
    ]
  }
];

export const FRESVEG_BILLING_DETAILS = {
  companyName: 'FresVeg Nigeria Limited',
  gstin: 'TIN-20489123-0001',
  pan: 'RC-1849201',
  billingAddress: 'Plot 12, Commercial Avenue, Victoria Island, Lagos, Nigeria 101241',
  bankName: 'Access Bank Plc',
  accountName: 'FresVeg Nigeria Limited',
  accountNumber: '0128945678',
  ifscCode: '044 (Access Bank)',
  accountType: 'Corporate Current Account',
  branch: 'Victoria Island Branch, Lagos',
  upiId: 'fresveg.billing@accessbank'
};

// Helper to check if subscription object is currently active
export const isSubscriptionActive = (sub) => {
  if (!sub || typeof sub !== 'object') return false;
  if (sub.status !== 'active') return false;
  if (!sub.endDate) return false;
  const end = new Date(sub.endDate);
  return !isNaN(end.getTime()) && end.getTime() > Date.now();
};

// 1. Get All Subscription Plans & Official Billing Details
router.get('/plans', (req, res) => {
  res.json({
    plans: SUBSCRIPTION_PLANS,
    billingDetails: FRESVEG_BILLING_DETAILS,
    currency: 'NGN',
    symbol: '₦'
  });
});

// 2. Get Vendor Subscription Status
router.get('/status/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    const userRes = await query(
      `SELECT id, email, display_name, role, farm_subscription 
       FROM users 
       WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [vendorId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const user = userRes.rows[0];
    let sub = user.farm_subscription;
    if (typeof sub === 'string') {
      try { sub = JSON.parse(sub); } catch (e) { sub = {}; }
    }
    sub = sub || {};

    const active = isSubscriptionActive(sub);
    let daysRemaining = 0;
    if (sub.endDate) {
      const msLeft = new Date(sub.endDate).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }

    // Auto-update status to expired if date passed
    if (sub.status === 'active' && !active && sub.endDate) {
      sub.status = 'expired';
      await query(
        `UPDATE users SET farm_subscription = $1 WHERE id = $2`,
        [JSON.stringify(sub), user.id]
      );
      await query(
        `UPDATE farm_subscriptions SET status = 'expired' WHERE vendor_id = $1 AND status = 'active'`,
        [user.id]
      );
      await query(
        `UPDATE farms SET is_published = false WHERE owner_id = $1 OR vendor_id = $1`,
        [user.id]
      );
    }

    // Count vendor farms
    const farmCountRes = await query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN cost_type = 'free' OR cost_per_person = 0 THEN 1 END) as free_farms,
              COUNT(CASE WHEN cost_type != 'free' AND cost_per_person > 0 THEN 1 END) as paid_farms
       FROM farms 
       WHERE owner_id = $1 OR vendor_id = $1 OR LOWER(vendor_email) = LOWER($2)`,
      [user.id, user.email]
    );

    const farmCounts = farmCountRes.rows[0] || { total: 0, free_farms: 0, paid_farms: 0 };

    res.json({
      vendorId: user.id,
      vendorEmail: user.email,
      vendorName: user.display_name,
      hasActiveSubscription: active,
      subscription: {
        ...sub,
        daysRemaining,
        isActive: active
      },
      farmCounts: {
        total: parseInt(farmCounts.total || 0, 10),
        free: parseInt(farmCounts.free_farms || 0, 10),
        paid: parseInt(farmCounts.paid_farms || 0, 10)
      }
    });
  } catch (err) {
    console.error('Error fetching subscription status:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// 3. Subscribe or Renew Plan
router.post('/subscribe', async (req, res) => {
  const { vendorId, planId, paymentMethod = 'Direct Bank / UPI', paymentReference, paymentDetails = {} } = req.body;

  if (!vendorId || !planId) {
    return res.status(400).json({ error: 'vendorId and planId are required' });
  }

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!selectedPlan) {
    return res.status(400).json({ error: `Invalid planId. Must be one of: ${SUBSCRIPTION_PLANS.map(p => p.id).join(', ')}` });
  }

  try {
    const userRes = await query(
      `SELECT id, email, display_name, farm_subscription 
       FROM users 
       WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [vendorId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const user = userRes.rows[0];
    const now = new Date();
    
    // Check if vendor already has remaining days from active subscription, extend if valid
    let startTimestamp = now.getTime();
    let currentSub = user.farm_subscription;
    if (typeof currentSub === 'string') {
      try { currentSub = JSON.parse(currentSub); } catch (e) { currentSub = {}; }
    }
    if (isSubscriptionActive(currentSub)) {
      const existingEnd = new Date(currentSub.endDate).getTime();
      if (existingEnd > startTimestamp) {
        startTimestamp = existingEnd; // Extend seamlessly
      }
    }

    const durationDays = selectedPlan.days;
    const endTimestamp = startTimestamp + (durationDays * 24 * 60 * 60 * 1000);
    const startDate = new Date(now.getTime());
    const endDate = new Date(endTimestamp);

    const subscriptionId = `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const finalReference = paymentReference || `FARM-SUB-${Date.now().toString().slice(-6)}`;

    const newSubData = {
      subscriptionId,
      status: 'active',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      durationMonths: selectedPlan.durationMonths,
      days: selectedPlan.days,
      amount: selectedPlan.price,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentMethod,
      paymentReference: finalReference,
      paymentDetails,
      updatedAt: now.toISOString()
    };

    // 1. Update user record
    await query(
      `UPDATE users SET farm_subscription = $1 WHERE id = $2`,
      [JSON.stringify(newSubData), user.id]
    );

    // 2. Insert into audit table farm_subscriptions
    await query(
      `INSERT INTO farm_subscriptions (
        id, vendor_id, vendor_email, vendor_name, plan_id, plan_name,
        duration_months, days, amount, start_date, end_date, status,
        payment_method, payment_reference
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        subscriptionId,
        user.id,
        user.email,
        user.display_name,
        selectedPlan.id,
        selectedPlan.name,
        selectedPlan.durationMonths,
        selectedPlan.days,
        selectedPlan.price,
        startDate,
        endDate,
        'active',
        paymentMethod,
        finalReference
      ]
    );

    // 3. Activate visibility for all of this vendor's farms
    await query(
      `UPDATE farms 
       SET is_published = true 
       WHERE owner_id = $1 OR vendor_id = $1 OR LOWER(vendor_email) = LOWER($2)`,
      [user.id, user.email]
    );

    // 4. Send confirmation notification to the vendor
    try {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, read, link)
         VALUES ($1, $2, $3, $4, $5, false, $6)`,
        [
          `notif_${Date.now()}_sub`,
          user.id,
          '🌾 Farm Display Subscription Activated!',
          `Your ${selectedPlan.name} (${selectedPlan.durationMonths} Month${selectedPlan.durationMonths > 1 ? 's' : ''}) is now active until ${endDate.toLocaleDateString()}. All your paid and unpaid farms are now published and live to customers!`,
          'info',
          '/profile?tab=farms'
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to insert subscription notification:', notifErr);
    }

    const msLeft = endDate.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      message: `Successfully activated ${selectedPlan.name}`,
      subscription: {
        ...newSubData,
        daysRemaining,
        isActive: true
      }
    });
  } catch (err) {
    console.error('Error activating farm subscription:', err);
    res.status(500).json({ error: 'Failed to activate subscription', details: err.message });
  }
});

// 4. Cancel / Deactivate Subscription (for testing or vendor opt-out)
router.post('/cancel', async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({ error: 'vendorId is required' });
  }

  try {
    const userRes = await query(
      `SELECT id, email, farm_subscription FROM users WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [vendorId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const user = userRes.rows[0];
    let currentSub = user.farm_subscription;
    if (typeof currentSub === 'string') {
      try { currentSub = JSON.parse(currentSub); } catch (e) { currentSub = {}; }
    }
    currentSub = currentSub || {};
    currentSub.status = 'cancelled';
    currentSub.cancelledAt = new Date().toISOString();

    await query(`UPDATE users SET farm_subscription = $1 WHERE id = $2`, [JSON.stringify(currentSub), user.id]);
    await query(`UPDATE farm_subscriptions SET status = 'cancelled' WHERE vendor_id = $1 AND status = 'active'`, [user.id]);
    await query(`UPDATE farms SET is_published = false WHERE owner_id = $1 OR vendor_id = $1 OR LOWER(vendor_email) = LOWER($2)`, [user.id, user.email]);

    res.json({
      success: true,
      message: 'Subscription cancelled. Farms are now hidden from public view.',
      subscription: {
        ...currentSub,
        isActive: false,
        daysRemaining: 0
      }
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// 5. Get Vendor Subscription Billing & Invoice History
router.get('/history/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    const userRes = await query(
      `SELECT id, email FROM users WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [vendorId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const user = userRes.rows[0];

    const historyRes = await query(
      `SELECT id, vendor_id, vendor_email, vendor_name, plan_id, plan_name,
              duration_months, days, amount, start_date, end_date, status,
              payment_method, payment_reference, created_at
       FROM farm_subscriptions
       WHERE vendor_id = $1 OR LOWER(vendor_email) = LOWER($2)
       ORDER BY created_at DESC`,
      [user.id, user.email]
    );

    res.json({
      history: historyRes.rows.map(row => ({
        id: row.id,
        planId: row.plan_id,
        planName: row.plan_name,
        durationMonths: row.duration_months,
        days: row.days,
        amount: parseFloat(row.amount),
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference,
        createdAt: row.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching subscription billing history:', err);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

export default router;

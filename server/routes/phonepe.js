import express from 'express';
import crypto from 'crypto';
import { query } from '../db/index.js';
import { recordOrderPayouts } from './payouts.js';

const router = express.Router();

// ── PhonePe Environment Configuration ─────────────────────────────────────────
const getPhonePeConfig = () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86';
  const saltKey = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const hostUrl = process.env.PHONEPE_HOST_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  const appBeUrl = process.env.APP_BE_URL || 'http://localhost:5000';
  const appFeUrl = process.env.APP_FE_URL || 'http://localhost:5173';

  return { merchantId, saltKey, saltIndex, hostUrl, appBeUrl, appFeUrl };
};

// ── Checksum Helpers ─────────────────────────────────────────────────────────
const createSha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

const generatePayChecksum = (base64Payload, endpointPath, saltKey, saltIndex) => {
  return `${createSha256(base64Payload + endpointPath + saltKey)}###${saltIndex}`;
};

const generateStatusChecksum = (merchantId, transactionId, saltKey, saltIndex) => {
  return `${createSha256(`/pg/v1/status/${merchantId}/${transactionId}${saltKey}`)}###${saltIndex}`;
};

// ── Helper: Format Order ──────────────────────────────────────────────────────
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
  timestamp: row.timestamp
});

// ── 1. Initiate PhonePe Payment ──────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  try {
    const {
      orderType = 'order', // 'order' or 'farm_booking'
      orderId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      vendorPhone,
      items,
      total,
      address,
      // Farm booking specific fields:
      bookingId,
      farmId,
      farmName,
      vendorId,
      vendorName,
      date,
      visitorsCount,
      totalAmount,
      includeStay,
      accommodationTitle
    } = req.body;

    const { merchantId, saltKey, saltIndex, hostUrl, appBeUrl, appFeUrl } = getPhonePeConfig();

    const resolvedCustomerId = customerId || req.body.userId || 'CUST_GUEST';
    const numTotal = parseFloat(orderType === 'farm_booking' ? (totalAmount || total || 0) : (total || 0));

    if (numTotal <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    const merchantTransactionId = `MT${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const sanitizedMobile = (customerPhone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999';

    let targetId = '';

    if (orderType === 'farm_booking') {
      targetId = bookingId || `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const initialPaymentDetails = {
        gateway: 'PhonePe',
        merchantTransactionId,
        paymentType: 'PAY_PAGE',
        initiatedAt: new Date().toISOString()
      };

      // Stage booking in database
      await query(
        `INSERT INTO farm_bookings (
          id, farm_id, farm_name, vendor_id, vendor_name,
          user_id, customer_id, user_name, customer_name, user_email, customer_email, user_phone,
          visit_date, date, guests, visitors_count, total_price, total_amount,
          include_stay, accommodation_title, payment_method, payment_status, payment_details, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (id) DO UPDATE
        SET payment_method = EXCLUDED.payment_method,
            payment_status = EXCLUDED.payment_status,
            payment_details = EXCLUDED.payment_details`,
        [
          targetId,
          farmId || 'mock-farm-1',
          farmName || 'Organic Farm',
          vendorId || 'vendor-1',
          vendorName || 'Farm Host',
          resolvedCustomerId,
          resolvedCustomerId,
          customerName || 'Customer',
          customerName || 'Customer',
          customerEmail || '',
          customerEmail || '',
          sanitizedMobile,
          date || new Date().toISOString().split('T')[0],
          date || new Date().toISOString().split('T')[0],
          visitorsCount || 1,
          visitorsCount || 1,
          numTotal,
          numTotal,
          includeStay || false,
          accommodationTitle || '',
          'PhonePe',
          'pending',
          JSON.stringify(initialPaymentDetails),
          'pending'
        ]
      );
    } else {
      // Standard produce order
      targetId = orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
      const initialPaymentDetails = {
        gateway: 'PhonePe',
        merchantTransactionId,
        paymentType: 'PAY_PAGE',
        initiatedAt: new Date().toISOString()
      };

      // Stage order in database
      await query(
        `INSERT INTO orders (
          order_id, customer_id, customer_name, customer_email, customer_phone, vendor_phone,
          items, total, address, payment_method, status, payment_details, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (order_id) DO UPDATE
        SET payment_method = EXCLUDED.payment_method,
            payment_status = EXCLUDED.payment_status,
            payment_details = EXCLUDED.payment_details`,
        [
          targetId,
          resolvedCustomerId,
          customerName || 'Customer',
          customerEmail || '',
          sanitizedMobile,
          vendorPhone || '',
          itemsJson,
          numTotal,
          address || '',
          'PhonePe',
          'pending',
          JSON.stringify(initialPaymentDetails),
          'pending'
        ]
      );
    }

    // PhonePe Standard Pay Page Payload
    const redirectUrl = `${appBeUrl}/api/payment/phonepe/redirect?txnId=${merchantTransactionId}&targetId=${targetId}&type=${orderType}`;
    const callbackUrl = `${appBeUrl}/api/payment/phonepe/callback`;

    const amountInPaise = Math.round(numTotal * 100);

    const payPayload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: String(resolvedCustomerId).replace(/[^a-zA-Z0-9_-]/g, '_'),
      amount: amountInPaise,
      redirectUrl,
      redirectMode: 'POST',
      callbackUrl,
      mobileNumber: sanitizedMobile,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payPayload)).toString('base64');
    const checksum = generatePayChecksum(base64Payload, '/pg/v1/pay', saltKey, saltIndex);

    console.log(`[PhonePe] Initiating payment for ${orderType} #${targetId}, amount: ₦${numTotal} (${amountInPaise} paise), txnId: ${merchantTransactionId}`);

    const phonePeResponse = await fetch(`${hostUrl}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const responseData = await phonePeResponse.json().catch(() => ({}));
    console.log('[PhonePe] Pay API response:', JSON.stringify(responseData));

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      const paymentRedirectUrl = responseData.data.instrumentResponse.redirectInfo.url;
      return res.json({
        success: true,
        redirectUrl: paymentRedirectUrl,
        merchantTransactionId,
        orderId: targetId,
        orderType,
        amount: numTotal
      });
    }

    // If PhonePe UAT returned TOO_MANY_REQUESTS or any sandbox limitation, provide fallback to interactive test simulator
    console.warn('[PhonePe] Pay API returned non-success:', responseData);
    if (process.env.PHONEPE_ENV === 'UAT' || !process.env.PHONEPE_ENV || responseData.code === 'TOO_MANY_REQUESTS' || phonePeResponse.status === 429) {
      console.log(`[PhonePe] UAT sandbox rate-limited or in maintenance (${responseData.code || phonePeResponse.status}). Redirecting to built-in PhonePe Test Sandbox Simulator.`);
      const simulatorUrl = `${appFeUrl}/payment/phonepe-simulator?txnId=${merchantTransactionId}&orderId=${targetId}&type=${orderType}&amount=${numTotal}&rateLimited=true`;
      return res.json({
        success: true,
        redirectUrl: simulatorUrl,
        merchantTransactionId,
        orderId: targetId,
        orderType,
        amount: numTotal,
        isSimulator: true,
        notice: 'PhonePe UAT Sandbox is rate-limited; interactive sandbox simulator provided.'
      });
    }

    return res.status(400).json({
      success: false,
      code: responseData.code || 'PAYMENT_INITIATION_FAILED',
      message: responseData.message || 'PhonePe payment could not be initiated at this moment.',
      data: responseData.data
    });
  } catch (err) {
    console.error('[PhonePe] Initiation Error:', err);
    // In UAT mode, if network error occurs, fallback to interactive simulator
    const { appFeUrl } = getPhonePeConfig();
    if (process.env.PHONEPE_ENV === 'UAT' || !process.env.PHONEPE_ENV) {
      const fallbackTxnId = `MT${Date.now()}`;
      const targetId = req.body?.orderId || req.body?.bookingId || `ORD-${Date.now()}`;
      const orderType = req.body?.orderType || 'order';
      const numTotal = req.body?.total || req.body?.totalAmount || 100;
      return res.json({
        success: true,
        redirectUrl: `${appFeUrl}/payment/phonepe-simulator?txnId=${fallbackTxnId}&orderId=${targetId}&type=${orderType}&amount=${numTotal}&offline=true`,
        merchantTransactionId: fallbackTxnId,
        orderId: targetId,
        orderType,
        amount: numTotal,
        isSimulator: true
      });
    }
    res.status(500).json({ error: 'Failed to initiate PhonePe payment', message: err.message });
  }
});

// ── 2. Handle Browser Return Redirect (PhonePe sends POST/GET here) ───────────
const handleRedirect = async (req, res) => {
  try {
    const { merchantId, saltKey, saltIndex, hostUrl, appFeUrl } = getPhonePeConfig();

    // PhonePe POST body or query parameters
    const txnId = req.query.txnId || req.body?.transactionId || req.body?.merchantTransactionId;
    const targetId = req.query.targetId || req.query.orderId;
    const orderType = req.query.type || 'order';

    console.log(`[PhonePe Redirect] User redirected back. TxnId: ${txnId}, TargetId: ${targetId}, Type: ${orderType}`);

    if (!txnId) {
      return res.redirect(`${appFeUrl}/payment/phonepe-status?status=FAILED&message=Transaction+ID+missing`);
    }

    // Call PhonePe Status API to check the definitive transaction state
    const statusChecksum = generateStatusChecksum(merchantId, txnId, saltKey, saltIndex);
    const statusApiUrl = `${hostUrl}/pg/v1/status/${merchantId}/${txnId}`;

    console.log(`[PhonePe Status Check] Querying ${statusApiUrl}`);
    const statusResponse = await fetch(statusApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': statusChecksum,
        'X-MERCHANT-ID': merchantId
      }
    });

    const statusData = await statusResponse.json();
    console.log('[PhonePe Status Check] Result:', JSON.stringify(statusData));

    const isSuccess = statusData.success && (statusData.code === 'PAYMENT_SUCCESS' || statusData.data?.state === 'COMPLETED');
    const isPending = statusData.code === 'PAYMENT_PENDING' || statusData.data?.state === 'PENDING';

    const transactionDetails = {
      gateway: 'PhonePe',
      merchantTransactionId: txnId,
      phonepeTransactionId: statusData.data?.transactionId || '',
      responseCode: statusData.data?.responseCode || statusData.code,
      paymentInstrument: statusData.data?.paymentInstrument || {},
      verifiedAt: new Date().toISOString()
    };

    if (isSuccess) {
      if (orderType === 'farm_booking') {
        await query(
          `UPDATE farm_bookings 
           SET payment_status = 'paid', status = 'confirmed', payment_details = $1
           WHERE id = $2`,
          [JSON.stringify(transactionDetails), targetId]
        );

        // Get customer ID to send notification
        const bookingRes = await query('SELECT user_id, farm_name, total_amount FROM farm_bookings WHERE id = $1', [targetId]);
        if (bookingRes.rows.length > 0) {
          const b = bookingRes.rows[0];
          await query(
            `INSERT INTO notifications (id, user_id, title, message, type, read, link)
             VALUES ($1, $2, $3, $4, $5, false, $6)`,
            [
              `notif_${Date.now()}_pb`,
              b.user_id,
              '🌿 Farm Booking Confirmed via PhonePe!',
              `Your farm visit booking for ${b.farm_name} (₦${parseFloat(b.total_amount).toFixed(2)}) is confirmed.`,
              'booking',
              '/visit-farms'
            ]
          );
        }
      } else {
        // Produce order
        const updatedOrder = await query(
          `UPDATE orders 
           SET payment_status = 'paid', status = 'confirmed', payment_details = $1
           WHERE order_id = $2 OR LOWER(order_id) = LOWER($2)
           RETURNING *`,
          [JSON.stringify(transactionDetails), targetId]
        );

        if (updatedOrder.rows.length > 0) {
          const row = updatedOrder.rows[0];
          const customerId = row.customer_id;

          // Clear customer cart after successful paid order
          try {
            await query(`UPDATE carts SET items = '[]'::jsonb WHERE user_id = $1`, [customerId]);
          } catch (cErr) {
            console.warn('[PhonePe] Notice clearing user cart:', cErr.message);
          }

          // Customer in-app notification
          try {
            await query(
              `INSERT INTO notifications (id, user_id, title, message, type, read, link)
               VALUES ($1, $2, $3, $4, $5, false, $6)`,
              [
                `notif_${Date.now()}_pp`,
                customerId,
                '✅ Payment Received via PhonePe',
                `Your order #${targetId} of ₦${parseFloat(row.total).toFixed(2)} has been successfully paid via PhonePe and is now being packed.`,
                'order',
                `/order/${targetId}`
              ]
            );
          } catch (notifErr) {
            console.warn('[PhonePe] Notification error:', notifErr.message);
          }

          // Record platform commission & vendor payout ledger
          try {
            await recordOrderPayouts(targetId);
          } catch (payoutErr) {
            console.error('[PhonePe] Failed to record order payouts in redirect:', payoutErr);
          }
        }
      }

      return res.redirect(`${appFeUrl}/payment/phonepe-status?status=SUCCESS&orderId=${targetId}&txnId=${txnId}&type=${orderType}`);
    } else if (isPending) {
      return res.redirect(`${appFeUrl}/payment/phonepe-status?status=PENDING&orderId=${targetId}&txnId=${txnId}&type=${orderType}`);
    } else {
      // Payment Failed or Cancelled
      const reason = statusData.message || statusData.code || 'Payment declined by user or bank';
      if (orderType === 'farm_booking') {
        await query(`UPDATE farm_bookings SET payment_status = 'failed' WHERE id = $1`, [targetId]);
      } else {
        await query(`UPDATE orders SET payment_status = 'failed' WHERE order_id = $1 OR LOWER(order_id) = LOWER($1)`, [targetId]);
      }

      return res.redirect(`${appFeUrl}/payment/phonepe-status?status=FAILED&orderId=${targetId}&txnId=${txnId}&type=${orderType}&reason=${encodeURIComponent(reason)}`);
    }
  } catch (err) {
    console.error('[PhonePe Redirect Error]', err);
    const { appFeUrl } = getPhonePeConfig();
    return res.redirect(`${appFeUrl}/payment/phonepe-status?status=FAILED&message=${encodeURIComponent(err.message)}`);
  }
};

router.post('/redirect', handleRedirect);
router.get('/redirect', handleRedirect);

// ── 3. Server-to-Server Webhook Callback ─────────────────────────────────────
router.post('/callback', async (req, res) => {
  try {
    const { merchantId, saltKey, saltIndex } = getPhonePeConfig();
    const xVerifyHeader = req.headers['x-verify'];

    const responseBase64 = req.body?.response;
    if (!responseBase64) {
      return res.status(400).json({ error: 'Empty callback response payload' });
    }

    // Verify SHA256 checksum
    const calculatedChecksum = `${createSha256(responseBase64 + saltKey)}###${saltIndex}`;
    if (xVerifyHeader && xVerifyHeader !== calculatedChecksum) {
      console.warn('[PhonePe Callback] Checksum verification mismatch:', { received: xVerifyHeader, calculated: calculatedChecksum });
      return res.status(400).json({ error: 'Checksum verification failed' });
    }

    const decodedString = Buffer.from(responseBase64, 'base64').toString('utf-8');
    const callbackData = JSON.parse(decodedString);
    console.log('[PhonePe Callback] Received event:', JSON.stringify(callbackData));

    const isSuccess = callbackData.success && (callbackData.code === 'PAYMENT_SUCCESS' || callbackData.data?.state === 'COMPLETED');
    const txnId = callbackData.data?.merchantTransactionId;

    if (isSuccess && txnId) {
      const details = {
        gateway: 'PhonePe',
        merchantTransactionId: txnId,
        phonepeTransactionId: callbackData.data?.transactionId || '',
        paymentInstrument: callbackData.data?.paymentInstrument || {},
        verifiedViaWebhook: true,
        verifiedAt: new Date().toISOString()
      };

      // Update regular orders
      const updatedOrders = await query(
        `UPDATE orders 
         SET payment_status = 'paid', status = 'confirmed', payment_details = $1
         WHERE payment_details->>'merchantTransactionId' = $2
         RETURNING order_id`,
        [JSON.stringify(details), txnId]
      );

      // Record payouts for updated orders
      if (updatedOrders.rows.length > 0) {
        for (const o of updatedOrders.rows) {
          try {
            await recordOrderPayouts(o.order_id);
          } catch (pErr) {
            console.error('[PhonePe Webhook] Error recording order payout:', pErr);
          }
        }
      }

      // Update farm bookings
      await query(
        `UPDATE farm_bookings 
         SET payment_status = 'paid', status = 'confirmed', payment_details = $1
         WHERE payment_details->>'merchantTransactionId' = $2`,
        [JSON.stringify(details), txnId]
      );
    }

    res.json({ success: true, message: 'Callback processed' });
  } catch (err) {
    console.error('[PhonePe Callback Error]', err);
    res.status(500).json({ error: 'Internal callback error', message: err.message });
  }
});

// ── 4. Transaction Status Query Endpoint ──────────────────────────────────────
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { merchantId, saltKey, saltIndex, hostUrl } = getPhonePeConfig();

    // 1. Check local PostgreSQL database first
    const orderRes = await query(
      `SELECT * FROM orders 
       WHERE payment_details->>'merchantTransactionId' = $1 
          OR order_id = $1 
          OR LOWER(order_id) = LOWER($1)`,
      [transactionId]
    );

    const bookingRes = await query(
      `SELECT * FROM farm_bookings 
       WHERE payment_details->>'merchantTransactionId' = $1 
          OR id = $1`,
      [transactionId]
    );

    let localRecord = null;
    let recordType = 'order';

    if (orderRes.rows.length > 0) {
      localRecord = formatOrder(orderRes.rows[0]);
      recordType = 'order';
    } else if (bookingRes.rows.length > 0) {
      localRecord = bookingRes.rows[0];
      recordType = 'farm_booking';
    }

    // 2. Query PhonePe Status API
    let phonepeData = null;
    try {
      const statusChecksum = generateStatusChecksum(merchantId, transactionId, saltKey, saltIndex);
      const resp = await fetch(`${hostUrl}/pg/v1/status/${merchantId}/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': statusChecksum,
          'X-MERCHANT-ID': merchantId
        }
      });
      phonepeData = await resp.json();
    } catch (e) {
      console.warn('[PhonePe Status API Warning]', e.message);
    }

    res.json({
      success: true,
      transactionId,
      recordType,
      record: localRecord,
      phonepe: phonepeData,
      isPaid: (localRecord?.paymentStatus === 'paid') || (phonepeData?.code === 'PAYMENT_SUCCESS')
    });
  } catch (err) {
    console.error('[PhonePe Status Error]', err);
    res.status(500).json({ error: 'Failed to fetch transaction status', message: err.message });
  }
});

// ── 5. Instant Test Simulation (Development / Sandbox) ────────────────────────
router.post('/simulate', async (req, res) => {
  try {
    const { targetId, orderType = 'order', status = 'SUCCESS', transactionId } = req.body;
    const txnId = transactionId || `SIM_PP_${Date.now()}`;

    const simDetails = {
      gateway: 'PhonePe',
      merchantTransactionId: txnId,
      phonepeTransactionId: `T_SIM_${Date.now()}`,
      paymentInstrument: {
        type: 'UPI',
        utr: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        vpa: 'testuser@ybl'
      },
      simulated: true,
      verifiedAt: new Date().toISOString()
    };

    if (status === 'SUCCESS') {
      if (orderType === 'farm_booking') {
        const result = await query(
          `UPDATE farm_bookings 
           SET payment_status = 'paid', status = 'confirmed', payment_details = $1
           WHERE id = $2 RETURNING *`,
          [JSON.stringify(simDetails), targetId]
        );
        return res.json({ success: true, booking: result.rows[0] });
      } else {
        const result = await query(
          `UPDATE orders 
           SET payment_status = 'paid', status = 'confirmed', payment_details = $1
           WHERE order_id = $2 OR LOWER(order_id) = LOWER($2) RETURNING *`,
          [JSON.stringify(simDetails), targetId]
        );
        if (result.rows[0]?.customer_id) {
          try {
            await query(`UPDATE carts SET items = '[]'::jsonb WHERE user_id = $1`, [result.rows[0].customer_id]);
          } catch {}
        }
        try {
          await recordOrderPayouts(targetId);
        } catch (payoutErr) {
          console.error('[PhonePe Simulate] Failed to record order payouts:', payoutErr);
        }
        return res.json({ success: true, order: formatOrder(result.rows[0]) });
      }
    } else {
      if (orderType === 'farm_booking') {
        await query(`UPDATE farm_bookings SET payment_status = 'failed' WHERE id = $1`, [targetId]);
      } else {
        await query(`UPDATE orders SET payment_status = 'failed' WHERE order_id = $1`, [targetId]);
      }
      return res.json({ success: false, message: 'Payment simulated as failed' });
    }
  } catch (err) {
    console.error('[PhonePe Simulate Error]', err);
    res.status(500).json({ error: 'Simulation failed', message: err.message });
  }
});

export default router;

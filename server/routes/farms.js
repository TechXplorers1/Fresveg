import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Helper to format farm row
const formatFarm = (row) => ({
  id: row.id,
  farmId: row.id,
  name: row.name || row.farm_name || 'Organic Farm',
  farmName: row.farm_name || row.name || 'Organic Farm',
  location: row.location || '',
  vendorId: row.owner_id || row.vendor_id || '',
  ownerId: row.owner_id || row.vendor_id || '',
  vendorName: row.vendor_name || 'Farm Host',
  vendorEmail: row.vendor_email || '',
  image: row.image || '',
  description: row.description || '',
  activities: row.activities || [],
  crops: row.crops || [],
  fruits: row.fruits || [],
  livestock: row.livestock || [],
  kidsActivities: row.kids_activities || [],
  accommodations: row.accommodations || [],
  farmProducts: row.farm_products || [],
  cropPhotos: row.crop_photos || [],
  livestockPhotos: row.livestock_photos || [],
  kidsPhotos: row.kids_photos || [],
  accommodationPhotos: row.accommodation_photos || [],
  gallery: row.gallery || [],
  costPerPerson: parseFloat(row.cost_per_person || row.price_per_person || 0),
  pricePerPerson: parseFloat(row.price_per_person || row.cost_per_person || 0),
  costType: row.cost_type || (parseFloat(row.price_per_person || row.cost_per_person || 0) === 0 ? 'free' : 'payable'),
  visitDays: row.visit_days || 'Weekends Only',
  visitTimings: row.visit_timings || 'Morning 9AM – 6PM',
  rating: parseFloat(row.rating || 4.8),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// 1. Get All Farms
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM farms ORDER BY created_at DESC');
    res.json(result.rows.map(formatFarm));
  } catch (err) {
    console.error('Error fetching farms:', err);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

// 2. Get Single Farm by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM farms WHERE id = $1 OR name = $2', [id, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.json(formatFarm(result.rows[0]));
  } catch (err) {
    console.error('Error fetching farm details:', err);
    res.status(500).json({ error: 'Failed to fetch farm details' });
  }
});

// 3. Create or Update Farm
router.post('/', async (req, res) => {
  const {
    id, name, farmName, location, ownerId, vendorId, vendorName, vendorEmail,
    image, description, costPerPerson, pricePerPerson, costType, accommodationPrice,
    accommodations, crops, fruits, livestock, kidsActivities, farmProducts, stayList,
    activities, cropPhotos, livestockPhotos, kidsPhotos, accommodationPhotos, gallery,
    socialLinks, visitDays, visitTimings, rating
  } = req.body;

  const farmTitle = farmName || name;
  const targetLocation = location;

  if (!farmTitle || !targetLocation) {
    return res.status(400).json({ error: 'Farm name and location are required' });
  }

  const farmId = id || `farm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO farms (
        id, name, farm_name, location, owner_id, vendor_id, vendor_name, vendor_email,
        image, description, cost_per_person, price_per_person, cost_type, accommodation_price,
        accommodations, crops, fruits, livestock, kids_activities, farm_products, stay_list,
        activities, crop_photos, livestock_photos, kids_photos, accommodation_photos, gallery,
        social_links, visit_days, visit_timings, rating, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           farm_name = EXCLUDED.farm_name,
           location = EXCLUDED.location,
           owner_id = COALESCE(EXCLUDED.owner_id, farms.owner_id),
           vendor_id = COALESCE(EXCLUDED.vendor_id, farms.vendor_id),
           vendor_name = COALESCE(EXCLUDED.vendor_name, farms.vendor_name),
           vendor_email = COALESCE(EXCLUDED.vendor_email, farms.vendor_email),
           image = COALESCE(EXCLUDED.image, farms.image),
           description = COALESCE(EXCLUDED.description, farms.description),
           cost_per_person = EXCLUDED.cost_per_person,
           price_per_person = EXCLUDED.price_per_person,
           cost_type = EXCLUDED.cost_type,
           accommodation_price = EXCLUDED.accommodation_price,
           accommodations = EXCLUDED.accommodations,
           crops = EXCLUDED.crops,
           fruits = EXCLUDED.fruits,
           livestock = EXCLUDED.livestock,
           kids_activities = EXCLUDED.kids_activities,
           farm_products = EXCLUDED.farm_products,
           stay_list = EXCLUDED.stay_list,
           activities = EXCLUDED.activities,
           crop_photos = EXCLUDED.crop_photos,
           livestock_photos = EXCLUDED.livestock_photos,
           kids_photos = EXCLUDED.kids_photos,
           accommodation_photos = EXCLUDED.accommodation_photos,
           gallery = EXCLUDED.gallery,
           social_links = EXCLUDED.social_links,
           visit_days = EXCLUDED.visit_days,
           visit_timings = EXCLUDED.visit_timings,
           rating = EXCLUDED.rating,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        farmId,
        farmTitle,
        farmTitle,
        targetLocation,
        ownerId || vendorId || null,
        vendorId || ownerId || null,
        vendorName || 'Farm Host',
        vendorEmail || '',
        image || '',
        description || '',
        parseFloat(costPerPerson || pricePerPerson || 0),
        parseFloat(pricePerPerson || costPerPerson || 0),
        costType || (parseFloat(costPerPerson || pricePerPerson || 0) === 0 ? 'free' : 'payable'),
        parseFloat(accommodationPrice || 0),
        typeof accommodations === 'string' ? accommodations : JSON.stringify(accommodations || []),
        typeof crops === 'string' ? crops : JSON.stringify(crops || []),
        typeof fruits === 'string' ? fruits : JSON.stringify(fruits || []),
        typeof livestock === 'string' ? livestock : JSON.stringify(livestock || []),
        typeof kidsActivities === 'string' ? kidsActivities : JSON.stringify(kidsActivities || []),
        typeof farmProducts === 'string' ? farmProducts : JSON.stringify(farmProducts || []),
        typeof stayList === 'string' ? stayList : JSON.stringify(stayList || []),
        typeof activities === 'string' ? activities : JSON.stringify(activities || []),
        typeof cropPhotos === 'string' ? cropPhotos : JSON.stringify(cropPhotos || []),
        typeof livestockPhotos === 'string' ? livestockPhotos : JSON.stringify(livestockPhotos || []),
        typeof kidsPhotos === 'string' ? kidsPhotos : JSON.stringify(kidsPhotos || []),
        typeof accommodationPhotos === 'string' ? accommodationPhotos : JSON.stringify(accommodationPhotos || []),
        typeof gallery === 'string' ? gallery : JSON.stringify(gallery || []),
        typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
        visitDays || 'Weekends Only',
        visitTimings || 'Morning 9AM – 6PM',
        parseFloat(rating || 4.8)
      ]
    );

    res.status(201).json(formatFarm(result.rows[0]));
  } catch (err) {
    console.error('Error saving farm:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to save farm', details: err.message });
  }
});

// 4. Get Farm Visit Bookings
router.get('/bookings/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM farm_bookings ORDER BY created_at DESC');
    const bookings = result.rows.map(row => ({
      id: row.id,
      bookingId: row.id,
      farmId: row.farm_id,
      farmName: row.farm_name || 'Organic Farm',
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      userId: row.customer_id || row.user_id,
      customerId: row.customer_id || row.user_id,
      userName: row.customer_name || row.user_name || 'Customer',
      customerName: row.customer_name || row.user_name || 'Customer',
      userEmail: row.customer_email || row.user_email || '',
      customerEmail: row.customer_email || row.user_email || '',
      userPhone: row.user_phone || row.customer_phone || '',
      customerPhone: row.user_phone || row.customer_phone || '',
      visitDate: row.date || row.visit_date || '2026-08-30',
      date: row.date || row.visit_date || '2026-08-30',
      guests: row.visitors_count || row.guests || 1,
      visitorsCount: row.visitors_count || row.guests || 1,
      totalPrice: parseFloat(row.total_amount || row.total_price || 0),
      totalAmount: parseFloat(row.total_amount || row.total_price || 0),
      includeStay: row.include_stay || false,
      accommodationTitle: row.accommodation_title || '',
      paymentMethod: row.payment_method || 'Online UPI',
      status: row.status || 'confirmed',
      createdAt: row.created_at
    }));
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching farm bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// 5. Create Farm Visit Booking
router.post('/bookings', async (req, res) => {
  const {
    id, farmId, farmName, vendorId, vendorName,
    userId, customerId, userName, customerName, userEmail, customerEmail, userPhone, customerPhone, phone,
    date, visitDate, guests, visitorsCount, totalPrice, totalAmount,
    includeStay, accommodationTitle, paymentMethod, status
  } = req.body;

  const targetFarmId = farmId;
  const targetUserId = customerId || userId || 'guest-user';
  const targetDate = date || visitDate;
  const targetPhone = customerPhone || userPhone || phone || '';

  if (!targetFarmId || !targetDate) {
    return res.status(400).json({ error: 'Farm ID and Visit Date are required' });
  }

  const bookingId = id || `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO farm_bookings (
        id, farm_id, farm_name, vendor_id, vendor_name,
        user_id, customer_id, user_name, customer_name, user_email, customer_email, user_phone,
        visit_date, date, guests, visitors_count, total_price, total_amount,
        include_stay, accommodation_title, payment_method, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        bookingId,
        targetFarmId,
        farmName || 'Organic Farm',
        vendorId || 'vendor-1',
        vendorName || 'Farm Host',
        targetUserId,
        targetUserId,
        userName || customerName || 'Customer',
        customerName || userName || 'Customer',
        userEmail || customerEmail || '',
        customerEmail || userEmail || '',
        targetPhone,
        targetDate,
        targetDate,
        guests || visitorsCount || 1,
        visitorsCount || guests || 1,
        totalPrice || totalAmount || 0,
        totalAmount || totalPrice || 0,
        includeStay || false,
        accommodationTitle || '',
        paymentMethod || 'Online UPI',
        status || 'confirmed'
      ]
    );

    const row = result.rows[0];

    // Create Real Notification for Customer
    try {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, read, link)
         VALUES ($1, $2, $3, $4, $5, false, $6)`,
        [
          `notif_${Date.now()}_fc`,
          targetUserId,
          '🌾 Farm Visit Booking Confirmed',
          `Your visit to "${farmName || 'Organic Farm'}" on ${targetDate} for ${visitorsCount || 1} guest(s) is confirmed.`,
          'farm',
          '/profile?tab=farms'
        ]
      );
      if (vendorId) {
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type, read, link)
           VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [
            `notif_${Date.now()}_fv`,
            vendorId,
            '🌾 New Farm Visit Booking Received',
            `${customerName || 'A guest'} booked a visit slot for "${farmName || 'Organic Farm'}" on ${targetDate}.`,
            'farm',
            '/profile?tab=farms'
          ]
        );
      }
    } catch (notifErr) {
      console.warn('Failed to insert farm booking notification:', notifErr);
    }

    res.status(201).json({
      id: row.id,
      bookingId: row.id,
      farmId: row.farm_id,
      farmName: row.farm_name,
      customerName: row.customer_name || row.user_name,
      customerEmail: row.customer_email || row.user_email,
      date: row.date || row.visit_date,
      visitorsCount: row.visitors_count || row.guests,
      totalAmount: parseFloat(row.total_amount || row.total_price || 0),
      status: row.status
    });
  } catch (err) {
    console.error('Error creating farm booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// 6. Delete Farm Booking
router.delete('/bookings/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  try {
    await query('DELETE FROM farm_bookings WHERE id = $1', [bookingId]);
    res.json({ success: true, bookingId });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// 7. Get Farm Reviews
router.get('/:farmId/reviews', async (req, res) => {
  const { farmId } = req.params;
  try {
    const result = await query('SELECT * FROM farm_reviews WHERE farm_id = $1 ORDER BY created_at DESC', [farmId]);
    const reviews = result.rows.map(row => ({
      id: row.id,
      farmId: row.farm_id,
      userId: row.user_id,
      userName: row.user_name,
      rating: parseFloat(row.rating),
      comment: row.comment,
      createdAt: row.created_at
    }));
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching farm reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// 8. Add Farm Review
router.post('/:farmId/reviews', async (req, res) => {
  const { farmId } = req.params;
  const { userId, userName, rating, comment } = req.body;
  if (!userId || rating === undefined) {
    return res.status(400).json({ error: 'User ID and rating are required' });
  }

  const reviewId = `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO farm_reviews (id, farm_id, user_id, user_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [reviewId, farmId, userId, userName || 'Guest User', rating || 5.0, comment || '']
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      farmId: row.farm_id,
      userName: row.user_name,
      rating: parseFloat(row.rating),
      comment: row.comment
    });
  } catch (err) {
    console.error('Error adding farm review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// 9. Delete Farm
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM farms WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting farm:', err);
    res.status(500).json({ error: 'Failed to delete farm' });
  }
});

// 10. Delete Farm Review
router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  try {
    await query('DELETE FROM farm_reviews WHERE id = $1', [reviewId]);
    res.json({ success: true, reviewId });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;

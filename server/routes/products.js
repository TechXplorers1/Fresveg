import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// 1. Get All Products
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      mrp: row.mrp ? parseFloat(row.mrp) : parseFloat((parseFloat(row.price) * 1.25).toFixed(2)),
      unit: row.unit,
      category: row.category,
      subCategory: row.sub_category,
      image: row.image,
      vendor: row.vendor,
      vendorId: row.vendor_id,
      vendorPhone: row.vendor_phone,
      shopLocation: row.shop_location,
      rating: parseFloat(row.rating || 5.0),
      isDeliverable: row.is_deliverable,
      fulfillmentType: row.fulfillment_type,
      createdAt: row.created_at
    }));
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. Add New Product
router.post('/', async (req, res) => {
  const { name, price, mrp, unit, category, subCategory, image, vendor, vendorId, vendorPhone, shopLocation, rating, isDeliverable, fulfillmentType } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const id = `prod_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  try {
    const result = await query(
      `INSERT INTO products (id, name, price, mrp, unit, category, sub_category, image, vendor, vendor_id, vendor_phone, shop_location, rating, is_deliverable, fulfillment_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        id,
        name,
        price,
        mrp || parseFloat((price * 1.25).toFixed(2)),
        unit || 'kg',
        category || 'General',
        subCategory || '',
        image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
        vendor || 'Local Vendor',
        vendorId || null,
        vendorPhone || null,
        shopLocation || '',
        rating || 5.0,
        isDeliverable !== false,
        fulfillmentType || 'deliverable'
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      mrp: parseFloat(row.mrp),
      unit: row.unit,
      category: row.category,
      subCategory: row.sub_category,
      image: row.image,
      vendor: row.vendor,
      vendorId: row.vendor_id,
      vendorPhone: row.vendor_phone,
      shopLocation: row.shop_location,
      rating: parseFloat(row.rating),
      isDeliverable: row.is_deliverable,
      fulfillmentType: row.fulfillment_type
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// 3. Update Product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const current = existing.rows[0];

    const updated = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           mrp = COALESCE($3, mrp),
           unit = COALESCE($4, unit),
           category = COALESCE($5, category),
           sub_category = COALESCE($6, sub_category),
           image = COALESCE($7, image),
           vendor = COALESCE($8, vendor),
           shop_location = COALESCE($9, shop_location),
           rating = COALESCE($10, rating),
           is_deliverable = COALESCE($11, is_deliverable),
           fulfillment_type = COALESCE($12, fulfillment_type)
       WHERE id = $13
       RETURNING *`,
      [
        fields.name !== undefined ? fields.name : current.name,
        fields.price !== undefined ? fields.price : current.price,
        fields.mrp !== undefined ? fields.mrp : current.mrp,
        fields.unit !== undefined ? fields.unit : current.unit,
        fields.category !== undefined ? fields.category : current.category,
        fields.subCategory !== undefined ? fields.subCategory : current.sub_category,
        fields.image !== undefined ? fields.image : current.image,
        fields.vendor !== undefined ? fields.vendor : current.vendor,
        fields.shopLocation !== undefined ? fields.shopLocation : current.shop_location,
        fields.rating !== undefined ? fields.rating : current.rating,
        fields.isDeliverable !== undefined ? fields.isDeliverable : current.is_deliverable,
        fields.fulfillmentType !== undefined ? fields.fulfillmentType : current.fulfillment_type,
        id
      ]
    );

    const row = updated.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      mrp: parseFloat(row.mrp),
      unit: row.unit,
      category: row.category,
      subCategory: row.sub_category,
      image: row.image,
      vendor: row.vendor,
      rating: parseFloat(row.rating)
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 4. Delete Product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 5. Get Categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 6. Add Category
router.post('/categories', async (req, res) => {
  const { name, image } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const result = await query(
      `INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *`,
      [name, image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// 7. Update Category
router.put('/categories/:oldName', async (req, res) => {
  const { oldName } = req.params;
  const { name, image } = req.body;

  try {
    await query(
      `UPDATE categories SET name = COALESCE($1, name), image = COALESCE($2, image) WHERE LOWER(name) = LOWER($3)`,
      [name, image, oldName]
    );

    if (name && name !== oldName) {
      await query(
        `UPDATE products SET category = $1 WHERE LOWER(category) = LOWER($2)`,
        [name, oldName]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// 8. Delete Category
router.delete('/categories/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await query('DELETE FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;

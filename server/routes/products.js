import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    const { search, category, status } = req.query;
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }
    if (category && category !== 'all' && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (status && status !== 'all') {
      const isActive = status === 'Active';
      params.push(isActive);
      sql += ` AND is_active = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);

    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      price: Number(r.price),
      salesPrice: Number(r.price),
      costPrice: Number(r.cost_price || 0),
      gst_rate: Number(r.gst_rate || 18),
      billingInterval: r.billing_interval,
      features: r.features || [],
      status: r.is_active ? 'Active' : 'Inactive',
      is_active: r.is_active
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const r = rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        price: Number(r.price),
        salesPrice: Number(r.price),
        costPrice: Number(r.cost_price || 0),
        status: r.is_active ? 'Active' : 'Inactive',
        features: r.features || []
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { name, category, price, salesPrice, costPrice, billingInterval, description, status, features } = req.body;
    const resolvedPrice = Number(price !== undefined ? price : salesPrice);

    if (!name || isNaN(resolvedPrice) || resolvedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid product name and non-negative price are required.' });
    }

    const pool = getPool();
    const id = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isActive = status !== 'Inactive';

    const { rows } = await pool.query(`
      INSERT INTO products (id, name, description, category, price, cost_price, gst_rate, billing_interval, features, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 18.00, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `, [
      id,
      name.trim(),
      description || '',
      category || 'Enterprise SaaS',
      resolvedPrice,
      Number(costPrice) || 0,
      billingInterval || 'Monthly',
      JSON.stringify(features || []),
      isActive
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: r.id,
      details: { name: r.name, price: r.price }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully in PostgreSQL.',
      data: {
        id: r.id,
        name: r.name,
        category: r.category,
        price: Number(r.price),
        salesPrice: Number(r.price),
        costPrice: Number(r.cost_price),
        status: r.is_active ? 'Active' : 'Inactive'
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { name, category, price, salesPrice, costPrice, billingInterval, description, status, features } = req.body;
    const pool = getPool();

    const { rows: existing } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const cur = existing[0];
    const resolvedPrice = (price !== undefined || salesPrice !== undefined) ? Number(price !== undefined ? price : salesPrice) : Number(cur.price);
    const isActive = status !== undefined ? status === 'Active' : cur.is_active;

    const { rows: updated } = await pool.query(`
      UPDATE products
      SET name = $1, category = $2, price = $3, cost_price = $4, billing_interval = $5, description = $6, is_active = $7, features = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *;
    `, [
      name ? name.trim() : cur.name,
      category ? category.trim() : cur.category,
      resolvedPrice,
      costPrice !== undefined ? Number(costPrice) : cur.cost_price,
      billingInterval || cur.billing_interval,
      description !== undefined ? description : cur.description,
      isActive,
      features ? JSON.stringify(features) : cur.features,
      cur.id
    ]);

    const r = updated[0];
    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: {
        id: r.id,
        name: r.name,
        price: Number(r.price),
        salesPrice: Number(r.price),
        category: r.category,
        status: r.is_active ? 'Active' : 'Inactive'
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted from PostgreSQL.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;

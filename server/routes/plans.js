import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/plans
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM plans ORDER BY price ASC');

    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      billingInterval: r.billing_interval,
      price: Number(r.price),
      minQuantity: r.min_quantity,
      popular: r.popular,
      features: r.features || [],
      status: r.is_active ? 'Active' : 'Inactive',
      is_active: r.is_active
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    const r = rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        name: r.name,
        code: r.code,
        price: Number(r.price),
        billingInterval: r.billing_interval,
        popular: r.popular,
        features: r.features || []
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { name, code, price, billingInterval, description, features, popular, minQuantity, status } = req.body;
    const numPrice = Number(price);

    if (!name || isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Plan name and valid non-negative price are required.' });
    }

    const pool = getPool();
    const id = `PLAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const planCode = code ? code.trim().toUpperCase() : `PLAN_${Date.now()}`;

    const { rows } = await pool.query(`
      INSERT INTO plans (id, name, code, description, billing_interval, price, min_quantity, popular, features, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `, [
      id,
      name.trim(),
      planCode,
      description || '',
      billingInterval || 'Monthly',
      numPrice,
      Number(minQuantity) || 1,
      Boolean(popular),
      JSON.stringify(features || []),
      status !== 'Inactive'
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PLAN_CREATED',
      entityType: 'PLAN',
      entityId: r.id
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: {
        id: r.id,
        name: r.name,
        code: r.code,
        price: Number(r.price),
        billingInterval: r.billing_interval,
        popular: r.popular,
        status: r.is_active ? 'Active' : 'Inactive'
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/plans/:id
router.put('/:id', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { name, price, billingInterval, description, features, popular, status } = req.body;
    const pool = getPool();

    const { rows: existing } = await pool.query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const cur = existing[0];
    const { rows: updated } = await pool.query(`
      UPDATE plans
      SET name = $1, price = $2, billing_interval = $3, description = $4, features = $5, popular = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `, [
      name ? name.trim() : cur.name,
      price !== undefined ? Number(price) : cur.price,
      billingInterval || cur.billing_interval,
      description !== undefined ? description : cur.description,
      features ? JSON.stringify(features) : cur.features,
      popular !== undefined ? Boolean(popular) : cur.popular,
      status !== undefined ? status === 'Active' : cur.is_active,
      cur.id
    ]);

    const r = updated[0];
    res.json({
      success: true,
      message: 'Plan updated successfully in PostgreSQL.',
      data: {
        id: r.id,
        name: r.name,
        price: Number(r.price),
        billingInterval: r.billing_interval
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id
router.delete('/:id', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    res.json({ success: true, message: 'Plan deleted.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;

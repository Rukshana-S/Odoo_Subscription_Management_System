import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/discounts
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM discounts ORDER BY created_at DESC');

    const formatted = rows.map(r => ({
      id: r.id,
      code: r.code,
      description: r.description,
      type: r.discount_type,
      discountType: r.discount_type,
      value: Number(r.discount_value),
      discountValue: Number(r.discount_value),
      maxUses: r.max_uses,
      usedCount: r.used_count,
      validUntil: r.valid_until ? new Date(r.valid_until).toISOString().split('T')[0] : '2026-12-31',
      status: r.is_active ? 'Active' : 'Inactive',
      is_active: r.is_active
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/discounts
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { code, type, discountType, value, discountValue, description, validUntil, maxUses } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();
    const val = Number(value !== undefined ? value : discountValue);

    if (!cleanCode || isNaN(val)) {
      return res.status(400).json({ success: false, message: 'Discount code and valid numeric value are required.' });
    }

    const pool = getPool();
    const { rows: dup } = await pool.query('SELECT id FROM discounts WHERE code = $1', [cleanCode]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: 'A discount with this coupon code already exists.' });
    }

    const discId = `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const resolvedType = (type === 'Fixed' || discountType === 'Fixed') ? 'Fixed' : 'Percentage';

    const { rows } = await pool.query(`
      INSERT INTO discounts (id, code, description, discount_type, discount_value, max_uses, used_count, valid_until, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, true, NOW(), NOW())
      RETURNING *;
    `, [
      discId,
      cleanCode,
      description || '',
      resolvedType,
      val,
      Number(maxUses) || 100,
      validUntil || '2026-12-31'
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'DISCOUNT_CREATED',
      entityType: 'DISCOUNT',
      entityId: r.id,
      details: { code: r.code, value: r.discount_value }
    });

    res.status(201).json({
      success: true,
      message: 'Discount code created successfully in PostgreSQL.',
      data: {
        id: r.id,
        code: r.code,
        type: r.discount_type,
        value: Number(r.discount_value),
        status: 'Active'
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/discounts/validate
router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required.' });
    }

    const pool = getPool();
    const cleanCode = code.trim().toUpperCase();
    const { rows } = await pool.query('SELECT * FROM discounts WHERE code = $1', [cleanCode]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    const discount = rows[0];
    if (!discount.is_active) {
      return res.status(400).json({ success: false, message: 'This discount code is currently inactive.' });
    }

    if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
      return res.status(400).json({ success: false, message: 'This discount code has expired.' });
    }

    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ success: false, message: 'This discount code has reached its maximum allowed redemptions.' });
    }

    const baseSubtotal = Number(subtotal) || 0;
    let deduction = 0;
    if (discount.discount_type === 'Percentage') {
      deduction = (baseSubtotal * Number(discount.discount_value)) / 100;
    } else {
      deduction = Number(discount.discount_value);
    }
    deduction = Math.min(deduction, baseSubtotal);

    res.json({
      success: true,
      message: 'Discount code is valid.',
      data: {
        code: discount.code,
        type: discount.discount_type,
        value: Number(discount.discount_value),
        deduction: Number(deduction.toFixed(2)),
        finalAmount: Number((baseSubtotal - deduction).toFixed(2))
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/discounts/:id
router.delete('/:id', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM discounts WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }
    res.json({ success: true, message: 'Discount deleted.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;

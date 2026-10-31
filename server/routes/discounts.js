import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/discounts - List all discount rules
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const discounts = db.discounts || [];
    res.json({ success: true, count: discounts.length, data: discounts });
  } catch (err) {
    next(err);
  }
});

// POST /api/discounts - Create new discount (Admin, Staff)
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const { code, type, value, description, validUntil, maxUses } = req.body;

    if (!code || value === undefined) {
      return res.status(400).json({ success: false, message: 'Discount code and value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const db = getDb();
    db.discounts = db.discounts || [];

    const existing = db.discounts.find(d => d.code === cleanCode);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A discount with this coupon code already exists.' });
    }

    const newDiscount = {
      id: `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: cleanCode,
      type: type === 'Fixed' ? 'Fixed' : 'Percentage',
      value: Number(value),
      description: description || '',
      validUntil: validUntil || '2026-12-31',
      maxUses: Number(maxUses) || 100,
      usedCount: 0,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    db.discounts.push(newDiscount);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'DISCOUNT_CREATED',
      details: { code: newDiscount.code, value: newDiscount.value },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Discount code created successfully.', data: newDiscount });
  } catch (err) {
    next(err);
  }
});

// POST /api/discounts/validate - Validate a discount code for customer usage
router.post('/validate', requireAuth, (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required for validation.' });
    }

    const db = getDb();
    const discount = (db.discounts || []).find(d => d.code === code.trim().toUpperCase());

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    if (discount.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This discount code is currently inactive.' });
    }

    if (discount.validUntil && new Date(discount.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: 'This discount code has expired.' });
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ success: false, message: 'This discount code has reached its maximum allowed redemptions.' });
    }

    // Calculate deduction
    const baseSubtotal = Number(subtotal) || 0;
    let deduction = 0;
    if (discount.type === 'Percentage') {
      deduction = (baseSubtotal * discount.value) / 100;
    } else {
      deduction = discount.value;
    }
    deduction = Math.min(deduction, baseSubtotal);

    res.json({
      success: true,
      message: 'Discount code is valid.',
      data: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        deduction: Number(deduction.toFixed(2)),
        finalAmount: Number((baseSubtotal - deduction).toFixed(2))
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/discounts/:id - Admin only
router.delete('/:id', requireAuth, requireRoles(['Admin']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.discounts || []).findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }

    const removed = db.discounts.splice(index, 1)[0];
    saveDb(db);

    res.json({ success: true, message: 'Discount removed.', data: removed });
  } catch (err) {
    next(err);
  }
});

export default router;

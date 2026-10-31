import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/plans - List all subscription plans
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const plans = db.plans || [];
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/:id - Single plan
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const plan = (db.plans || []).find(p => p.id === req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans - Create plan (Admin, Staff)
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const { name, code, price, billingInterval, description, features, popular, status } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Plan name and price are required.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    const validIntervals = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
    const interval = billingInterval && validIntervals.includes(billingInterval) ? billingInterval : 'Monthly';

    const db = getDb();
    db.plans = db.plans || [];

    const newPlan = {
      id: `PLAN-${String(db.plans.length + 1).padStart(3, '0')}`,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : name.trim().toUpperCase().replace(/\s+/g, '_'),
      price: numPrice,
      billingInterval: interval,
      description: description || '',
      features: features || [],
      popular: Boolean(popular),
      status: status || 'Active',
      createdAt: new Date().toISOString()
    };

    db.plans.push(newPlan);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PLAN_CREATED',
      details: { planId: newPlan.id, name: newPlan.name },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Subscription plan created successfully.', data: newPlan });
  } catch (err) {
    next(err);
  }
});

// PUT /api/plans/:id - Update plan
router.put('/:id', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.plans || []).findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    const { name, code, price, billingInterval, description, features, popular, status } = req.body;
    const plan = db.plans[index];

    if (name) plan.name = name.trim();
    if (code) plan.code = code.trim().toUpperCase();
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid number.' });
      }
      plan.price = numPrice;
    }
    if (billingInterval) plan.billingInterval = billingInterval;
    if (description !== undefined) plan.description = description;
    if (features) plan.features = features;
    if (popular !== undefined) plan.popular = Boolean(popular);
    if (status) plan.status = status;

    plan.updatedAt = new Date().toISOString();
    db.plans[index] = plan;
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PLAN_UPDATED',
      details: { planId: plan.id },
      ip: req.ip
    });

    res.json({ success: true, message: 'Subscription plan updated successfully.', data: plan });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id - Deactivate or Delete (Admin)
router.delete('/:id', requireAuth, requireRoles(['Admin']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.plans || []).findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const removed = db.plans.splice(index, 1)[0];
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PLAN_DELETED',
      details: { planId: removed.id, name: removed.name },
      ip: req.ip
    });

    res.json({ success: true, message: 'Subscription plan deleted.', data: removed });
  } catch (err) {
    next(err);
  }
});

export default router;

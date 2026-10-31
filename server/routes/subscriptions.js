import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Helper: calculate next billing date based on interval
const calculateNextBillingDate = (startDateStr, interval) => {
  const d = new Date(startDateStr || Date.now());
  if (isNaN(d.getTime())) return new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
  
  switch ((interval || '').toLowerCase()) {
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'half-yearly':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'yearly':
    case 'annual':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
};

// GET /api/subscriptions - List subscriptions
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let subscriptions = db.subscriptions || [];

    // Role check: customer views only their own
    if (req.user.role === 'Customer' && req.user.customerId) {
      subscriptions = subscriptions.filter(s => s.customerId === req.user.customerId);
    }

    const { status, customerId } = req.query;
    if (status && status !== 'all') {
      subscriptions = subscriptions.filter(s => s.status && s.status.toLowerCase() === status.toLowerCase());
    }
    if (customerId && req.user.role !== 'Customer') {
      subscriptions = subscriptions.filter(s => s.customerId === customerId);
    }

    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id - Single subscription
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const sub = (db.subscriptions || []).find(s => s.id === req.params.id);

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription record not found.' });
    }

    if (req.user.role === 'Customer' && sub.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot view this subscription.' });
    }

    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions - Create subscription
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { customerId, customerName, planId, planName, amount, billingInterval, startDate } = req.body;

    // Customer can only create for themselves
    const effectiveCustomerId = req.user.role === 'Customer' ? req.user.customerId : customerId;
    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, message: 'Valid subscription amount is required.' });
    }

    const start = startDate || new Date().toISOString().split('T')[0];
    const nextBilling = calculateNextBillingDate(start, billingInterval);

    const db = getDb();
    db.subscriptions = db.subscriptions || [];

    const newSub = {
      id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: effectiveCustomerId,
      customerName: customerName || req.user.name || 'Customer',
      planId: planId || 'PLAN-001',
      planName: planName || 'Standard Plan',
      amount: numAmount,
      billingInterval: billingInterval || 'Monthly',
      startDate: start,
      nextBillingDate: nextBilling,
      status: 'Active',
      history: [
        { action: 'CREATED', timestamp: new Date().toISOString(), user: req.user.email }
      ],
      createdAt: new Date().toISOString()
    };

    db.subscriptions.push(newSub);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'SUBSCRIPTION_CREATED',
      details: { subscriptionId: newSub.id, customerId: effectiveCustomerId },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Subscription created successfully.', data: newSub });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id/status - Lifecycle transitions (Activate, Pause, Resume, Cancel)
router.patch('/:id/status', requireAuth, (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Paused', 'Cancelled', 'Expired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed transitions: ${validStatuses.join(', ')}`
      });
    }

    const db = getDb();
    const index = (db.subscriptions || []).findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const sub = db.subscriptions[index];

    // Customer can only cancel or pause their own subscription
    if (req.user.role === 'Customer') {
      if (sub.customerId !== req.user.customerId) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
      if (status === 'Active' && sub.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Cancelled subscriptions cannot be directly reactivated.' });
      }
    }

    // Lifecycle transition rules
    if (sub.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'A cancelled subscription cannot transition to any other status.' });
    }

    const previousStatus = sub.status;
    sub.status = status;
    sub.history = sub.history || [];
    sub.history.push({
      action: `STATUS_CHANGE_${status.toUpperCase()}`,
      from: previousStatus,
      to: status,
      timestamp: new Date().toISOString(),
      user: req.user.email
    });

    db.subscriptions[index] = sub;
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'SUBSCRIPTION_STATUS_UPDATED',
      details: { subscriptionId: sub.id, previousStatus, newStatus: status },
      ip: req.ip
    });

    res.json({ success: true, message: `Subscription status updated to ${status}.`, data: sub });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/renew - Renew subscription & extend next billing date
router.post('/:id/renew', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.subscriptions || []).findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const sub = db.subscriptions[index];
    if (sub.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot renew a cancelled subscription.' });
    }

    sub.nextBillingDate = calculateNextBillingDate(sub.nextBillingDate || sub.startDate, sub.billingInterval);
    sub.status = 'Active';
    sub.history = sub.history || [];
    sub.history.push({
      action: 'RENEWED',
      nextBillingDate: sub.nextBillingDate,
      timestamp: new Date().toISOString(),
      user: req.user.email
    });

    db.subscriptions[index] = sub;
    saveDb(db);

    res.json({ success: true, message: 'Subscription renewed successfully.', data: sub });
  } catch (err) {
    next(err);
  }
});

export default router;

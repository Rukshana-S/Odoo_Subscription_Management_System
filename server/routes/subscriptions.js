import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

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

// GET /api/subscriptions
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM subscriptions WHERE 1=1';
    const params = [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      params.push(req.user.customerId);
      sql += ` AND customer_id = $${params.length}`;
    }

    const { status, customerId } = req.query;
    if (status && status !== 'all' && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (customerId && req.user.role !== 'Customer') {
      params.push(customerId);
      sql += ` AND customer_id = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);

    const formatted = rows.map(r => ({
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      planId: r.plan_id,
      planName: r.plan_name,
      amount: Number(r.amount),
      billingInterval: r.billing_interval,
      startDate: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : '2026-01-01',
      nextBillingDate: r.next_billing_date ? new Date(r.next_billing_date).toISOString().split('T')[0] : '2026-02-01',
      status: r.status,
      history: r.history || []
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription record not found.' });
    }
    const r = rows[0];
    if (req.user.role === 'Customer' && r.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot view this subscription.' });
    }

    res.json({
      success: true,
      data: {
        id: r.id,
        customerId: r.customer_id,
        customerName: r.customer_name,
        planId: r.plan_id,
        planName: r.plan_name,
        amount: Number(r.amount),
        billingInterval: r.billing_interval,
        startDate: r.start_date,
        nextBillingDate: r.next_billing_date,
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { customerId, customerName, planId, planName, amount, billingInterval, startDate } = req.body;
    const effectiveCustomerId = req.user.role === 'Customer' ? req.user.customerId : customerId;

    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, message: 'Valid subscription amount is required.' });
    }

    const pool = getPool();
    const subId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const start = startDate || new Date().toISOString().split('T')[0];
    const nextBilling = calculateNextBillingDate(start, billingInterval);

    const history = JSON.stringify([{ action: 'CREATED', timestamp: new Date().toISOString(), user: req.user.email }]);

    const { rows } = await pool.query(`
      INSERT INTO subscriptions (id, customer_id, plan_id, plan_name, customer_name, status, start_date, next_billing_date, billing_interval, quantity, amount, history, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'Active', $6, $7, $8, 1, $9, $10, NOW(), NOW())
      RETURNING *;
    `, [
      subId,
      effectiveCustomerId,
      planId || 'PLAN-001',
      planName || 'Standard Plan',
      customerName || req.user.name || 'Customer',
      start,
      nextBilling,
      billingInterval || 'Monthly',
      numAmount,
      history
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'SUBSCRIPTION',
      entityId: r.id,
      details: { amount: r.amount, customerId: r.customer_id }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully in PostgreSQL.',
      data: {
        id: r.id,
        customerId: r.customer_id,
        customerName: r.customer_name,
        planName: r.plan_name,
        amount: Number(r.amount),
        billingInterval: r.billing_interval,
        startDate: r.start_date,
        nextBillingDate: r.next_billing_date,
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id/status
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Paused', 'Cancelled', 'Expired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed transitions: ${validStatuses.join(', ')}` });
    }

    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const sub = rows[0];
    if (req.user.role === 'Customer') {
      if (sub.customer_id !== req.user.customerId) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
    }

    // Terminal state verification
    if (sub.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled subscriptions cannot transition to any other status.' });
    }

    const currentHistory = sub.history || [];
    currentHistory.push({
      action: `STATUS_CHANGE_${status.toUpperCase()}`,
      from: sub.status,
      to: status,
      timestamp: new Date().toISOString(),
      user: req.user.email
    });

    const { rows: updated } = await pool.query(`
      UPDATE subscriptions 
      SET status = $1, history = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [status, JSON.stringify(currentHistory), sub.id]);

    const r = updated[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'SUBSCRIPTION_STATUS_UPDATED',
      entityType: 'SUBSCRIPTION',
      entityId: r.id,
      details: { previousStatus: sub.status, newStatus: status }
    });

    res.json({
      success: true,
      message: `Subscription status updated to ${status}.`,
      data: {
        id: r.id,
        status: r.status,
        customerName: r.customer_name
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/:id/renew
router.post('/:id/renew', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const sub = rows[0];
    if (sub.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot renew a cancelled subscription.' });
    }

    const nextBilling = calculateNextBillingDate(sub.next_billing_date || sub.start_date, sub.billing_interval);

    const { rows: updated } = await pool.query(`
      UPDATE subscriptions
      SET status = 'Active', next_billing_date = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [nextBilling, sub.id]);

    const r = updated[0];
    res.json({
      success: true,
      message: 'Subscription renewed successfully in PostgreSQL.',
      data: {
        id: r.id,
        status: r.status,
        nextBillingDate: r.next_billing_date
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

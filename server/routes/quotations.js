import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quotations
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM quotations WHERE 1=1';
    const params = [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      params.push(req.user.customerId);
      sql += ` AND customer_id = $${params.length}`;
    }

    const { status } = req.query;
    if (status && status !== 'all' && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);

    const formatted = rows.map(r => ({
      id: r.id,
      quotationNumber: r.quotation_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      items: r.items || [],
      subtotal: Number(r.subtotal),
      discountCode: r.discount_code,
      discountAmount: Number(r.discount_amount),
      taxable: Number(r.taxable),
      gst: Number(r.gst_amount),
      gstRate: Number(r.gst_rate),
      total: Number(r.total),
      status: r.status,
      validUntil: r.valid_until ? new Date(r.valid_until).toISOString().split('T')[0] : '2026-12-31',
      notes: r.notes
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotations/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM quotations WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }
    const r = rows[0];
    if (req.user.role === 'Customer' && r.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    res.json({
      success: true,
      data: {
        id: r.id,
        quotationNumber: r.quotation_number,
        customerId: r.customer_id,
        customerName: r.customer_name,
        total: Number(r.total),
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { customerId, customerName, items, notes, discountCode, discountAmount, validUntil } = req.body;
    const effectiveCustomerId = req.user.role === 'Customer' ? req.user.customerId : customerId;

    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the quotation.' });
    }

    const subtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
    const disc = Number(discountAmount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const gst = Number((taxable * 0.18).toFixed(2));
    const total = Number((taxable + gst).toFixed(2));

    const pool = getPool();
    const quotId = `QUOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const quotNum = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const validity = validUntil || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const { rows } = await pool.query(`
      INSERT INTO quotations (id, quotation_number, customer_id, customer_name, items, subtotal, discount_code, discount_amount, taxable, gst_rate, gst_amount, total, status, valid_until, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 18.00, $10, $11, 'Sent', $12, $13, NOW(), NOW())
      RETURNING *;
    `, [
      quotId,
      quotNum,
      effectiveCustomerId,
      customerName || req.user.name,
      JSON.stringify(items),
      subtotal,
      discountCode || null,
      disc,
      taxable,
      gst,
      total,
      validity,
      notes || ''
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'QUOTATION_CREATED',
      entityType: 'QUOTATION',
      entityId: r.id,
      details: { quotationNumber: r.quotation_number, total: r.total }
    });

    res.status(201).json({
      success: true,
      message: 'Quotation generated successfully.',
      data: {
        id: r.id,
        quotationNumber: r.quotation_number,
        subtotal: Number(r.subtotal),
        discountAmount: Number(r.discount_amount),
        taxable: Number(r.taxable),
        gst: Number(r.gst_amount),
        total: Number(r.total),
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/quotations/:id/status
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Sent', 'Approved', 'Rejected'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM quotations WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quot = rows[0];
    if (req.user.role === 'Customer' && quot.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const { rows: updated } = await pool.query(`
      UPDATE quotations 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *;
    `, [status, quot.id]);

    const r = updated[0];
    res.json({
      success: true,
      message: `Quotation updated to ${status}.`,
      data: {
        id: r.id,
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations/:id/convert
router.post('/:id/convert', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM quotations WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quot = rows[0];
    if (quot.status === 'Converted') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Quotation is already converted.' });
    }

    const subId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const start = new Date().toISOString().split('T')[0];
    const nextBilling = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const history = JSON.stringify([{ action: 'CONVERTED_FROM_QUOTATION', quotationId: quot.id, timestamp: new Date().toISOString(), user: req.user.email }]);

    const { rows: subRows } = await client.query(`
      INSERT INTO subscriptions (id, customer_id, plan_id, plan_name, customer_name, status, start_date, next_billing_date, billing_interval, quantity, amount, history, converted_from_quotation_id, created_at, updated_at)
      VALUES ($1, $2, 'PLAN-001', 'Converted Plan', $3, 'Active', $4, $5, 'Monthly', 1, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `, [subId, quot.customer_id, quot.customer_name, start, nextBilling, quot.total, history, quot.id]);

    await client.query(`
      UPDATE quotations 
      SET status = 'Converted', converted_subscription_id = $1, updated_at = NOW() 
      WHERE id = $2;
    `, [subId, quot.id]);

    await client.query('COMMIT');

    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'QUOTATION_CONVERTED',
      entityType: 'QUOTATION',
      entityId: quot.id,
      details: { subscriptionId: subId }
    });

    res.json({
      success: true,
      message: 'Quotation successfully converted to active subscription in PostgreSQL.',
      data: {
        quotation: { id: quot.id, status: 'Converted' },
        subscription: { id: subRows[0].id, amount: Number(subRows[0].amount), status: 'Active' }
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;

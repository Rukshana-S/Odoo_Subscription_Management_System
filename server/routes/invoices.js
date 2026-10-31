import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/invoices
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM invoices WHERE 1=1';
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
      invoiceNumber: r.invoice_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      subscriptionId: r.subscription_id,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      taxable: Number(r.taxable),
      gst: Number(r.gst_amount),
      gstRate: Number(r.gst_rate),
      total: Number(r.total),
      paidAmount: Number(r.paid_amount),
      balance: Number(r.balance),
      balanceDue: Number(r.balance),
      issueDate: r.issue_date ? new Date(r.issue_date).toISOString().split('T')[0] : '2026-01-01',
      dueDate: r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : '2026-01-15',
      status: r.status
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const r = rows[0];
    if (req.user.role === 'Customer' && r.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    res.json({
      success: true,
      data: {
        id: r.id,
        invoiceNumber: r.invoice_number,
        total: Number(r.total),
        balance: Number(r.balance),
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { customerId, customerName, subscriptionId, subtotal, discount, dueDate, invoiceNumber } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    const numSubtotal = Number(subtotal);
    if (isNaN(numSubtotal) || numSubtotal <= 0) {
      return res.status(400).json({ success: false, message: 'Valid subtotal amount is required.' });
    }

    const numDiscount = Number(discount) || 0;
    const taxable = Math.max(0, numSubtotal - numDiscount);
    const gstAmount = Number((taxable * 0.18).toFixed(2));
    const total = Number((taxable + gstAmount).toFixed(2));

    const pool = getPool();
    const invId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const invNum = invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const due = dueDate || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Check duplicate
    const { rows: dup } = await pool.query('SELECT id FROM invoices WHERE invoice_number = $1', [invNum]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: 'An invoice with this invoice number already exists.' });
    }

    const { rows } = await pool.query(`
      INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, customer_name, subtotal, discount, taxable, gst_rate, gst_amount, total, paid_amount, balance, issue_date, due_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 18.00, $9, $10, 0.00, $10, CURRENT_DATE, $11, 'Unpaid', NOW(), NOW())
      RETURNING *;
    `, [
      invId,
      invNum,
      customerId,
      subscriptionId || null,
      customerName || 'Valued Customer',
      numSubtotal,
      numDiscount,
      taxable,
      gstAmount,
      total,
      due
    ]);

    const r = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'INVOICE_GENERATED',
      entityType: 'INVOICE',
      entityId: r.id,
      details: { invoiceNumber: r.invoice_number, total: r.total }
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully in PostgreSQL.',
      data: {
        id: r.id,
        invoiceNumber: r.invoice_number,
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        taxable: Number(r.taxable),
        gst: Number(r.gst_amount),
        total: Number(r.total),
        balance: Number(r.balance),
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Unpaid', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const inv = rows[0];
    let newPaid = inv.paid_amount;
    let newBalance = inv.balance;
    if (status === 'Paid') {
      newPaid = inv.total;
      newBalance = 0.00;
    }

    const { rows: updated } = await pool.query(`
      UPDATE invoices
      SET status = $1, paid_amount = $2, balance = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [status, newPaid, newBalance, inv.id]);

    const r = updated[0];
    res.json({
      success: true,
      message: `Invoice status updated to ${status}.`,
      data: {
        id: r.id,
        status: r.status,
        balance: Number(r.balance)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

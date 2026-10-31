import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/payments
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      params.push(req.user.customerId);
      sql += ` AND customer_id = $${params.length}`;
    }

    const { status, method } = req.query;
    if (status && status !== 'all' && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (method && method !== 'all' && method !== 'All') {
      params.push(method);
      sql += ` AND payment_method = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);

    const formatted = rows.map(r => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      invoiceId: r.invoice_id,
      invoiceNumber: r.invoice_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      amount: Number(r.amount),
      method: r.payment_method,
      paymentMethod: r.payment_method,
      transactionId: r.transaction_reference,
      transactionReference: r.transaction_reference,
      status: r.status,
      notes: r.notes,
      paymentDate: r.payment_date ? new Date(r.payment_date).toISOString().split('T')[0] : '2026-01-01'
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments - ACID Transactional payment settlement in PostgreSQL
router.post('/', requireAuth, async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const { invoiceId, amount, method, transactionId, reference, notes } = req.body;

    if (!invoiceId || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Invoice ID and payment amount are required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    await client.query('BEGIN');

    // Lock and query invoice for update
    const { rows: invRows } = await client.query(`
      SELECT * FROM invoices 
      WHERE id = $1 OR invoice_number = $1 
      FOR UPDATE;
    `, [invoiceId]);

    if (invRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const invoice = invRows[0];

    // Customer ownership verification
    if (req.user.role === 'Customer' && invoice.customer_id !== req.user.customerId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Access denied: You can only settle your own invoices.' });
    }

    const currentBalance = Number(invoice.balance);
    if (currentBalance <= 0 || invoice.status === 'Paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This invoice is already fully paid and settled.' });
    }

    if (numAmount > currentBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${numAmount.toFixed(2)}) exceeds remaining invoice balance (₹${currentBalance.toFixed(2)}). Overpayments not accepted.`
      });
    }

    const txnRef = transactionId || reference || `TXN-IN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { rows: dupTxn } = await client.query('SELECT id FROM payments WHERE transaction_reference = $1', [txnRef]);
    if (dupTxn.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'A payment with this transaction ID has already been recorded.' });
    }

    // Update Invoice balance and status
    const newPaidAmount = Number((Number(invoice.paid_amount) + numAmount).toFixed(2));
    const newBalance = Number((Number(invoice.total) - newPaidAmount).toFixed(2));
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';

    await client.query(`
      UPDATE invoices
      SET paid_amount = $1, balance = $2, status = $3, updated_at = NOW()
      WHERE id = $4;
    `, [newPaidAmount, Math.max(0, newBalance), newStatus, invoice.id]);

    // Create Payment Record
    const payId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const validMethods = ['UPI', 'Bank Transfer', 'Credit Card', 'Net Banking', 'Cash', 'Card'];
    const resolvedMethod = method && validMethods.includes(method) ? method : 'UPI';

    const { rows: payRows } = await client.query(`
      INSERT INTO payments (id, receipt_number, invoice_id, invoice_number, customer_id, customer_name, payment_method, amount, transaction_reference, status, notes, payment_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Success', $10, CURRENT_DATE, NOW(), NOW())
      RETURNING *;
    `, [
      payId,
      receiptNum,
      invoice.id,
      invoice.invoice_number,
      invoice.customer_id,
      invoice.customer_name,
      resolvedMethod,
      numAmount,
      txnRef,
      notes || 'Invoice settlement'
    ]);

    await client.query('COMMIT');

    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PAYMENT_RECORDED',
      entityType: 'PAYMENT',
      entityId: payId,
      details: { invoiceId: invoice.id, amount: numAmount, remainingBalance: Math.max(0, newBalance) }
    });

    res.status(201).json({
      success: true,
      message: newBalance <= 0 ? 'Invoice fully settled and marked as Paid.' : 'Partial payment recorded successfully in PostgreSQL.',
      data: {
        payment: {
          id: payRows[0].id,
          receiptNumber: payRows[0].receipt_number,
          amount: Number(payRows[0].amount),
          status: payRows[0].status
        },
        invoice: {
          id: invoice.id,
          total: Number(invoice.total),
          paidAmount: newPaidAmount,
          balance: Math.max(0, newBalance),
          status: newStatus
        }
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

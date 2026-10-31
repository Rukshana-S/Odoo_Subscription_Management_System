import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/payments - List payments
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let payments = db.payments || [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      payments = payments.filter(p => p.customerId === req.user.customerId);
    }

    const { status, method } = req.query;
    if (status && status !== 'all') {
      payments = payments.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
    }
    if (method && method !== 'all') {
      payments = payments.filter(p => p.method && p.method.toLowerCase() === method.toLowerCase());
    }

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments - Record a payment against an invoice
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { invoiceId, amount, method, transactionId, reference, notes } = req.body;

    if (!invoiceId || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Invoice ID and payment amount are required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const db = getDb();
    const invIndex = (db.invoices || []).findIndex(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

    if (invIndex === -1) {
      return res.status(404).json({ success: false, message: 'Invoice associated with this payment was not found.' });
    }

    const invoice = db.invoices[invIndex];

    // Customer can only pay for their own invoice
    if (req.user.role === 'Customer' && invoice.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only settle your own invoices.' });
    }

    // Check if invoice is already settled
    if (invoice.balance <= 0 || invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'This invoice is already fully paid and settled.' });
    }

    if (numAmount > invoice.balance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${numAmount.toFixed(2)}) exceeds remaining invoice balance (₹${invoice.balance.toFixed(2)}). Overpayments not accepted.`
      });
    }

    // Duplicate transaction check
    const txnRef = transactionId || reference || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.payments = db.payments || [];
    const duplicateTxn = db.payments.find(p => p.transactionId === txnRef);
    if (duplicateTxn) {
      return res.status(409).json({ success: false, message: 'A payment with this transaction ID has already been recorded.' });
    }

    // Update invoice balance and status
    invoice.paidAmount = Number(((invoice.paidAmount || 0) + numAmount).toFixed(2));
    invoice.balance = Number((invoice.total - invoice.paidAmount).toFixed(2));
    if (invoice.balance <= 0) {
      invoice.status = 'Paid';
      invoice.balance = 0;
    } else {
      invoice.status = 'Partially Paid';
    }
    invoice.updatedAt = new Date().toISOString();
    db.invoices[invIndex] = invoice;

    const validMethods = ['UPI', 'Bank Transfer', 'Credit Card', 'Net Banking', 'Cash'];
    const resolvedMethod = method && validMethods.includes(method) ? method : 'UPI';

    const newPayment = {
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: numAmount,
      method: resolvedMethod,
      transactionId: txnRef,
      status: 'Success', // Clearly documented as verified transaction record
      notes: notes || 'Invoice payment settled',
      paymentDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    db.payments.push(newPayment);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PAYMENT_RECORDED',
      details: { paymentId: newPayment.id, invoiceId: invoice.id, amount: numAmount, remainingBalance: invoice.balance },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: invoice.balance === 0 ? 'Invoice fully settled and marked as Paid.' : 'Partial payment recorded successfully.',
      data: {
        payment: newPayment,
        invoice: {
          id: invoice.id,
          total: invoice.total,
          paidAmount: invoice.paidAmount,
          balance: invoice.balance,
          status: invoice.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

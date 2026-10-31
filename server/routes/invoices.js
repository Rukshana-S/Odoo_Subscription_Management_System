import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/invoices - List invoices
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let invoices = db.invoices || [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      invoices = invoices.filter(inv => inv.customerId === req.user.customerId);
    }

    const { status, customerId } = req.query;
    if (status && status !== 'all') {
      invoices = invoices.filter(inv => inv.status && inv.status.toLowerCase() === status.toLowerCase());
    }
    if (customerId && req.user.role !== 'Customer') {
      invoices = invoices.filter(inv => inv.customerId === customerId);
    }

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id - Single invoice
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const invoice = (db.invoices || []).find(inv => inv.id === req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (req.user.role === 'Customer' && invoice.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices - Generate invoice (Staff or Admin)
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
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
    const gst = Number((taxable * 0.18).toFixed(2));
    const total = Number((taxable + gst).toFixed(2));

    const db = getDb();
    db.invoices = db.invoices || [];

    // Duplicate check if subscriptionId and cycle match
    const issueDate = new Date().toISOString().split('T')[0];
    const generatedInvoiceNumber = invoiceNumber || `INV-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(4, '0')}`;

    // Prevent duplicate invoice reference
    const duplicate = db.invoices.find(inv => inv.invoiceNumber === generatedInvoiceNumber);
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'An invoice with this invoice number already exists.' });
    }

    const newInvoice = {
      id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: generatedInvoiceNumber,
      customerId,
      customerName: customerName || 'Valued Customer',
      subscriptionId: subscriptionId || null,
      subtotal: numSubtotal,
      discount: numDiscount,
      taxable,
      gst,
      total,
      paidAmount: 0,
      balance: total,
      issueDate,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    };

    db.invoices.push(newInvoice);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'INVOICE_GENERATED',
      details: { invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber, total },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Invoice generated successfully.', data: newInvoice });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/invoices/:id/status - Update invoice status manually
router.patch('/:id/status', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Unpaid', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const db = getDb();
    const index = (db.invoices || []).findIndex(inv => inv.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const inv = db.invoices[index];
    inv.status = status;
    if (status === 'Paid') {
      inv.paidAmount = inv.total;
      inv.balance = 0;
    }
    inv.updatedAt = new Date().toISOString();
    db.invoices[index] = inv;
    saveDb(db);

    res.json({ success: true, message: `Invoice status updated to ${status}.`, data: inv });
  } catch (err) {
    next(err);
  }
});

export default router;

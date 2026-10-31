import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quotations - List quotations
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let quotations = db.quotations || [];

    if (req.user.role === 'Customer' && req.user.customerId) {
      quotations = quotations.filter(q => q.customerId === req.user.customerId);
    }

    const { status } = req.query;
    if (status && status !== 'all') {
      quotations = quotations.filter(q => q.status && q.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotations/:id - Single quotation
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const quotation = (db.quotations || []).find(q => q.id === req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (req.user.role === 'Customer' && quotation.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations - Create quotation (Draft / Sent)
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { customerId, customerName, items, notes, discountCode, discountAmount, validUntil } = req.body;

    const effectiveCustomerId = req.user.role === 'Customer' ? req.user.customerId : customerId;
    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the quotation.' });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
    const disc = Number(discountAmount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const gst = Number((taxable * 0.18).toFixed(2));
    const total = Number((taxable + gst).toFixed(2));

    const db = getDb();
    db.quotations = db.quotations || [];

    const newQuotation = {
      id: `QUOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: effectiveCustomerId,
      customerName: customerName || req.user.name,
      items,
      subtotal,
      discountCode: discountCode || null,
      discountAmount: disc,
      taxable,
      gst,
      total,
      notes: notes || '',
      validUntil: validUntil || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Sent',
      createdAt: new Date().toISOString()
    };

    db.quotations.push(newQuotation);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'QUOTATION_CREATED',
      details: { quotationId: newQuotation.id, customerId: effectiveCustomerId, total },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Quotation generated successfully.', data: newQuotation });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/quotations/:id/status - Approve or reject quotation
router.patch('/:id/status', requireAuth, (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Sent', 'Approved', 'Rejected'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const db = getDb();
    const index = (db.quotations || []).findIndex(q => q.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quot = db.quotations[index];

    // Customer can only approve or reject their own quotations
    if (req.user.role === 'Customer' && quot.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    quot.status = status;
    quot.updatedAt = new Date().toISOString();
    db.quotations[index] = quot;
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: `QUOTATION_${status.toUpperCase()}`,
      details: { quotationId: quot.id, status },
      ip: req.ip
    });

    res.json({ success: true, message: `Quotation updated to ${status}.`, data: quot });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations/:id/convert - Convert approved quotation into subscription
router.post('/:id/convert', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.quotations || []).findIndex(q => q.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quot = db.quotations[index];
    if (quot.status === 'Converted') {
      return res.status(400).json({ success: false, message: 'This quotation has already been converted to a subscription.' });
    }

    // Check customer exists
    const customer = (db.customers || []).find(c => c.id === quot.customerId);
    const startDate = new Date().toISOString().split('T')[0];
    const nextBilling = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    db.subscriptions = db.subscriptions || [];
    const newSub = {
      id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: quot.customerId,
      customerName: quot.customerName || (customer ? customer.name : 'Customer'),
      planId: quot.items?.[0]?.id || 'PLAN-001',
      planName: quot.items?.[0]?.name || 'Converted Plan',
      amount: quot.total,
      billingInterval: 'Monthly',
      startDate,
      nextBillingDate: nextBilling,
      status: 'Active',
      convertedFromQuotationId: quot.id,
      history: [
        { action: 'CONVERTED_FROM_QUOTATION', quotationId: quot.id, timestamp: new Date().toISOString(), user: req.user.email }
      ],
      createdAt: new Date().toISOString()
    };

    db.subscriptions.push(newSub);

    // Update quotation status to Converted
    quot.status = 'Converted';
    quot.convertedSubscriptionId = newSub.id;
    quot.updatedAt = new Date().toISOString();
    db.quotations[index] = quot;

    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'QUOTATION_CONVERTED_TO_SUBSCRIPTION',
      details: { quotationId: quot.id, subscriptionId: newSub.id },
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Quotation successfully converted to an active subscription.',
      data: { quotation: quot, subscription: newSub }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/customers - List all customers with search and pagination
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let customers = db.customers || [];

    // Customer role is restricted to seeing their own customer profile
    if (req.user.role === 'Customer' && req.user.customerId) {
      customers = customers.filter(c => c.id === req.user.customerId || c.email === req.user.email);
    }

    const { search, status } = req.query;
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    if (status && status !== 'all') {
      customers = customers.filter(c => c.status && c.status.toLowerCase() === status.toLowerCase());
    }

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id - Retrieve specific customer
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const customer = (db.customers || []).find(c => c.id === req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    // Role check: customer can only read their own
    if (req.user.role === 'Customer' && req.user.customerId !== customer.id && req.user.email !== customer.email) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own customer account.' });
    }

    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers - Create new customer (Staff or Admin)
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const { name, email, phone, company, address, status } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone number are required fields.' });
    }

    const db = getDb();
    db.customers = db.customers || [];

    // Duplicate check
    const existing = db.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'A customer with this email address already exists.' });
    }

    const newCustomer = {
      id: `CUST-${String(db.customers.length + 1).padStart(3, '0')}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company || `${name.trim()} Enterprises`,
      address: address || 'Tamil Nadu, India',
      registrationDate: new Date().toISOString().split('T')[0],
      status: status || 'Active',
      avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    db.customers.push(newCustomer);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_CREATED',
      details: { customerId: newCustomer.id, email: newCustomer.email },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Customer created successfully.', data: newCustomer });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id - Update customer (Staff or Admin, or Customer self-update)
router.put('/:id', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.customers || []).findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customer = db.customers[index];

    // Customer can only update their own profile
    if (req.user.role === 'Customer' && req.user.customerId !== customer.id && req.user.email !== customer.email) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot edit other customers.' });
    }

    const { name, phone, company, address, status, email } = req.body;

    // Email collision check if changing email
    if (email && email.toLowerCase() !== customer.email.toLowerCase()) {
      const emailTaken = db.customers.some(c => c.id !== customer.id && c.email.toLowerCase() === email.toLowerCase());
      if (emailTaken) {
        return res.status(409).json({ success: false, message: 'This email is already in use by another customer.' });
      }
      customer.email = email.toLowerCase().trim();
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (company) customer.company = company.trim();
    if (address) customer.address = address.trim();
    if (status && req.user.role !== 'Customer') customer.status = status; // Only staff/admin can change status

    customer.updatedAt = new Date().toISOString();
    db.customers[index] = customer;
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_UPDATED',
      details: { customerId: customer.id },
      ip: req.ip
    });

    res.json({ success: true, message: 'Customer updated successfully.', data: customer });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id - Admin only
router.delete('/:id', requireAuth, requireRoles(['Admin']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.customers || []).findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const removed = db.customers.splice(index, 1)[0];
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_DELETED',
      details: { customerId: removed.id, email: removed.email },
      ip: req.ip
    });

    res.json({ success: true, message: 'Customer deleted successfully.', data: removed });
  } catch (err) {
    next(err);
  }
});

export default router;


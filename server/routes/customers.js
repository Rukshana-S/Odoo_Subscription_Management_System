import express from 'express';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/customers - List customers from PostgreSQL
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    // Role-based isolation
    if (req.user.role === 'Customer' && req.user.customerId) {
      params.push(req.user.customerId);
      sql += ` AND id = $${params.length}`;
    }

    const { search, status } = req.query;
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(company_name) LIKE $${params.length} OR phone LIKE $${params.length})`;
    }

    if (status && status !== 'all' && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);

    // Format fields for frontend compatibility
    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      company: r.company_name,
      company_name: r.company_name,
      address: r.address,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      registrationDate: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-01-01',
      status: r.status,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id - Single customer from PostgreSQL
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    const r = rows[0];
    if (req.user.role === 'Customer' && req.user.customerId !== r.id && req.user.email !== r.email) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own customer account.' });
    }

    res.json({
      success: true,
      data: {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company_name,
        company_name: r.company_name,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        status: r.status,
        registrationDate: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-01-01'
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers - Create customer in PostgreSQL
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), async (req, res, next) => {
  try {
    const { name, email, phone, company, address, city, state, pincode, status } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone number are required fields.' });
    }

    const pool = getPool();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const { rows: dup } = await pool.query('SELECT id FROM customers WHERE LOWER(email) = $1', [cleanEmail]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: 'A customer with this email address already exists.' });
    }

    const custId = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const custCode = `BL-CUST-${Math.floor(100 + Math.random() * 900)}`;

    const { rows: inserted } = await pool.query(`
      INSERT INTO customers (id, customer_code, name, email, phone, company_name, address, city, state, pincode, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `, [
      custId,
      custCode,
      name.trim(),
      cleanEmail,
      phone.trim(),
      company || `${name.trim()} Enterprises`,
      address || 'Tamil Nadu, India',
      city || 'Chennai',
      state || 'Tamil Nadu',
      pincode || '600001',
      status || 'Active'
    ]);

    const r = inserted[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: r.id,
      details: { customerId: r.id, email: r.email }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company_name,
        company_name: r.company_name,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        status: r.status,
        registrationDate: new Date().toISOString().split('T')[0]
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:id - Update customer in PostgreSQL
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows: existing } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const current = existing[0];
    if (req.user.role === 'Customer' && req.user.customerId !== current.id && req.user.email !== current.email) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot edit other customers.' });
    }

    const { name, phone, company, address, city, state, pincode, status, email } = req.body;

    const newEmail = email ? email.trim().toLowerCase() : current.email;
    if (email && newEmail !== current.email) {
      const { rows: dup } = await pool.query('SELECT id FROM customers WHERE LOWER(email) = $1 AND id != $2', [newEmail, current.id]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: 'This email is already in use by another customer.' });
      }
    }

    const newStatus = (status && req.user.role !== 'Customer') ? status : current.status;

    const { rows: updated } = await pool.query(`
      UPDATE customers 
      SET name = $1, email = $2, phone = $3, company_name = $4, address = $5, city = $6, state = $7, pincode = $8, status = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `, [
      name ? name.trim() : current.name,
      newEmail,
      phone ? phone.trim() : current.phone,
      company ? company.trim() : current.company_name,
      address ? address.trim() : current.address,
      city || current.city,
      state || current.state,
      pincode || current.pincode,
      newStatus,
      current.id
    ]);

    const r = updated[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: r.id
    });

    res.json({
      success: true,
      message: 'Customer updated successfully.',
      data: {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company_name,
        company_name: r.company_name,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        status: r.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/:id - Admin only in PostgreSQL
router.delete('/:id', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const removed = rows[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'CUSTOMER_DELETED',
      entityType: 'CUSTOMER',
      entityId: removed.id
    });

    res.json({ success: true, message: 'Customer deleted successfully.', data: removed });
  } catch (err) {
    next(err);
  }
});

export default router;

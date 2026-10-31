import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool.js';
import { logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// POST /api/admin/staff - Provision staff or admin accounts
router.post('/staff', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const { name, email, password, role = 'Staff', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    if (!['Staff', 'Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Admin can only provision Staff or Admin roles.' });
    }

    const pool = getPool();
    const cleanEmail = email.toLowerCase().trim();

    const { rows: dup } = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `USER-${role.toUpperCase()}-${Date.now()}`;

    const { rows: inserted } = await pool.query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, role, token_version, is_active, email_verified, created_at, updated_at)
      VALUES ($1, $2, '', $3, $4, $5, 1, true, true, NOW(), NOW())
      RETURNING id, first_name, email, role, is_active, created_at;
    `, [userId, name.trim(), cleanEmail, passwordHash, role]);

    const u = inserted[0];
    await logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'ADMIN_PROVISIONED_USER',
      entityType: 'USER',
      entityId: u.id,
      details: { role: u.role, email: u.email }
    });

    res.status(201).json({
      success: true,
      message: `${role} account provisioned successfully.`,
      user: {
        id: u.id,
        name: u.first_name,
        email: u.email,
        role: u.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', requireAuth, requireRoles(['Admin']), async (req, res, next) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, first_name as name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

export default router;

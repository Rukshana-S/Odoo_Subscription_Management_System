import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Only Admin can create staff accounts
router.post('/staff', requireAuth, requireRoles(['Admin']), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and temporary password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newStaff = {
      id: `STAFF-${Date.now()}`,
      name: name.trim().split(' ')[0],
      fullName: name.trim(),
      email: normalizedEmail,
      phone: phone || '',
      passwordHash,
      role: 'Staff',
      customerId: null,
      emailVerified: true,
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    db.users.push(newStaff);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'STAFF_PROVISIONED',
      details: { staffEmail: newStaff.email },
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Staff member ${newStaff.name} created successfully.`,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
});

// Admin list all system users
router.get('/users', requireAuth, requireRoles(['Admin']), (req, res) => {
  const db = getDb();
  const safeUsers = db.users.map(({ passwordHash, ...safe }) => safe);
  return res.status(200).json({ success: true, users: safeUsers });
});

// Admin view audit logs
router.get('/audit-logs', requireAuth, requireRoles(['Admin']), (req, res) => {
  const db = getDb();
  return res.status(200).json({ success: true, logs: db.auditLogs.slice(-100).reverse() });
});

export default router;


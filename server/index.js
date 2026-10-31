import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';

import { initDatabase, getDb, saveDb } from './db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize DB and ensure teammate seed data is respected
initDatabase();
const seedDefaultAccounts = async () => {
  const db = getDb();
  if (db.users.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Arul@12345', salt);
    const staffPass = await bcrypt.hash('Priya@12345', salt);
    const customerPass = await bcrypt.hash('Kavin@12345', salt);

    db.users.push(
      {
        id: 'USER-ADMIN-01',
        name: 'Arul',
        fullName: 'Arul Selvan',
        email: 'arul@brightloop.in',
        phone: '+91 98400 11223',
        passwordHash: adminPass,
        role: 'Admin',
        customerId: null,
        emailVerified: true,
        accountStatus: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      },
      {
        id: 'USER-STAFF-01',
        name: 'Priya',
        fullName: 'Priya Dharshini',
        email: 'priya@brightloop.in',
        phone: '+91 94430 55667',
        passwordHash: staffPass,
        role: 'Staff',
        customerId: null,
        emailVerified: true,
        accountStatus: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      },
      {
        id: 'USER-CUST-01',
        name: 'Kavin',
        fullName: 'Kavin Kumar',
        email: 'kavin@chennaitech.in',
        phone: '+91 98401 23456',
        passwordHash: customerPass,
        role: 'Customer',
        customerId: 'CUST-001',
        emailVerified: true,
        accountStatus: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      }
    );
    saveDb(db);
    console.log('[BRIGHTLOOP SERVER] Default accounts initialized: Arul (Admin), Priya (Staff), Kavin (Customer)');
  }
};
seedDefaultAccounts();

// Security Middlewares
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Rate Limiting on Authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'Brightloop Authentication & Core API', timestamp: new Date() });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[BRIGHTLOOP SERVER] REST API Backend running on http://localhost:${PORT}`);
});

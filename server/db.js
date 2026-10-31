import { getPool } from './db/pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTestEnv = process.env.NODE_ENV === 'test';
const DB_FILE = isTestEnv
  ? path.join(__dirname, 'database.test.json')
  : path.join(__dirname, 'database.json');

export const initDatabase = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      refreshTokens: [],
      passwordResetTokens: [],
      emailVerificationTokens: [],
      auditLogs: [],
      customers: [],
      products: [],
      plans: [],
      subscriptions: [],
      quotations: [],
      invoices: [],
      payments: [],
      discounts: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
};

export const getDb = () => {
  initDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      users: [],
      refreshTokens: [],
      passwordResetTokens: [],
      emailVerificationTokens: [],
      auditLogs: [],
      customers: [],
      products: [],
      plans: [],
      subscriptions: [],
      quotations: [],
      invoices: [],
      payments: [],
      discounts: []
    };
  }
};

export const saveDb = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
};

export const logAudit = async ({ userId, email, action, entityType = 'SYSTEM', entityId = null, details = {}, ip = '127.0.0.1' }) => {
  try {
    const pool = getPool();
    const id = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(`
      INSERT INTO audit_logs (id, user_id, email, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [id, userId || null, email || null, action, entityType, entityId, JSON.stringify(details), ip]);
  } catch (err) {
    // If pool is not available or query fails, write to JSON audit fallback
    try {
      const db = getDb();
      db.auditLogs = db.auditLogs || [];
      db.auditLogs.push({
        id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: userId || null,
        email: email || null,
        action,
        details: details || {},
        ip: ip || '127.0.0.1',
        timestamp: new Date().toISOString()
      });
      saveDb(db);
    } catch (e) {}
  }
};

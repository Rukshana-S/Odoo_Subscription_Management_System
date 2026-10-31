import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allows isolated test database file when running in test mode
const isTestEnv = process.env.NODE_ENV === 'test';
const DB_FILE = isTestEnv
  ? path.join(__dirname, 'database.test.json')
  : path.join(__dirname, 'database.json');

// Initialize schema if not present
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
  } else {
    // Ensure table arrays exist non-destructively
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const db = JSON.parse(raw);
      const tables = ['users', 'refreshTokens', 'passwordResetTokens', 'emailVerificationTokens', 'auditLogs', 'customers', 'products', 'plans', 'subscriptions', 'quotations', 'invoices', 'payments', 'discounts'];
      let modified = false;
      tables.forEach(t => {
        if (!Array.isArray(db[t])) {
          db[t] = [];
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      }
    } catch (e) {
      // ignore
    }
  }
};

export const getDb = () => {
  initDatabase();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
};

export const saveDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

export const logAudit = ({ userId, email, action, details, ip }) => {
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
};

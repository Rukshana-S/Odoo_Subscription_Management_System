import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize schema if not present
export const initDatabase = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      refreshTokens: [],
      passwordResetTokens: [],
      emailVerificationTokens: [],
      auditLogs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
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


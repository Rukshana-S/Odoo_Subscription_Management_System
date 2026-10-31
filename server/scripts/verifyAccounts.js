import { getPool, closePool } from '../db/pool.js';
import bcrypt from 'bcryptjs';

async function verifyAccounts() {
  const pool = getPool();
  try {
    const accounts = [
      { email: 'arul@brightloop.in', expectedRole: 'Admin' },
      { email: 'priya@brightloop.in', expectedRole: 'Staff' },
      { email: 'kavin@chennaitech.in', expectedRole: 'Customer' }
    ];

    console.log('\n--- VERIFYING ROLE ACCOUNTS & BCRYPT PASSWORDS ---');
    for (const acc of accounts) {
      const res = await pool.query('SELECT id, first_name, email, role, password_hash, is_active FROM users WHERE email = $1', [acc.email]);
      const u = res.rows[0];
      const match = bcrypt.compareSync('BrightLoop@2026!', u.password_hash);
      console.log(`- ${u.role.padEnd(9)} | ${u.first_name.padEnd(8)} | ${u.email.padEnd(25)} | Verified: ${match}`);
    }
  } finally {
    await closePool();
  }
}

verifyAccounts();


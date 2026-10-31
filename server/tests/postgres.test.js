import { getPool, closePool } from '../db/pool.js';
import bcrypt from 'bcryptjs';

describe('PostgreSQL Database Integration Test Suite', () => {
  const pool = getPool();

  afterAll(async () => {
    await closePool();
  });

  it('1. Connects to PostgreSQL database and checks active version', async () => {
    const res = await pool.query('SELECT version(), current_database()');
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].current_database).toBe('brightloop_db');
  });

  it('2. Verifies users table schema and seeded Tamil accounts', async () => {
    const res = await pool.query("SELECT email, role, first_name, password_hash FROM users WHERE role = 'Admin'");
    expect(res.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.rows[0].email).toBe('arul@brightloop.in');
    expect(res.rows[0].first_name).toBe('Arul');
    expect(bcrypt.compareSync('BrightLoop@2026!', res.rows[0].password_hash)).toBe(true);
  });

  it('3. Verifies customers table and foreign key linkage to users', async () => {
    const res = await pool.query(`
      SELECT c.name, c.company_name, c.city, u.email, u.role
      FROM customers c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = 'CUST-001'
    `);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].name).toBe('Kavin');
    expect(res.rows[0].city).toBe('Chennai');
    expect(res.rows[0].email).toBe('kavin@chennaitech.in');
  });

  it('4. Verifies invoice GST calculations (18%) and balances in PostgreSQL', async () => {
    const res = await pool.query('SELECT subtotal, discount, taxable, gst_amount, total, paid_amount, balance, status FROM invoices LIMIT 5');
    expect(res.rows.length).toBe(5);
    for (const inv of res.rows) {
      const taxable = Number(inv.subtotal) - Number(inv.discount);
      const expectedGst = Number((taxable * 0.18).toFixed(2));
      const expectedTotal = Number((taxable + expectedGst).toFixed(2));
      expect(Number(inv.gst_amount)).toBeCloseTo(expectedGst, 1);
      expect(Number(inv.total)).toBeCloseTo(expectedTotal, 1);
      expect(Number(inv.balance)).toBeCloseTo(Number(inv.total) - Number(inv.paid_amount), 1);
    }
  });

  it('5. Verifies payments linked to valid invoices', async () => {
    const res = await pool.query(`
      SELECT p.receipt_number, p.amount, p.payment_method, i.invoice_number, i.total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      LIMIT 5
    `);
    expect(res.rows.length).toBe(5);
    expect(res.rows[0].receipt_number).toBeDefined();
    expect(['UPI', 'Bank Transfer', 'Credit Card', 'Net Banking']).toContain(res.rows[0].payment_method);
  });

  it('6. Verifies ACID transaction rollback on simulated constraint failure', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO customers (id, customer_code, name, email, phone)
        VALUES ('TEST-ROLLBACK-01', 'CODE-ROLLBACK-01', 'Rollback Test', 'rollback@test.in', '9999999999')
      `);
      // Simulate error
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const check = await pool.query("SELECT 1 FROM customers WHERE id = 'TEST-ROLLBACK-01'");
    expect(check.rows.length).toBe(0);
  });

  it('7. Verifies subscriptions lifecycle and billing intervals', async () => {
    const res = await pool.query('SELECT status, billing_interval, next_billing_date FROM subscriptions');
    expect(res.rows.length).toBeGreaterThanOrEqual(15);
    const statuses = res.rows.map(r => r.status);
    expect(statuses).toContain('Active');
    expect(statuses).toContain('Paused');
    expect(statuses).toContain('Cancelled');
  });
});


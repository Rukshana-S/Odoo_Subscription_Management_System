import { getPool, closePool } from '../db/pool.js';
import {
  mockUsers,
  mockCustomers,
  mockProducts,
  mockPlans,
  mockDiscounts
} from './mockData.js';

export const seedDatabase = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[SEED] Starting reproducible PostgreSQL database seeding...');
    await client.query('BEGIN');

    // 1. Seed Users (Admin, Staff, Customers)
    console.log(`[SEED] Inserting ${mockUsers.length} users...`);
    for (const u of mockUsers) {
      await client.query(`
        INSERT INTO users (id, first_name, last_name, email, password_hash, role, token_version, is_active, email_verified, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          password_hash = EXCLUDED.password_hash;
      `, [u.id, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.token_version, u.is_active, u.email_verified, u.avatar_url || null]);
    }

    // 2. Seed Customers (10 records with Tamil Nadu locations)
    console.log(`[SEED] Inserting ${mockCustomers.length} customers...`);
    for (const c of mockCustomers) {
      await client.query(`
        INSERT INTO customers (id, user_id, customer_code, name, email, phone, company_name, address, city, state, pincode, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          company_name = EXCLUDED.company_name,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          pincode = EXCLUDED.pincode,
          status = EXCLUDED.status;
      `, [c.id, c.user_id, c.customer_code, c.name, c.email, c.phone, c.company_name, c.address, c.city, c.state, c.pincode, c.status]);
    }

    // 3. Seed Products (8 software and cloud infrastructure items)
    console.log(`[SEED] Inserting ${mockProducts.length} products...`);
    for (const p of mockProducts) {
      await client.query(`
        INSERT INTO products (id, name, description, category, price, cost_price, gst_rate, billing_interval)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          category = EXCLUDED.category;
      `, [p.id, p.name, p.description, p.category, p.price, p.cost_price, p.gst_rate, p.billing_interval]);
    }

    // 4. Seed Plans (6 billing intervals: Monthly, Quarterly, Half-Yearly, Yearly)
    console.log(`[SEED] Inserting ${mockPlans.length} subscription plans...`);
    for (const pl of mockPlans) {
      await client.query(`
        INSERT INTO plans (id, name, code, description, billing_interval, price, popular, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          popular = EXCLUDED.popular;
      `, [pl.id, pl.name, pl.code, pl.description, pl.billing_interval, pl.price, pl.popular, pl.features]);
    }

    // 5. Seed Discounts (5 coupon codes)
    console.log(`[SEED] Inserting ${mockDiscounts.length} promotional discounts...`);
    for (const d of mockDiscounts) {
      await client.query(`
        INSERT INTO discounts (id, code, description, discount_type, discount_value, max_uses, used_count, valid_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          discount_value = EXCLUDED.discount_value,
          max_uses = EXCLUDED.max_uses,
          valid_until = EXCLUDED.valid_until;
      `, [d.id, d.code, d.description, d.discount_type, d.discount_value, d.max_uses, d.used_count, d.valid_until]);
    }

    // 6. Seed Subscriptions (15 realistic subscription records)
    console.log('[SEED] Generating 15 subscription records...');
    const intervals = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
    const statuses = ['Active', 'Active', 'Active', 'Paused', 'Cancelled'];

    for (let i = 1; i <= 15; i++) {
      const custIndex = (i - 1) % mockCustomers.length;
      const planIndex = (i - 1) % mockPlans.length;
      const prodIndex = (i - 1) % mockProducts.length;

      const cust = mockCustomers[custIndex];
      const plan = mockPlans[planIndex];
      const prod = mockProducts[prodIndex];

      const subId = `SUB-2026-${String(i).padStart(3, '0')}`;
      const status = statuses[i % statuses.length];
      const interval = intervals[i % intervals.length];

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (i * 4));
      const nextDateStr = nextDate.toISOString().split('T')[0];

      await client.query(`
        INSERT INTO subscriptions (id, customer_id, plan_id, product_id, plan_name, customer_name, status, start_date, next_billing_date, billing_interval, quantity, amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE - INTERVAL '${i * 10} days', $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          next_billing_date = EXCLUDED.next_billing_date;
      `, [subId, cust.id, plan.id, prod.id, plan.name, cust.name, status, nextDateStr, interval, 1, plan.price]);
    }

    // 7. Seed Quotations (10 quotation records)
    console.log('[SEED] Generating 10 quotation records with 18% GST...');
    const quoteStatuses = ['Sent', 'Approved', 'Converted', 'Draft', 'Rejected'];

    for (let i = 1; i <= 10; i++) {
      const cust = mockCustomers[(i - 1) % mockCustomers.length];
      const prod = mockProducts[(i - 1) % mockProducts.length];
      const quotId = `QUOT-2026-${String(i).padStart(3, '0')}`;
      const quotNum = `QT-2026-${String(i).padStart(4, '0')}`;

      const subtotal = Number(prod.price);
      const discountAmount = i % 3 === 0 ? 500.00 : 0.00;
      const taxable = Math.max(0, subtotal - discountAmount);
      const gstAmount = Number((taxable * 0.18).toFixed(2));
      const total = Number((taxable + gstAmount).toFixed(2));
      const status = quoteStatuses[i % quoteStatuses.length];

      const items = JSON.stringify([{ id: prod.id, name: prod.name, price: prod.price, quantity: 1 }]);

      await client.query(`
        INSERT INTO quotations (id, quotation_number, customer_id, customer_name, items, subtotal, discount_amount, taxable, gst_rate, gst_amount, total, status, valid_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 18.00, $9, $10, $11, CURRENT_DATE + INTERVAL '15 days')
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          total = EXCLUDED.total;
      `, [quotId, quotNum, cust.id, cust.name, items, subtotal, discountAmount, taxable, gstAmount, total, status]);
    }

    // 8. Seed Invoices (15 invoices with verified GST & balances)
    console.log('[SEED] Generating 15 invoices with mathematically verified GST...');
    const invStatuses = ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'];

    for (let i = 1; i <= 15; i++) {
      const cust = mockCustomers[(i - 1) % mockCustomers.length];
      const subId = `SUB-2026-${String(i).padStart(3, '0')}`;
      const invId = `INV-2026-${String(i).padStart(3, '0')}`;
      const invNum = `INV-2026-${String(i).padStart(4, '0')}`;

      const subtotal = 5000.00 + (i * 500.00);
      const discount = i % 2 === 0 ? 250.00 : 0.00;
      const taxable = subtotal - discount;
      const gstAmount = Number((taxable * 0.18).toFixed(2));
      const total = Number((taxable + gstAmount).toFixed(2));

      const status = invStatuses[i % invStatuses.length];
      let paidAmount = 0.00;
      let balance = total;

      if (status === 'Paid') {
        paidAmount = total;
        balance = 0.00;
      } else if (status === 'Partially Paid') {
        paidAmount = Number((total / 2).toFixed(2));
        balance = Number((total - paidAmount).toFixed(2));
      }

      await client.query(`
        INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, customer_name, subtotal, discount, taxable, gst_rate, gst_amount, total, paid_amount, balance, due_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 18.00, $9, $10, $11, $12, CURRENT_DATE + INTERVAL '${i * 3} days', $13)
        ON CONFLICT (id) DO UPDATE SET
          paid_amount = EXCLUDED.paid_amount,
          balance = EXCLUDED.balance,
          status = EXCLUDED.status;
      `, [invId, invNum, cust.id, subId, cust.name, subtotal, discount, taxable, gstAmount, total, paidAmount, balance, status]);
    }

    // 9. Seed Payments (20 payment records matching invoices)
    console.log('[SEED] Generating 20 payments across UPI, Bank Transfer, and Card...');
    const methods = ['UPI', 'Bank Transfer', 'Credit Card', 'Net Banking'];

    for (let i = 1; i <= 20; i++) {
      const invIdx = ((i - 1) % 15) + 1;
      const invId = `INV-2026-${String(invIdx).padStart(3, '0')}`;
      const invNum = `INV-2026-${String(invIdx).padStart(4, '0')}`;
      const cust = mockCustomers[(i - 1) % mockCustomers.length];

      const payId = `PAY-2026-${String(i).padStart(3, '0')}`;
      const receiptNum = `REC-2026-${String(i).padStart(4, '0')}`;
      const txnRef = `TXN-IN-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
      const amount = 2000.00 + (i * 150.00);
      const method = methods[i % methods.length];

      await client.query(`
        INSERT INTO payments (id, receipt_number, invoice_id, invoice_number, customer_id, customer_name, payment_method, amount, transaction_reference, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Success', $10)
        ON CONFLICT (id) DO UPDATE SET
          amount = EXCLUDED.amount,
          status = EXCLUDED.status;
      `, [payId, receiptNum, invId, invNum, cust.id, cust.name, method, amount, txnRef, `SaaS Settlement via ${method}`]);
    }

    // 10. Seed Audit Logs (10 sample entries)
    console.log('[SEED] Generating 10 system audit log entries...');
    const actions = [
      'USER_LOGIN', 'CUSTOMER_CREATED', 'SUBSCRIPTION_ACTIVATED',
      'INVOICE_GENERATED', 'PAYMENT_RECORDED', 'PASSWORD_CHANGED'
    ];

    for (let i = 1; i <= 10; i++) {
      const logId = `AUDIT-2026-${String(i).padStart(3, '0')}`;
      const action = actions[i % actions.length];

      await client.query(`
        INSERT INTO audit_logs (id, user_id, email, action, entity_type, entity_id, details, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, '127.0.0.1')
        ON CONFLICT (id) DO NOTHING;
      `, [
        logId,
        mockUsers[0].id,
        mockUsers[0].email,
        action,
        'SYSTEM',
        `REC-${i}`,
        JSON.stringify({ note: `Demo audit trail item ${i}`, initiatedBy: 'Arul (Admin)' })
      ]);
    }

    await client.query('COMMIT');
    console.log('[SEED COMPLETED] Successfully populated PostgreSQL with realistic mock data.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED ERROR] Failed to seed PostgreSQL database:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Direct script execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      await closePool();
      process.exit(1);
    });
}


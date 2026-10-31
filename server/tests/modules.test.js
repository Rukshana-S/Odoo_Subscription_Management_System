import request from 'supertest';
import { createApp } from '../app.js';
import { getDb, saveDb } from '../db.js';
import { generateAccessToken } from '../middleware/auth.js';

const app = createApp();

describe('Comprehensive BrightLoop Modules Test Suite', () => {
  let adminToken, staffToken, customerToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'USER-ADMIN-01', email: 'arul@brightloop.in', role: 'Admin', name: 'Arul' });
    staffToken = generateAccessToken({ id: 'USER-STAFF-01', email: 'priya@brightloop.in', role: 'Staff', name: 'Priya' });
    customerToken = generateAccessToken({ id: 'USER-CUST-01', email: 'kavin@chennaitech.in', role: 'Customer', customerId: 'CUST-001', name: 'Kavin' });
  });

  // 1. Customer Management
  describe('Customer Management API', () => {
    let createdCustomerId;

    it('1. GET /api/customers - List customers (Admin)', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2. POST /api/customers - Create new customer (Staff)', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Nila New',
          email: 'nila.new@chennaitech.in',
          phone: '+91 94441 99887',
          company: 'Nila Ventures'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdCustomerId = res.body.data.id;
    });

    it('3. POST /api/customers - Duplicate email rejection', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Nila Duplicate',
          email: 'nila.new@chennaitech.in',
          phone: '+91 94441 99887'
        });
      expect(res.statusCode).toBe(409);
    });

    it('4. PUT /api/customers/:id - Update customer', async () => {
      const res = await request(app)
        .put(`/api/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nila Updated' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Nila Updated');
    });

    it('5. DELETE /api/customers/:id - Delete customer (Admin)', async () => {
      const res = await request(app)
        .delete(`/api/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('6. DELETE /api/customers/:id - Staff forbidden from deleting', async () => {
      const res = await request(app)
        .delete('/api/customers/CUST-001')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // 2. Product Management
  describe('Product Management API', () => {
    let createdProdId;

    it('7. GET /api/products - Public list products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('8. POST /api/products - Create product (Admin)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Automated Billing Microservice',
          price: 1500,
          category: 'Software'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      createdProdId = res.body.data.id;
    });

    it('9. POST /api/products - Reject invalid price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad Prod', price: -50 });
      expect(res.statusCode).toBe(400);
    });

    it('10. PUT /api/products/:id - Update product', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProdId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ price: 1800 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.price).toBe(1800);
    });
  });

  // 3. Subscription Plans
  describe('Subscription Plans API', () => {
    let createdPlanId;

    it('11. GET /api/plans - Public list plans', async () => {
      const res = await request(app).get('/api/plans');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('12. POST /api/plans - Create plan', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Growth Quarterly',
          price: 4500,
          billingInterval: 'Quarterly'
        });
      expect(res.statusCode).toBe(201);
      createdPlanId = res.body.data.id;
    });

    it('13. PUT /api/plans/:id - Update plan', async () => {
      const res = await request(app)
        .put(`/api/plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 4200 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.price).toBe(4200);
    });
  });

  // 4. Subscriptions Lifecycle
  describe('Subscriptions API', () => {
    let subId;

    it('14. POST /api/subscriptions - Create subscription', async () => {
      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: 'CUST-001',
          customerName: 'Kavin',
          planId: 'PLAN-001',
          amount: 2500,
          billingInterval: 'Monthly'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('Active');
      subId = res.body.data.id;
    });

    it('15. PATCH /api/subscriptions/:id/status - Pause subscription', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${subId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Paused' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Paused');
    });

    it('16. PATCH /api/subscriptions/:id/status - Resume subscription', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${subId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Active' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Active');
    });

    it('17. PATCH /api/subscriptions/:id/status - Cancel subscription', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${subId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Cancelled' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Cancelled');
    });

    it('18. PATCH /api/subscriptions/:id/status - Reject reviving cancelled subscription', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${subId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Active' });
      expect(res.statusCode).toBe(400);
    });
  });

  // 5. Quotations
  describe('Quotations API', () => {
    let quotationId;

    it('19. POST /api/quotations - Create quotation with auto GST calculation', async () => {
      const res = await request(app)
        .post('/api/quotations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 'CUST-001',
          items: [{ name: 'Cloud Package', price: 10000, quantity: 1 }],
          discountAmount: 1000
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.subtotal).toBe(10000);
      expect(res.body.data.taxable).toBe(9000);
      expect(res.body.data.gst).toBe(1620); // 18% of 9000
      expect(res.body.data.total).toBe(10620);
      quotationId = res.body.data.id;
    });

    it('20. PATCH /api/quotations/:id/status - Approve quotation', async () => {
      const res = await request(app)
        .patch(`/api/quotations/${quotationId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Approved' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Approved');
    });

    it('21. POST /api/quotations/:id/convert - Convert quotation to subscription', async () => {
      const res = await request(app)
        .post(`/api/quotations/${quotationId}/convert`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.subscription).toBeDefined();
      expect(res.body.data.quotation.status).toBe('Converted');
    });
  });

  // 6. Invoices, GST & Payments
  describe('Invoices and Payments API', () => {
    let invoiceId;

    it('22. POST /api/invoices - Generate invoice with GST calculation', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerId: 'CUST-001',
          customerName: 'Kavin',
          subtotal: 5000,
          discount: 500
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.subtotal).toBe(5000);
      expect(res.body.data.taxable).toBe(4500);
      expect(res.body.data.gst).toBe(810); // 18% of 4500
      expect(res.body.data.total).toBe(5310);
      expect(res.body.data.balance).toBe(5310);
      expect(res.body.data.status).toBe('Unpaid');
      invoiceId = res.body.data.id;
    });

    it('23. POST /api/payments - Partial payment recording', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 2000,
          method: 'UPI'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.invoice.paidAmount).toBe(2000);
      expect(res.body.data.invoice.balance).toBe(3310);
      expect(res.body.data.invoice.status).toBe('Partially Paid');
    });

    it('24. POST /api/payments - Reject payment exceeding balance', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 5000 // Exceeds 3310
        });
      expect(res.statusCode).toBe(400);
    });

    it('25. POST /api/payments - Complete remaining payment to mark invoice Paid', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 3310,
          method: 'Bank Transfer'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.invoice.balance).toBe(0);
      expect(res.body.data.invoice.status).toBe('Paid');
    });
  });

  // 7. Discounts API
  describe('Discounts API', () => {
    const testCode = `TESTDISC_${Date.now()}`;

    it('26. POST /api/discounts - Create coupon code', async () => {
      const res = await request(app)
        .post('/api/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: testCode,
          type: 'Percentage',
          value: 25,
          validUntil: '2026-12-31'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.code).toBe(testCode);
    });

    it('27. POST /api/discounts/validate - Validate coupon discount deduction', async () => {
      const res = await request(app)
        .post('/api/discounts/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: testCode,
          subtotal: 1000
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.deduction).toBe(250);
      expect(res.body.data.finalAmount).toBe(750);
    });
  });

  // 8. Reports API
  describe('Reports & Analytics API', () => {
    it('28. GET /api/reports/dashboard - Fetch business metrics', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(res.body.data.activeSubscriptions).toBeDefined();
      expect(Array.isArray(res.body.data.monthlyOverview)).toBe(true);
    });
  });
});

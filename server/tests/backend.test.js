import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp, seedDefaultAccounts } from '../app.js';
import { getDb, saveDb } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB = path.join(__dirname, '../../database.test.json');

describe('BrightLoop Backend Test Suite', () => {
  let app;
  let adminToken = '';
  let customerToken = '';
  let customerUser = null;
  const testCustomerEmail = `test_kavin_${Date.now()}@chennaitech.in`;
  const initialPassword = 'InitialSecure@2024';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Clear test db file if exists
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    await seedDefaultAccounts();
    app = createApp();

    // Login default Admin (Arul)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'arul@brightloop.in', password: 'Arul@12345' });
    adminToken = adminRes.body.accessToken;
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB)) {
      try {
        fs.unlinkSync(TEST_DB);
      } catch (e) {}
    }
  });

  // =========================================================================
  // A. AUTHENTICATION TESTS
  // =========================================================================
  describe('A. Authentication Tests', () => {
    let verifyToken = '';

    test('A1. Register with valid details (enforces Customer role)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Kavin Kumar',
          email: testCustomerEmail,
          phone: '+91 98401 23456',
          password: initialPassword,
          confirmPassword: initialPassword,
          termsAccepted: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('Customer');
      expect(res.body.user.emailVerified).toBe(false);
      expect(res.body.debugVerificationToken).toBeDefined();
      verifyToken = res.body.debugVerificationToken;
      customerUser = res.body.user;
    });

    test('A2. Register with an existing email (should fail 409)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Duplicate Kavin',
          email: testCustomerEmail,
          password: initialPassword,
          confirmPassword: initialPassword,
          termsAccepted: true
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('A3. Register with missing required fields (should fail 400)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Incomplete User',
          email: 'incomplete@test.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('A4. Login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: initialPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(testCustomerEmail.toLowerCase());
      customerToken = res.body.accessToken;
    });

    test('A5. Login with incorrect password (should fail 401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'IncorrectPassword@999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    test('A6. Login with an unregistered email (should fail 401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown_ghost@brightloop.in',
          password: 'SomePassword@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('A7. Access a protected endpoint without authentication (should fail 401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('A8. Access a protected endpoint with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testCustomerEmail.toLowerCase());
    });

    test('A9. Logout successfully', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('A10. Test expired or invalid tokens (should fail 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_malformed_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // B. CHANGE PASSWORD TESTS
  // =========================================================================
  describe('B. Change Password Tests (PATCH /api/auth/change-password)', () => {
    const newValidPassword = 'BrandNewSecure@2025';

    test('B1. Change password without authentication (should fail 401)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .send({
          currentPassword: initialPassword,
          newPassword: newValidPassword,
          confirmPassword: newValidPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('B2. Change password with an incorrect current password (should fail 400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: newValidPassword,
          confirmPassword: newValidPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/current password provided is incorrect/i);
    });

    test('B3. Change password with mismatched confirmation (should fail 400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword: newValidPassword,
          confirmPassword: 'MismatchPassword@2025'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not match/i);
    });

    test('B4. Change password with a weak password (should fail 400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword: 'weak',
          confirmPassword: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/greater than 8 characters/i);
    });

    test('B5. Change password with missing fields (should fail 400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          newPassword: newValidPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('B6. Attempt to reuse current password (should fail 400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword: initialPassword,
          confirmPassword: initialPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be identical/i);
    });

    test('B7. Change password with valid current and new passwords (should succeed 200)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword: newValidPassword,
          confirmPassword: newValidPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/password changed successfully/i);
    });

    test('B8. Verify that the new password is correctly hashed in database', async () => {
      const db = getDb();
      const updatedUser = db.users.find(u => u.email === testCustomerEmail.toLowerCase());
      expect(updatedUser.passwordHash).toBeDefined();
      expect(updatedUser.passwordHash).not.toBe(newValidPassword);
      expect(updatedUser.passwordHash.startsWith('$2')).toBe(true);
    });

    test('B9. Verify old password no longer works for login (should fail 401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: initialPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('B10. Verify that the new password works for login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: newValidPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      customerToken = res.body.accessToken;
    });

    test('B11. Verify session/token invalidation policy', async () => {
      const db = getDb();
      // Ensure refresh tokens for the user were purged upon password change
      const userRefreshTokens = (db.refreshTokens || []).filter(rt => rt.userId === customerUser.id);
      expect(userRefreshTokens.length).toBeLessThanOrEqual(1); // Only new login token exists
    });
  });

  // =========================================================================
  // C. PASSWORD RECOVERY & EMAIL VERIFICATION TESTS
  // =========================================================================
  describe('C. Password Recovery & Verification Tests', () => {
    let resetToken = '';

    test('C1. Request password reset with a registered email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testCustomerEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.debugResetToken).toBeDefined();
      resetToken = res.body.debugResetToken;
    });

    test('C2. Request reset with unregistered email without leaking existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent_account@brightloop.in' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/if an account exists/i);
    });

    test('C3. Reset using a valid token (should succeed 200)', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'PostRecoveryPass@2025',
          confirmNewPassword: 'PostRecoveryPass@2025'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('C4. Attempt to reuse a reset token (should fail 400)', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword@2025',
          confirmNewPassword: 'AnotherPassword@2025'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    test('C5. Reset using an invalid token (should fail 400)', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid_token_99999',
          newPassword: 'AnotherPassword@2025',
          confirmNewPassword: 'AnotherPassword@2025'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // D. PROFILE TESTS
  // =========================================================================
  describe('D. Profile Tests', () => {
    let authUserToken = '';
    const uniqueEmail = `kavin_unique_${Date.now()}@chennaitech.in`;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testCustomerEmail, password: 'PostRecoveryPass@2025' });
      authUserToken = res.body.accessToken;
    });

    test('D1. Retrieve authenticated profile (GET /api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.passwordHash).toBeUndefined(); // sensitive info not exposed
      expect(res.body.user.email).toBe(testCustomerEmail.toLowerCase());
    });

    test('D2. Update first name (PUT /api/auth/profile)', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authUserToken}`)
        .send({ name: 'Kavin Raj' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Kavin');
      expect(res.body.user.fullName).toBe('Kavin Raj');
    });

    test('D3. Update email with a valid unique email', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authUserToken}`)
        .send({ email: uniqueEmail });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(uniqueEmail.toLowerCase());
      expect(res.body.user.emailVerified).toBe(false);
    });

    test('D4. Attempt to update email to an existing email (should fail 409)', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authUserToken}`)
        .send({ email: 'arul@brightloop.in' }); // Admin's existing email

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already in use/i);
    });

    test("D5. Attempt unauthorized role/user access by Customer on Admin users list (should fail 403)", async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  // =========================================================================
  // E. API SECURITY TESTS
  // =========================================================================
  describe('E. API Security Tests', () => {
    test('E1. SQL/NoSQL injection attempt on login (should fail 401 safely)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR 1=1 --",
          password: "' OR 'a'='a"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('E2. Missing authorization header on protected route (should fail 401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('E3. Malformed/tampered JWT on protected route (should fail 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('E4. Sensitive information exposure prevention: passwordHash never returned in responses', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    test('E5. Unauthorized resource creation (Customer attempting to provision Staff, should fail 403)', async () => {
      const res = await request(app)
        .post('/api/admin/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Staff',
          email: 'unauth@brightloop.in',
          password: 'Password@123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

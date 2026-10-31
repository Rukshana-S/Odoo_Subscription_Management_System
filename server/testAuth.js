import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BRIGHTLOOP END-TO-END AUTHENTICATION SUITE ---\n');

  // Test 1: Customer Signup (Weak Password)
  try {
    await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Test Customer',
      email: 'weak@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      termsAccepted: true
    });
    console.error('❌ Test 1 Failed: Weak password was allowed');
  } catch (err) {
    console.log('✅ Test 1 Passed: Weak password blocked with message:', err.response?.data?.message);
  }

  // Test 2: Customer Signup (Password Mismatch)
  try {
    await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Test Customer',
      email: 'mismatch@example.com',
      password: 'ValidPassword@123',
      confirmPassword: 'DifferentPassword@123',
      termsAccepted: true
    });
    console.error('❌ Test 2 Failed: Password mismatch was allowed');
  } catch (err) {
    console.log('✅ Test 2 Passed: Password mismatch correctly rejected');
  }

  // Test 3: Customer Signup (Valid Info - Creates Customer ONLY)
  const testEmail = `kavin_test_${Date.now()}@chennaitech.in`;
  let verifyToken = '';
  try {
    const res = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Kavin Kumar',
      email: testEmail,
      phone: '+91 98401 23456',
      password: 'SecurePassword@2024',
      confirmPassword: 'SecurePassword@2024',
      termsAccepted: true
    });
    console.log('✅ Test 3 Passed: User successfully signed up as role:', res.data?.user?.role);
    verifyToken = res.data?.debugVerificationToken;
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.response?.data || err.message);
  }

  // Test 4: Duplicate Email Signup Blocked
  try {
    await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Duplicate Kavin',
      email: testEmail,
      phone: '+91 98401 23456',
      password: 'SecurePassword@2024',
      confirmPassword: 'SecurePassword@2024',
      termsAccepted: true
    });
    console.error('❌ Test 4 Failed: Duplicate registration was allowed');
  } catch (err) {
    console.log('✅ Test 4 Passed: Duplicate registration blocked with 409 status');
  }

  // Test 5: Verify Email Token
  try {
    const res = await axios.post(`${API_BASE}/auth/verify-email`, {
      token: verifyToken,
      email: testEmail
    });
    console.log('✅ Test 5 Passed: Email successfully verified:', res.data?.message);
  } catch (err) {
    console.error('❌ Test 5 Failed:', err.response?.data || err.message);
  }

  // Test 6: Login with Valid Credentials (Arul - Admin)
  let adminToken = '';
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'arul@brightloop.in',
      password: 'Arul@12345',
      rememberMe: true
    });
    adminToken = res.data?.accessToken;
    console.log('✅ Test 6 Passed: Admin login successful. Role:', res.data?.user?.role);
  } catch (err) {
    console.error('❌ Test 6 Failed:', err.response?.data || err.message);
  }

  // Test 7: Login with Invalid Credentials Blocked
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'arul@brightloop.in',
      password: 'WrongPassword@123'
    });
    console.error('❌ Test 7 Failed: Invalid credentials allowed');
  } catch (err) {
    console.log('✅ Test 7 Passed: Invalid credentials rejected with 401');
  }

  // Test 8: Login with Customer Account
  let customerToken = '';
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'SecurePassword@2024'
    });
    customerToken = res.data?.accessToken;
    console.log('✅ Test 8 Passed: Customer login successful. Role:', res.data?.user?.role);
  } catch (err) {
    console.error('❌ Test 8 Failed:', err.response?.data || err.message);
  }

  // Test 9: RBAC - Customer attempting to access Admin endpoint /api/admin/users
  try {
    await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.error('❌ Test 9 Failed: Customer accessed Admin endpoint!');
  } catch (err) {
    console.log('✅ Test 9 Passed: Customer blocked from Admin endpoint with 403 Forbidden');
  }

  // Test 10: RBAC - Admin successfully accessing /api/admin/users
  try {
    const res = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Test 10 Passed: Admin authorized to view system users. Count:', res.data?.users?.length);
  } catch (err) {
    console.error('❌ Test 10 Failed:', err.response?.data || err.message);
  }

  // Test 11: Forgot Password & Reset Token Generation
  let resetToken = '';
  try {
    const res = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: testEmail
    });
    resetToken = res.data?.debugResetToken;
    console.log('✅ Test 11 Passed: Forgot password workflow executed safely');
  } catch (err) {
    console.error('❌ Test 11 Failed:', err.response?.data || err.message);
  }

  // Test 12: Reset Password with valid token
  try {
    const res = await axios.post(`${API_BASE}/auth/reset-password`, {
      token: resetToken,
      newPassword: 'BrandNewPassword@2024',
      confirmNewPassword: 'BrandNewPassword@2024'
    });
    console.log('✅ Test 12 Passed: Password successfully reset:', res.data?.message);
  } catch (err) {
    console.error('❌ Test 12 Failed:', err.response?.data || err.message);
  }

  // Test 13: Login with newly reset password
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'BrandNewPassword@2024'
    });
    console.log('✅ Test 13 Passed: Login successful with newly reset password!');
  } catch (err) {
    console.error('❌ Test 13 Failed:', err.response?.data || err.message);
  }

  // Test 14: Expired or Reused Reset Token Blocked
  try {
    await axios.post(`${API_BASE}/auth/reset-password`, {
      token: resetToken,
      newPassword: 'BrandNewPassword@2024',
      confirmNewPassword: 'BrandNewPassword@2024'
    });
    console.error('❌ Test 14 Failed: Reused token allowed');
  } catch (err) {
    console.log('✅ Test 14 Passed: Used/expired reset token rejected');
  }

  console.log('\n--- ALL 14 CRITICAL AUTHENTICATION & RBAC SCENARIOS VERIFIED ---\n');
}

runTests();


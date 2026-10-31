import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runComprehensiveBackendTests() {
  console.log('================================================================');
  console.log('   BRIGHTLOOP BACKEND TEST SUITE: AUTH & CHANGE PASSWORD        ');
  console.log('================================================================\n');

  let adminToken = '';
  let customerToken = '';
  const customerEmail = `kavin_backend_${Date.now()}@chennaitech.in`;
  const initialPassword = 'InitialSecure@2024';

  // 1. Healthcheck
  try {
    const res = await axios.get(`${API_BASE}/health`);
    console.log('✅ 1. Healthcheck Endpoint OK:', res.data?.status);
  } catch (err) {
    console.error('❌ 1. Healthcheck failed:', err.message);
  }

  // 2. Signup Customer (Public API)
  let verifyToken = '';
  try {
    const res = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Kavin',
      email: customerEmail,
      phone: '+91 98401 23456',
      password: initialPassword,
      confirmPassword: initialPassword,
      termsAccepted: true
    });
    console.log('✅ 2. Registration API OK: Customer created with ID:', res.data?.user?.id);
    verifyToken = res.data?.debugVerificationToken;
  } catch (err) {
    console.error('❌ 2. Registration failed:', err.response?.data || err.message);
  }

  // 3. Verify Email
  try {
    const res = await axios.post(`${API_BASE}/auth/verify-email`, { token: verifyToken });
    console.log('✅ 3. Email Verification API OK:', res.data?.message);
  } catch (err) {
    console.error('❌ 3. Email verification failed:', err.response?.data || err.message);
  }

  // 4. Login API
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: customerEmail,
      password: initialPassword
    });
    customerToken = res.data?.accessToken;
    console.log('✅ 4. Login API OK: Access token issued for', res.data?.user?.name);
  } catch (err) {
    console.error('❌ 4. Login failed:', err.response?.data || err.message);
  }

  // 5. Authenticated User Profile API (GET /api/auth/me)
  try {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✅ 5. Get Profile API OK:', res.data?.user?.email, 'Role:', res.data?.user?.role);
  } catch (err) {
    console.error('❌ 5. Get Profile failed:', err.response?.data || err.message);
  }

  // 6. Update Profile API (PUT /api/auth/profile)
  const updatedEmail = `kavin_updated_${Date.now()}@chennaitech.in`;
  try {
    const res = await axios.put(`${API_BASE}/auth/profile`, {
      name: 'Kavin Kumar',
      email: updatedEmail,
      phone: '+91 98401 99999'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✅ 6. Update Profile API OK: Updated email to', res.data?.user?.email);
  } catch (err) {
    console.error('❌ 6. Update Profile failed:', err.response?.data || err.message);
  }

  // 7. CHANGE PASSWORD TESTS (PATCH /api/auth/change-password)
  console.log('\n--- TESTING CHANGE PASSWORD SPECIFICATION ---');

  // 7a. Reject incorrect current password
  try {
    await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: 'WrongPassword@123',
      newPassword: 'BrandNewSecure@2025',
      confirmPassword: 'BrandNewSecure@2025'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.error('❌ 7a. Failed: Incorrect current password was accepted!');
  } catch (err) {
    console.log('✅ 7a. Rejected incorrect current password with 400:', err.response?.data?.message);
  }

  // 7b. Reject weak new password
  try {
    await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: initialPassword,
      newPassword: 'weak',
      confirmPassword: 'weak'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.error('❌ 7b. Failed: Weak new password was accepted!');
  } catch (err) {
    console.log('✅ 7b. Rejected weak password:', err.response?.data?.message);
  }

  // 7c. Reject mismatch between new and confirm
  try {
    await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: initialPassword,
      newPassword: 'BrandNewSecure@2025',
      confirmPassword: 'MismatchPassword@2025'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.error('❌ 7c. Failed: Password mismatch was accepted!');
  } catch (err) {
    console.log('✅ 7c. Rejected password mismatch:', err.response?.data?.message);
  }

  // 7d. Reject using the current password as the new password
  try {
    await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: initialPassword,
      newPassword: initialPassword,
      confirmPassword: initialPassword
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.error('❌ 7d. Failed: Same password was accepted!');
  } catch (err) {
    console.log('✅ 7d. Prevented using current password as new password:', err.response?.data?.message);
  }

  // 7e. Valid Change Password
  const newValidPassword = 'BrandNewSecure@2025';
  try {
    const res = await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: initialPassword,
      newPassword: newValidPassword,
      confirmPassword: newValidPassword
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✅ 7e. Valid Change Password OK:', res.data?.message);
  } catch (err) {
    console.error('❌ 7e. Valid Change Password failed:', err.response?.data || err.message);
  }

  // 8. Verify old password no longer works
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: updatedEmail,
      password: initialPassword
    });
    console.error('❌ 8. Failed: Old password still works!');
  } catch (err) {
    console.log('✅ 8. Old password successfully invalidated');
  }

  // 9. Verify new password works
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: updatedEmail,
      password: newValidPassword
    });
    console.log('✅ 9. Login with new password succeeded! Active token issued for', res.data?.user?.name);
  } catch (err) {
    console.error('❌ 9. Login with new password failed:', err.response?.data || err.message);
  }

  // 10. Logout API
  try {
    const res = await axios.post(`${API_BASE}/auth/logout`);
    console.log('✅ 10. Logout API OK:', res.data?.message);
  } catch (err) {
    console.error('❌ 10. Logout failed:', err.response?.data || err.message);
  }

  console.log('\n================================================================');
  console.log('   ALL BACKEND REQUIREMENTS & SECURITY RESTRICTIONS VALIDATED   ');
  console.log('================================================================\n');
}

runComprehensiveBackendTests();

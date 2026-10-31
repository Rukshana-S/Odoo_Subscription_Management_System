import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, saveDb, logAudit } from '../db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import { validatePasswordPolicy, validateEmail, validatePhone } from '../validators/authValidator.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class AuthService {
  // 1. User Registration (Customer Only)
  async signup({ name, email, phone, password, confirmPassword }) {
    if (!name || !email || !password || !confirmPassword) {
      const err = new Error('All required fields (name, email, password, confirmPassword) must be provided.');
      err.statusCode = 400;
      throw err;
    }

    if (password !== confirmPassword) {
      const err = new Error('Password and confirmation password do not match.');
      err.statusCode = 400;
      throw err;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      const err = new Error(emailErr);
      err.statusCode = 400;
      throw err;
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      const err = new Error(phoneErr);
      err.statusCode = 400;
      throw err;
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      const err = new Error(passwordError);
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    // Check uniqueness using existing teammate database structure
    if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      const err = new Error('An account with this corporate email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    // Secure bcrypt hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `USER-${Date.now()}`;
    const customerId = `CUST-${Math.floor(100 + Math.random() * 900)}`;

    const newUser = {
      id: userId,
      name: name.trim().split(' ')[0], // First name
      fullName: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'Customer', // Public signup strictly restricted to Customer
      customerId,
      emailVerified: false,
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    db.users.push(newUser);

    // Generate Email Verification Token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.emailVerificationTokens = db.emailVerificationTokens || [];
    db.emailVerificationTokens.push({
      userId: newUser.id,
      email: newUser.email,
      token: verifyToken,
      expiresAt: tokenExpiry
    });

    saveDb(db);

    logAudit({
      userId: newUser.id,
      email: newUser.email,
      action: 'USER_REGISTRATION',
      details: { role: 'Customer' }
    });

    // Send verification email
    await sendVerificationEmail({
      email: newUser.email,
      name: newUser.name,
      token: verifyToken,
      frontendUrl: FRONTEND_URL
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        customerId: newUser.customerId,
        emailVerified: newUser.emailVerified
      },
      debugVerificationToken: verifyToken
    };
  }

  // 2. User Login
  async login({ email, password, rememberMe, ip }) {
    if (!email || !password) {
      const err = new Error('Please provide corporate email and password.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const err = new Error('Invalid corporate email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logAudit({
        userId: user.id,
        email: user.email,
        action: 'FAILED_LOGIN_ATTEMPT',
        ip
      });
      const err = new Error('Invalid corporate email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (user.accountStatus !== 'Active') {
      const err = new Error('Account has been deactivated. Please contact your system administrator.');
      err.statusCode = 403;
      throw err;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    db.refreshTokens = (db.refreshTokens || []).filter(rt => rt.userId !== user.id);
    db.refreshTokens.push({
      userId: user.id,
      token: refreshToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    user.lastLoginAt = new Date().toISOString();
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'USER_LOGIN_SUCCESS',
      details: { role: user.role },
      ip
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        emailVerified: user.emailVerified,
        avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      }
    };
  }

  // 3. User Logout
  async logout(refreshToken) {
    if (refreshToken) {
      const db = getDb();
      db.refreshTokens = (db.refreshTokens || []).filter(rt => rt.token !== refreshToken);
      saveDb(db);
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  // 4. Token Refresh
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const err = new Error('Refresh token not provided.');
      err.statusCode = 401;
      throw err;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const err = new Error('Invalid or expired refresh token.');
      err.statusCode = 403;
      throw err;
    }

    const db = getDb();
    const tokenRecord = (db.refreshTokens || []).find(rt => rt.token === refreshToken && rt.userId === payload.id);
    if (!tokenRecord) {
      const err = new Error('Refresh token has been revoked.');
      err.statusCode = 403;
      throw err;
    }

    const user = db.users.find(u => u.id === payload.id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    // Refresh Token Rotation
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    tokenRecord.token = newRefreshToken;
    tokenRecord.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    saveDb(db);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  // 5. Change Password (PATCH /api/auth/change-password)
  async changePassword({ userId, currentPassword, newPassword, confirmPassword, ip }) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      const err = new Error('All password fields (currentPassword, newPassword, confirmPassword) are required.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword !== confirmPassword) {
      const err = new Error('New password and confirmation password do not match.');
      err.statusCode = 400;
      throw err;
    }

    if (currentPassword === newPassword) {
      const err = new Error('New password cannot be identical to your current password.');
      err.statusCode = 400;
      throw err;
    }

    const passwordError = validatePasswordPolicy(newPassword);
    if (passwordError) {
      const err = new Error(passwordError);
      err.statusCode = 400;
      throw err;
    }

    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      const err = new Error('Authenticated user account not found.');
      err.statusCode = 404;
      throw err;
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      logAudit({
        userId: user.id,
        email: user.email,
        action: 'CHANGE_PASSWORD_FAILED_INCORRECT_CURRENT',
        ip
      });
      const err = new Error('Current password provided is incorrect.');
      err.statusCode = 400;
      throw err;
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date().toISOString();

    // Invalidate existing sessions and refresh tokens for security
    db.refreshTokens = (db.refreshTokens || []).filter(rt => rt.userId !== user.id);
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'CHANGE_PASSWORD_SUCCESS',
      ip
    });

    return {
      success: true,
      message: 'Password changed successfully. All previous active sessions have been invalidated.'
    };
  }

  // 6. Profile Management
  async getProfile(userId) {
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customerId: user.customerId,
      emailVerified: user.emailVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    };
  }

  async updateProfile({ userId, name, email, phone, ip }) {
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    // If email is changing, enforce format and uniqueness check
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailErr = validateEmail(normalizedEmail);
      if (emailErr) {
        const err = new Error(emailErr);
        err.statusCode = 400;
        throw err;
      }

      const duplicate = db.users.some(u => u.id !== userId && u.email.toLowerCase() === normalizedEmail);
      if (duplicate) {
        const err = new Error('This corporate email address is already in use by another account.');
        err.statusCode = 409;
        throw err;
      }

      user.email = normalizedEmail;
      user.emailVerified = false; // Mark unverified until verified
    }

    if (name) {
      user.name = name.trim().split(' ')[0];
      user.fullName = name.trim();
    }

    if (phone !== undefined) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        const err = new Error(phoneErr);
        err.statusCode = 400;
        throw err;
      }
      user.phone = phone ? phone.trim() : '';
    }

    user.updatedAt = new Date().toISOString();
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'PROFILE_UPDATED',
      ip
    });

    return {
      id: user.id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customerId: user.customerId,
      emailVerified: user.emailVerified,
      accountStatus: user.accountStatus,
      updatedAt: user.updatedAt
    };
  }

  // 7. Forgot Password
  async forgotPassword(email) {
    if (!email) {
      const err = new Error('Email address is required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    // Generic confirmation response to prevent email probing
    if (!user) {
      return {
        message: 'If an account exists with this email, password reset instructions have been dispatched.'
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.passwordResetTokens = (db.passwordResetTokens || []).filter(t => t.email !== normalizedEmail);
    db.passwordResetTokens.push({
      email: normalizedEmail,
      token: resetToken,
      expiresAt
    });
    saveDb(db);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: resetToken,
      frontendUrl: FRONTEND_URL
    });

    return {
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
      debugResetToken: resetToken
    };
  }

  // 8. Reset Password
  async resetPassword({ token, newPassword, confirmNewPassword, ip }) {
    if (!token || !newPassword || !confirmNewPassword) {
      const err = new Error('Reset token, newPassword, and confirmNewPassword are required.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword !== confirmNewPassword) {
      const err = new Error('Passwords do not match.');
      err.statusCode = 400;
      throw err;
    }

    const passwordError = validatePasswordPolicy(newPassword);
    if (passwordError) {
      const err = new Error(passwordError);
      err.statusCode = 400;
      throw err;
    }

    const db = getDb();
    const resetRecord = (db.passwordResetTokens || []).find(t => t.token === token);

    if (!resetRecord) {
      const err = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      throw err;
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      const err = new Error('Password reset token has expired. Please request a new link.');
      err.statusCode = 400;
      throw err;
    }

    const user = db.users.find(u => u.email.toLowerCase() === resetRecord.email.toLowerCase());
    if (!user) {
      const err = new Error('Associated user account not found.');
      err.statusCode = 404;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date().toISOString();

    db.passwordResetTokens = db.passwordResetTokens.filter(t => t.token !== token);
    db.refreshTokens = (db.refreshTokens || []).filter(rt => rt.userId !== user.id);
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'PASSWORD_RESET_SUCCESS',
      ip
    });

    return {
      message: 'Password reset successfully. All compromised sessions have been revoked.'
    };
  }

  // 9. Verify Email
  async verifyEmail(token) {
    if (!token) {
      const err = new Error('Verification token is required.');
      err.statusCode = 400;
      throw err;
    }

    const db = getDb();
    const tokenRecord = (db.emailVerificationTokens || []).find(t => t.token === token);

    if (!tokenRecord) {
      const err = new Error('Invalid email verification token.');
      err.statusCode = 400;
      throw err;
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      const err = new Error('Verification token has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    const user = db.users.find(u => u.id === tokenRecord.userId || u.email.toLowerCase() === tokenRecord.email.toLowerCase());
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();

    db.emailVerificationTokens = db.emailVerificationTokens.filter(t => t.token !== token);
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'EMAIL_VERIFICATION_SUCCESS'
    });

    return {
      message: 'Email address verified successfully. Your client account is fully active.'
    };
  }
}

export default new AuthService();

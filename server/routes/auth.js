import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, saveDb, logAudit } from '../db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  requireAuth
} from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Password Validation Helper: > 8 chars, 1 uppercase, 1 lowercase, 1 special character
const validatePasswordPolicy = (password) => {
  if (!password || password.length <= 8) return 'Password must be greater than 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

// 1. POST /api/auth/signup - Public customer registration only
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, termsAccepted } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation password do not match.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    // Check duplicate email
    if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `USER-${Date.now()}`;
    const customerId = `CUST-${Math.floor(100 + Math.random() * 900)}`;

    // Create user: Public registration creates CUSTOMER ONLY
    const newUser = {
      id: userId,
      name: name.trim().split(' ')[0], // First name priority
      fullName: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'Customer', // strictly enforced
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
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

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
      action: 'USER_SIGNUP',
      details: { role: 'Customer' },
      ip: req.ip
    });

    // Send verification email
    await sendVerificationEmail({
      email: newUser.email,
      name: newUser.name,
      token: verifyToken,
      frontendUrl: FRONTEND_URL
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. A verification link has been sent to your email.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        emailVerified: newUser.emailVerified
      },
      debugVerificationToken: verifyToken // for instant local testing
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid corporate email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logAudit({
        userId: user.id,
        email: user.email,
        action: 'FAILED_LOGIN_ATTEMPT',
        ip: req.ip
      });
      return res.status(401).json({ success: false, message: 'Invalid corporate email or password.' });
    }

    // Check account status
    if (user.accountStatus !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact administrator.' });
    }

    // Generate JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store Refresh Token in DB for rotation & revocation
    db.refreshTokens = db.refreshTokens.filter(rt => rt.userId !== user.id);
    db.refreshTokens.push({
      userId: user.id,
      token: refreshToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'USER_LOGIN_SUCCESS',
      details: { role: user.role },
      ip: req.ip
    });

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
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
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Authentication server error.' });
  }
});

// 3. POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const db = getDb();

    if (refreshToken) {
      db.refreshTokens = db.refreshTokens.filter(rt => rt.token !== refreshToken);
      saveDb(db);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error logging out.' });
  }
});

// 4. POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const db = getDb();
    const tokenRecord = db.refreshTokens.find(rt => rt.token === refreshToken && rt.userId === payload.id);
    if (!tokenRecord) {
      return res.status(403).json({ success: false, message: 'Refresh token has been revoked.' });
    }

    const user = db.users.find(u => u.id === payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Refresh Token Rotation
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    tokenRecord.token = newRefreshToken;
    tokenRecord.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    saveDb(db);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Token refresh failed.' });
  }
});

// 5. POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    // Generic confirmation message to avoid user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

    db.passwordResetTokens = db.passwordResetTokens.filter(t => t.email !== normalizedEmail);
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

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
      debugResetToken: resetToken // for instant local testing
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error processing forgot password request.' });
  }
});

// 6. POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (!token || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const passwordError = validatePasswordPolicy(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const db = getDb();
    const resetRecord = db.passwordResetTokens.find(t => t.token === token);

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Password reset token has expired. Please request a new one.' });
    }

    const user = db.users.find(u => u.email.toLowerCase() === resetRecord.email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated account not found.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date().toISOString();

    // Invalidate reset token & revoke all existing user refresh tokens
    db.passwordResetTokens = db.passwordResetTokens.filter(t => t.token !== token);
    db.refreshTokens = db.refreshTokens.filter(rt => rt.userId !== user.id);
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'PASSWORD_RESET_SUCCESS',
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now login with your new credentials.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

// 7. POST /api/auth/verify-email
router.post('/verify-email', (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const db = getDb();
    const tokenRecord = db.emailVerificationTokens.find(t => t.token === token);

    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: 'Invalid verification token.' });
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired. Please request a new one.' });
    }

    const user = db.users.find(u => u.id === tokenRecord.userId || u.email.toLowerCase() === tokenRecord.email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();

    // Invalidate token
    db.emailVerificationTokens = db.emailVerificationTokens.filter(t => t.token !== token);
    saveDb(db);

    logAudit({
      userId: user.id,
      email: user.email,
      action: 'EMAIL_VERIFIED',
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Email address verified successfully. Your account is fully active.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
});

// 8. GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
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
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
});

export default router;


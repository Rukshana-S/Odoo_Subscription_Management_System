import express from 'express';
import authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. User Registration (Public - Customer Only)
router.post('/signup', authController.signup);

// 2. User Login
router.post('/login', authController.login);

// 3. User Logout
router.post('/logout', authController.logout);

// 4. Token Refresh
router.post('/refresh', authController.refresh);

// 5. Authenticated User Profile
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);

// 6. Change Password (PATCH /api/auth/change-password)
router.patch('/change-password', requireAuth, authController.changePassword);

// 7. Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// 8. Reset Password
router.post('/reset-password', authController.resetPassword);

// 9. Email Verification
router.post('/verify-email', authController.verifyEmail);

export default router;

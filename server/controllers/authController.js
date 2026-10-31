import authService from '../services/authService.js';

class AuthController {
  // POST /api/auth/signup
  async signup(req, res, next) {
    try {
      const data = await authService.signup(req.body);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully. A verification link has been dispatched.',
        ...data
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;
      const data = await authService.login({ email, password, rememberMe, ip: req.ip });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000
      };

      res.cookie('accessToken', data.accessToken, cookieOptions);
      res.cookie('refreshToken', data.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        accessToken: data.accessToken,
        user: data.user
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await authService.logout(refreshToken);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/refresh
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const data = await authService.refreshToken(refreshToken);

      res.cookie('accessToken', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        accessToken: data.accessToken,
        user: data.user
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/auth/me
  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        user
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/auth/profile
  async updateProfile(req, res, next) {
    try {
      const { name, email, phone } = req.body;
      const updatedUser = await authService.updateProfile({
        userId: req.user.id,
        name,
        email,
        phone,
        ip: req.ip
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: updatedUser
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await authService.changePassword({
        userId: req.user.id,
        currentPassword,
        newPassword,
        confirmPassword,
        ip: req.ip
      });

      // Clear cookies since all sessions were invalidated
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword, confirmNewPassword } = req.body;
      const result = await authService.resetPassword({
        token,
        newPassword,
        confirmNewPassword,
        ip: req.ip
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/verify-email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();

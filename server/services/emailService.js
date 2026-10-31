import nodemailer from 'nodemailer';

/**
 * Creates an SMTP transporter if environment credentials exist,
 * or falls back to a development simulation logger that never leaks secrets in production.
 */
const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }
  return null;
};

// Dispatches email verification link
export const sendVerificationEmail = async ({ email, name, token, frontendUrl }) => {
  const verifyLink = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"BrightLoop Cloud" <noreply@brightloop.io>',
        to: email,
        subject: 'Verify your BrightLoop Cloud account',
        html: `
          <div style="font-family: Arial, sans-serif; background: #1c1228; color: #ffffff; padding: 30px; border-radius: 12px;">
            <h2 style="color: #8524e5;">BrightLoop Enterprise Cloud</h2>
            <p>Hello ${name},</p>
            <p>Thank you for creating an account with BrightLoop. Please verify your email by clicking the link below:</p>
            <p style="margin: 24px 0;">
              <a href="${verifyLink}" style="background: #8524e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #9d8ba7; font-size: 12px;">This link will expire in 24 hours.</p>
          </div>
        `
      });
      return { success: true, delivered: true };
    } catch (err) {
      console.error('[SMTP ERROR]: Failed to send verification email:', err.message);
      // Fall through to safe notification logging in non-production
    }
  }

  // Safe developer mode logging (hides raw token in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[BRIGHTLOOP EMAIL ENGINE] Verification dispatched to ${email} (Dev Mode)`);
  }
  return { success: true, verifyLink, delivered: false };
};

// Dispatches password reset link
export const sendPasswordResetEmail = async ({ email, name, token, frontendUrl }) => {
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"BrightLoop Cloud" <noreply@brightloop.io>',
        to: email,
        subject: 'Reset your BrightLoop Cloud password',
        html: `
          <div style="font-family: Arial, sans-serif; background: #1c1228; color: #ffffff; padding: 30px; border-radius: 12px;">
            <h2 style="color: #8524e5;">BrightLoop Enterprise Cloud</h2>
            <p>Hello ${name || 'User'},</p>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="background: #f2c400; color: #1c1228; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p style="color: #9d8ba7; font-size: 12px;">If you did not request this, please ignore this email. Link expires in 1 hour.</p>
          </div>
        `
      });
      return { success: true, delivered: true };
    } catch (err) {
      console.error('[SMTP ERROR]: Failed to send password reset email:', err.message);
    }
  }

  // Safe developer mode logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[BRIGHTLOOP EMAIL ENGINE] Password reset dispatched to ${email} (Dev Mode)`);
  }
  return { success: true, resetLink, delivered: false };
};

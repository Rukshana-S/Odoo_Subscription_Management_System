// Validation utilities for BrightLoop Authentication and Profile management

export const validatePasswordPolicy = (password) => {
  if (!password || password.length <= 8) return 'Password must be greater than 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

export const validateEmail = (email) => {
  if (!email) return 'Email address is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address format';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null; // optional
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    return 'Invalid phone number format. Must contain 10-15 digits';
  }
  return null;
};

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'brightloop_access_secret_default_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'brightloop_refresh_secret_default_key';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      customerId: user.customerId || null
    },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

// Middleware: Authenticate JWT from Cookie or Authorization Header
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
  }

  req.user = payload;
  next();
};

// Middleware: Role Authorization
export const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please authenticate.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' lacks necessary permissions for this resource.`
      });
    }

    next();
  };
};

// Middleware: Ownership & Role Validation to prevent IDOR
export const requireOwnershipOrRole = (allowedRoles = ['Admin', 'Staff']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Admins and Staff bypass customer isolation
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Customer must match the requested customerId or resource owner
    const targetCustomerId = req.params.customerId || req.query.customerId || req.body.customerId;
    if (targetCustomerId && req.user.customerId !== targetCustomerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are restricted to viewing your own customer records.'
      });
    }

    next();
  };
};


/**
 * Authentication Middleware
 * Hotel ECS Backend - JWT verification, role-based access, rate limiting
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Rate limiting store (in production, use Redis)
const requestStore = new Map();
const userStore = new Map();

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Global rate limiter - per IP address
 * 10 requests per minute per IP
 */
const rateLimitByIP = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

/**
 * User-based rate limiter
 * 100 requests per minute per authenticated user
 */
const rateLimitByUser = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: (req, res) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    error: 'User rate limit exceeded, please try again later',
    code: 'USER_RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => {
    // Only apply to authenticated requests
    return !req.user;
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // don't count successful requests
  skipFailedRequests: false // count failed requests
});

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

/**
 * Generate new JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Generate new JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

/**
 * Generate both access and refresh tokens
 */
function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRY
  };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw err;
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// JWT VERIFICATION MIDDLEWARE
// ============================================================================

/**
 * Verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No authorization header provided',
      code: 'NO_AUTH_HEADER'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid authorization header format',
      code: 'INVALID_AUTH_HEADER',
      expected: 'Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyAccessToken(token);

    // Verify token type
    if (decoded.type !== 'access') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Token has expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error during token verification',
      code: 'TOKEN_VERIFICATION_ERROR'
    });
  }
}

/**
 * Optional JWT verification - doesn't fail if token is missing
 */
function optionalJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    req.user = null;
    return next();
  }

  const token = parts[1];

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type === 'access') {
      req.user = decoded;
      req.token = token;
    }
  } catch (err) {
    // Silently ignore token verification errors in optional mode
    console.warn('Optional JWT verification failed:', err.message);
    req.user = null;
  }

  next();
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ============================================================================

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'staff', 'guest'],
  staff: ['staff', 'guest'],
  guest: ['guest']
};

/**
 * Require specific roles
 * Usage: requireRole('admin', 'staff')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No authenticated user',
        code: 'NO_USER'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${userRole}' not in allowed roles`,
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
}

/**
 * Require admin role only
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Require staff or higher (staff, admin)
 */
function requireStaff(req, res, next) {
  return requireRole('admin', 'staff')(req, res, next);
}

/**
 * Check if user can access resource
 * Usage: canAccess('rooms', 'write')
 */
function canAccess(resource, action = 'read') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No authenticated user',
        code: 'NO_USER'
      });
    }

    const permissions = getPermissions(req.user.role);

    if (!permissions[resource]?.[action]) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: No '${action}' permission for resource '${resource}'`,
        code: 'NO_PERMISSION',
        resource,
        action,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Permission matrix for roles
 */
function getPermissions(role) {
  const permissions = {
    admin: {
      rooms: { read: true, write: true, delete: true },
      guests: { read: true, write: true, delete: true },
      users: { read: true, write: true, delete: true },
      audit_logs: { read: true },
      settings: { read: true, write: true }
    },
    staff: {
      rooms: { read: true, write: true },
      guests: { read: true, write: true },
      users: { read: true },
      audit_logs: { read: true }
    },
    guest: {
      rooms: { read: true },
      guests: { read: true }, // only own data
      audit_logs: { read: false }
    }
  };

  return permissions[role] || {};
}

// ============================================================================
// PDPA CONSENT VERIFICATION MIDDLEWARE
// ============================================================================

/**
 * Verify that request includes PDPA consent
 * Used for guest check-in operations
 */
function verifyPDPAConsent(req, res, next) {
  const { pdpa_consent } = req.body;

  if (pdpa_consent !== true) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: PDPA consent is required',
      code: 'PDPA_CONSENT_REQUIRED',
      details: {
        message_th: 'คุณต้องยอมรับนโ���บายความเป็นส่วนตัว (PDPA) เพื่อติดตั้งเข้าห้องพัก',
        message_en: 'You must accept the privacy policy (PDPA) to proceed',
        privacy_policy_url: '/api/privacy-policy'
      }
    });
  }

  next();
}

/**
 * Verify guest has accepted PDPA (stored in database)
 */
function verifyPDPAAcceptance(db) {
  return (req, res, next) => {
    const guestId = req.body.guest_id || req.params.guest_id;

    if (!guestId) {
      return res.status(400).json({
        success: false,
        error: 'Bad request: guest_id required',
        code: 'MISSING_GUEST_ID'
      });
    }

    db.get(
      'SELECT pdpa_consent FROM guests WHERE id = ?',
      [guestId],
      (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Database error',
            code: 'DB_ERROR'
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            error: 'Guest not found',
            code: 'GUEST_NOT_FOUND'
          });
        }

        if (!row.pdpa_consent) {
          return res.status(403).json({
            success: false,
            error: 'Guest has not accepted PDPA',
            code: 'PDPA_NOT_ACCEPTED'
          });
        }

        next();
      }
    );
  };
}

// ============================================================================
// TOKEN REFRESH LOGIC MIDDLEWARE
// ============================================================================

/**
 * Middleware to handle token refresh
 * Checks if token is expiring soon and issues new one
 */
function tokenRefreshMiddleware(req, res, next) {
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const decoded = jwt.decode(req.token);

    if (!decoded || !decoded.exp) {
      return next();
    }

    // Get time until expiry (in seconds)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // If token expires in less than 5 minutes, send new token in response header
    if (timeUntilExpiry < 5 * 60 && timeUntilExpiry > 0) {
      const db = req.app.get('db');

      db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (!err && user) {
          const newTokens = generateTokenPair(user);
          res.set('X-New-Access-Token', newTokens.accessToken);
          res.set('X-New-Refresh-Token', newTokens.refreshToken);
          res.set('X-Token-Expires-In', newTokens.expiresIn);
        }
      });
    }
  } catch (err) {
    console.error('Token refresh middleware error:', err);
  }

  next();
}

/**
 * POST /api/auth/refresh - Endpoint to refresh tokens
 * Accepts refresh token and returns new access token
 */
function refreshTokenHandler(db) {
  return (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad request: refreshToken required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      if (decoded.type !== 'refresh') {
        return res.status(403).json({
          success: false,
          error: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Fetch updated user info from database
      db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
        if (err || !user) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        const tokens = generateTokenPair(user);

        res.json({
          success: true,
          message: 'Tokens refreshed successfully',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        });
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token has expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  };
}

// ============================================================================
// REQUEST CONTEXT MIDDLEWARE
// ============================================================================

/**
 * Attach request metadata to req object
 */
function attachRequestContext(req, res, next) {
  req.requestId = crypto.randomUUID();
  req.requestTime = new Date().toISOString();
  req.requestIP = req.ip;

  // Set headers
  res.set('X-Request-ID', req.requestId);
  res.set('X-Response-Time', new Date().toISOString());

  next();
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Authentication error handler
 */
function authErrorHandler(err, req, res, next) {
  console.error('[AUTH ERROR]', err);

  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      code: 'JWT_ERROR',
      message: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      expiredAt: err.expiredAt
    });
  }

  next(err);
}

// ============================================================================
// EXPORT MIDDLEWARE
// ============================================================================

module.exports = {
  // Rate limiting
  rateLimitByIP,
  rateLimitByUser,
  rateLimitAuth,

  // JWT utilities
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,

  // JWT middleware
  verifyJWT,
  optionalJWT,

  // RBAC middleware
  requireRole,
  requireAdmin,
  requireStaff,
  canAccess,
  getPermissions,

  // PDPA middleware
  verifyPDPAConsent,
  verifyPDPAAcceptance,

  // Token refresh
  tokenRefreshMiddleware,
  refreshTokenHandler,

  // Request context
  attachRequestContext,

  // Error handling
  authErrorHandler
};

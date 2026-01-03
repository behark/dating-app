/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

const crypto = require('crypto');

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string} - Random CSRF token
 */
const generateToken = () => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * CSRF Protection Middleware
 * Uses Double Submit Cookie pattern:
 * 1. Server sends a CSRF token in both a cookie and response
 * 2. Client must send the token back in both cookie and header
 * 3. Server verifies both tokens match
 */
const csrfProtection = (options = {}) => {
  const {
    cookieName = CSRF_COOKIE_NAME,
    headerName = CSRF_HEADER_NAME,
    cookieOptions = {},
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths = []
  } = options;

  return (req, res, next) => {
    // Skip CSRF check for safe methods
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Skip CSRF check for ignored paths
    if (ignorePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip for API requests with Bearer token (JWT auth)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Get token from cookie and header
    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.headers[headerName.toLowerCase()];

    // If no tokens exist, generate a new one
    if (!cookieToken) {
      const newToken = generateToken();
      res.cookie(cookieName, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        ...cookieOptions
      });
      
      // For first request, allow through but set token
      if (!headerToken) {
        req.csrfToken = () => newToken;
        return next();
      }
    }

    // Validate tokens match
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
        code: 'CSRF_VALIDATION_FAILED'
      });
    }

    // Tokens match, proceed
    req.csrfToken = () => cookieToken;
    next();
  };
};

/**
 * Middleware to generate and send CSRF token
 * Call this on routes that render forms or need fresh tokens
 */
const generateCsrfToken = (req, res, next) => {
  const token = generateToken();
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  req.csrfToken = () => token;
  res.locals.csrfToken = token;
  
  next();
};

/**
 * Route handler to get a fresh CSRF token
 */
const getCsrfToken = (req, res) => {
  const token = generateToken();
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({
    success: true,
    csrfToken: token
  });
};

module.exports = {
  csrfProtection,
  generateCsrfToken,
  getCsrfToken,
  generateToken
};

const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  deleteAccount,
  refreshToken,
  googleAuth,
  facebookAuth,
  appleAuth,
} = require('../controllers/authController');
const {
  sendPhoneVerification,
  verifyPhone,
  resendPhoneVerification,
} = require('../controllers/phoneController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // @ts-ignore - express-validator union type handling
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => {
        if ('path' in err) {
          return { field: err.path, message: err.msg };
        }
        return { field: 'unknown', message: err.msg };
      }),
    });
  }
  next();
};

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('age').optional().isInt({ min: 18, max: 100 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ],
  handleValidationErrors,
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// Verify Email
router.post(
  '/verify-email',
  [body('token').notEmpty().withMessage('Token is required')],
  handleValidationErrors,
  verifyEmail
);

// Forgot Password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  handleValidationErrors,
  forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  handleValidationErrors,
  resetPassword
);

// Refresh Token
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  handleValidationErrors,
  refreshToken
);

// Logout
router.post('/logout', authenticate, logout);

// Delete Account
router.delete('/delete-account', authenticate, deleteAccount);

// OAuth routes
router.post(
  '/google',
  [
    body('googleId').notEmpty().withMessage('Google ID is required'),
    body('email').isEmail().normalizeEmail(),
  ],
  handleValidationErrors,
  googleAuth
);

router.post(
  '/facebook',
  [
    body('facebookId').notEmpty().withMessage('Facebook ID is required'),
    body('email').isEmail().normalizeEmail(),
  ],
  handleValidationErrors,
  facebookAuth
);

router.post(
  '/apple',
  [body('appleId').notEmpty().withMessage('Apple ID is required')],
  handleValidationErrors,
  appleAuth
);

// OAuth configuration status endpoint
// Returns which OAuth providers are properly configured
router.get('/oauth-status', (req, res) => {
  const { checkOAuthConfig } = require('../utils/oauthVerifier');

  const googleConfig = checkOAuthConfig('google');
  const facebookConfig = checkOAuthConfig('facebook');
  const appleConfig = checkOAuthConfig('apple');

  res.json({
    success: true,
    data: {
      google: {
        configured: googleConfig.configured,
        available: googleConfig.configured,
      },
      facebook: {
        configured: facebookConfig.configured,
        available: facebookConfig.configured,
      },
      apple: {
        configured: appleConfig.configured,
        available: appleConfig.configured,
      },
    },
  });
});

// Phone verification routes
router.post(
  '/send-phone-verification',
  authenticate,
  [body('phoneNumber').notEmpty().withMessage('Phone number is required')],
  handleValidationErrors,
  sendPhoneVerification
);

router.post(
  '/verify-phone',
  authenticate,
  [body('code').notEmpty().withMessage('Verification code is required')],
  handleValidationErrors,
  verifyPhone
);

router.post('/resend-phone-verification', authenticate, resendPhoneVerification);

module.exports = router;

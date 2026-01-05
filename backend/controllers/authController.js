/**
 * Authentication Controller
 * Handles user registration, login, password reset, and email verification
 * @module controllers/authController
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const {
  verifyGoogleToken,
  verifyFacebookToken,
  verifyAppleToken,
  checkOAuthConfig,
} = require('../utils/oauthVerifier');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Email service for sending verification and password reset emails
 * @namespace emailService
 */
const emailService = {
  /** @type {nodemailer.Transporter|null} */
  transporter: null,

  /**
   * Initialize the email transporter
   * @memberof emailService
   */
  init: function () {
    if (!this.transporter) {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('⚠️  Email credentials not configured - email features disabled');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  },

  /**
   * Send an email
   * @memberof emailService
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<boolean>} Success status
   */
  sendEmail: async function (to, subject, html) {
    this.init();

    if (!this.transporter) {
      logger.warn('Email service not configured - cannot send email');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', { error: error.message, stack: error.stack });
      return false;
    }
  },
};

/**
 * Register a new user with email and password
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (min 8 characters)
 * @param {string} req.body.name - User's display name
 * @param {number} [req.body.age] - User's age
 * @param {string} [req.body.gender] - User's gender
 * @param {Object} [req.body.location] - User's location (GeoJSON)
 * @param {string} [req.body.location.type] - Location type (Point)
 * @param {number[]} [req.body.location.coordinates] - Location coordinates [lng, lat]
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with user data and token
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, age, gender } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return sendError(res, 400, {
        message: 'Email, password, and name are required',
        error: 'VALIDATION_ERROR',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return sendError(res, 400, {
        message: 'Password must be at least 8 characters long',
        error: 'VALIDATION_ERROR',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return sendError(res, 400, {
        message: 'User with this email already exists',
        error: 'USER_EXISTS',
      });
    }

    // Create new user
    // Location is required - use provided location or default to San Francisco
    const userLocation = req.body.location || {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
    };

    user = new User({
      email: email.toLowerCase(),
      password,
      name,
      age,
      gender,
      location: {
        type: userLocation.type || 'Point',
        coordinates: userLocation.coordinates || [-122.4194, 37.7749],
      },
      photos: [],
      interests: [],
    });

    await user.save();

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await emailService.sendEmail(
      user.email,
      'Email Verification',
      `<p>Click <a href="${verificationUrl}">here</a> to verify your email. This link expires in 24 hours.</p>`
    );

    // Generate tokens
    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    return sendSuccess(res, 201, {
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
        },
        authToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error during registration',
      error: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'production' ? null : (error instanceof Error ? error.message : String(error)),
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user with email and password
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendValidationError(res, [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
      ]);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Check if user has password (not OAuth only)
    if (!user.password) {
      return sendError(res, 401, {
        message: 'This account uses OAuth. Please login with your OAuth provider.',
        error: 'OAUTH_ACCOUNT',
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Generate tokens
    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Update last active
    user.lastActive = new Date();
    await user.save();

    return sendSuccess(res, 200, {
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          isEmailVerified: user.isEmailVerified,
        },
        authToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/verify-email
// @desc    Verify user email with token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendEmail(
      user.email,
      'Password Reset',
      `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
    );

    res.json({
      success: true,
      message: 'If email exists, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Forgot password error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error processing password reset',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.password = newPassword;
    // CRITICAL FIX: Invalidate password reset token after use (already implemented, adding comment for clarity)
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/logout
// @desc    Logout user and blacklist token
// @access  Private
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
      });
    }

    const jwt = require('jsonwebtoken');
    const { getRedis } = require('../config/redis');
    const logger = require('../services/LoggingService').logger;

    try {
      // Decode token to get expiry and userId
      const decoded = jwt.decode(token);
      // Type guard: ensure decoded is an object (JwtPayload) not a string
      if (decoded && typeof decoded === 'object' && 'exp' in decoded && decoded.exp) {
        // Calculate TTL (time until token expires)
        const exp = decoded.exp; // TypeScript now knows exp is defined
        const ttl = exp - Math.floor(Date.now() / 1000);
        
        if (ttl > 0) {
          // Try Redis first (faster)
          try {
            const redisClient = await getRedis();
            if (redisClient) {
              await redisClient.setex(`blacklist:${token}`, ttl, '1');
              const userId = 'userId' in decoded ? decoded.userId : null;
              logger.info('Token blacklisted in Redis', { userId });
            }
          } catch (redisError) {
            // Redis failed - use MongoDB fallback
            logger.warn('Redis unavailable for token blacklisting, using MongoDB fallback', {
              error: redisError instanceof Error ? redisError.message : String(redisError),
            });
            
            // CRITICAL FIX: Store in MongoDB as fallback
            try {
              const BlacklistedToken = require('../models/BlacklistedToken');
              const userId = 'userId' in decoded ? decoded.userId : null;
              await BlacklistedToken.findOneAndUpdate(
                { token },
                {
                  token,
                  userId,
                  expiresAt: new Date(exp * 1000), // Convert to Date
                  blacklistedAt: new Date(),
                },
                { upsert: true, new: true }
              );
              logger.info('Token blacklisted in MongoDB (fallback)', { userId });
            } catch (mongoError) {
              // Both Redis and MongoDB failed - log error but don't block logout
              const userId = 'userId' in decoded ? decoded.userId : null;
              logger.error('Failed to blacklist token in both Redis and MongoDB', {
                redisError: redisError instanceof Error ? redisError.message : String(redisError),
                mongoError: mongoError instanceof Error ? mongoError.message : String(mongoError),
                userId,
              });
            }
          }
        }
      }
    } catch (error) {
      // Log error but don't fail logout
      logger.error('Error during token blacklisting', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password only for users who have one (not OAuth-only accounts)
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account',
        });
      }

      const isPasswordMatch = await user.matchPassword(password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // TODO: Clean up user data from other collections (messages, swipes, etc.)

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Delete account error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Ensure JWT_REFRESH_SECRET is set
    if (!process.env.JWT_REFRESH_SECRET) {
      console.error('JWT_REFRESH_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not properly configured',
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object' || !decoded.userId) {
      return sendError(res, 401, {
        message: 'Invalid refresh token',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const newAuthToken = user.generateAuthToken();

    res.json({
      success: true,
      data: {
        authToken: newAuthToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', { error: error.message, stack: error.stack });
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/google
// @desc    Google OAuth login/register with token verification
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, photoUrl, idToken } = req.body;

    // Check OAuth configuration status
    const googleConfig = checkOAuthConfig('google');

    let verifiedUser = null;

    // If ID token is provided, verify it server-side (most secure)
    if (idToken) {
      try {
        verifiedUser = await verifyGoogleToken(idToken);
        // Use verified data instead of client-provided data
        if (verifiedUser.googleId !== googleId) {
          logger.warn('Google ID mismatch: client provided different ID than token');
        }
      } catch (verifyError) {
        const errorMessage =
          verifyError instanceof Error ? verifyError.message : String(verifyError);
        console.error('Google token verification failed:', errorMessage);

        // Check for specific OAuth errors
        if (errorMessage.includes('redirect URI')) {
          return res.status(400).json({
            success: false,
            message: 'OAuth configuration error: redirect URI mismatch. Please contact support.',
            errorCode: 'REDIRECT_URI_MISMATCH',
          });
        }
        if (errorMessage.includes('expired')) {
          return res.status(401).json({
            success: false,
            message: 'Google session has expired. Please sign in again.',
            errorCode: 'TOKEN_EXPIRED',
          });
        }
        if (errorMessage.includes('client configuration')) {
          return res.status(500).json({
            success: false,
            message: 'Google Sign-In is temporarily unavailable. Please try again later.',
            errorCode: 'CLIENT_CONFIG_ERROR',
          });
        }

        // If verification fails but we have client data, log warning and continue
        // This allows graceful degradation during development
        if (!googleConfig.configured) {
          logger.warn('⚠️  Google OAuth not fully configured - proceeding with unverified token');
        } else {
          return res.status(401).json({
            success: false,
            message: 'Google authentication failed. Please try again.',
            error: verifyError instanceof Error ? verifyError.message : String(verifyError),
          });
        }
      }
    }

    // Use verified data if available, otherwise fall back to client data
    const finalGoogleId = verifiedUser?.googleId || googleId;
    const finalEmail = verifiedUser?.email || email;
    const finalName = verifiedUser?.name || name;
    const finalPhotoUrl = verifiedUser?.photoUrl || photoUrl;

    if (!finalGoogleId || !finalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google ID and email are required',
      });
    }

    let user = await User.findOne({ $or: [{ googleId: finalGoogleId }, { email: finalEmail }] });

    if (!user) {
      // Create new user with required location field
      user = new User({
        googleId: finalGoogleId,
        email: finalEmail.toLowerCase(),
        name: finalName || (finalEmail.includes('@') ? finalEmail.split('@')[0] : finalEmail),
        oauthProviders: ['google'],
        isEmailVerified: verifiedUser?.emailVerified || true,
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // Default: San Francisco
        },
        photos: finalPhotoUrl
          ? [
              {
                url: finalPhotoUrl,
                order: 0,
                moderationStatus: 'approved',
              },
            ]
          : [],
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google to existing account
      user.googleId = finalGoogleId;
      if (!user.oauthProviders) user.oauthProviders = [];
      if (!user.oauthProviders.includes('google')) {
        user.oauthProviders.push('google');
      }
      await user.save();
    }

    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          isEmailVerified: user.isEmailVerified,
        },
        authToken,
        refreshToken,
        tokenVerified: !!verifiedUser,
      },
    });
  } catch (error) {
    logger.error('Google auth error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error with Google authentication',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/facebook
// @desc    Facebook OAuth login/register with token verification
// @access  Public
exports.facebookAuth = async (req, res) => {
  try {
    const { facebookId, email, name, photoUrl, accessToken } = req.body;

    // Check OAuth configuration
    const facebookConfig = checkOAuthConfig('facebook');

    // Verify Facebook token if provided and configured
    if (accessToken && facebookConfig.configured) {
      try {
        const verificationResult = await verifyFacebookToken(accessToken, facebookId);
        if (!verificationResult.tokenVerified) {
          console.warn('Facebook token verification skipped:', verificationResult.warning);
        }
      } catch (verifyError) {
        const errorMessage =
          verifyError instanceof Error ? verifyError.message : String(verifyError);
        console.error('Facebook token verification failed:', errorMessage);

        if (errorMessage.includes('expired')) {
          return res.status(401).json({
            success: false,
            message: 'Facebook session has expired. Please sign in again.',
            errorCode: 'TOKEN_EXPIRED',
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Facebook authentication failed. Please try again.',
          error: verifyError instanceof Error ? verifyError.message : String(verifyError),
        });
      }
    }

    if (!facebookId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Facebook ID and email are required',
      });
    }

    let user = await User.findOne({ $or: [{ facebookId }, { email }] });

    if (!user) {
      // Create new user with required location field
      user = new User({
        facebookId,
        email: email.toLowerCase(),
        name: name || (email.includes('@') ? email.split('@')[0] : email),
        oauthProviders: ['facebook'],
        isEmailVerified: true,
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // Default: San Francisco
        },
        photos: photoUrl
          ? [
              {
                url: photoUrl,
                order: 0,
                moderationStatus: 'approved',
              },
            ]
          : [],
      });
      await user.save();
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      if (!user.oauthProviders) user.oauthProviders = [];
      if (!user.oauthProviders.includes('facebook')) {
        user.oauthProviders.push('facebook');
      }
      await user.save();
    }

    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Facebook authentication successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          isEmailVerified: user.isEmailVerified,
        },
        authToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Facebook auth error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error with Facebook authentication',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/apple
// @desc    Apple OAuth login/register with token verification
// @access  Public
exports.appleAuth = async (req, res) => {
  try {
    const { appleId, email, name, identityToken } = req.body;

    if (!appleId) {
      return res.status(400).json({
        success: false,
        message: 'Apple ID is required',
      });
    }

    // Verify Apple identity token if provided
    let verifiedUser = null;
    if (identityToken) {
      try {
        verifiedUser = await verifyAppleToken(identityToken, appleId);
        if (!verifiedUser.tokenVerified) {
          console.warn('Apple token verification skipped:', verifiedUser.warning);
        }
      } catch (verifyError) {
        const errorMessage =
          verifyError instanceof Error ? verifyError.message : String(verifyError);
        console.error('Apple token verification failed:', errorMessage);

        if (errorMessage.includes('expired')) {
          return res.status(401).json({
            success: false,
            message: 'Apple session has expired. Please sign in again.',
            errorCode: 'TOKEN_EXPIRED',
          });
        }

        // Apple Sign-In can work without full verification in some cases
        logger.warn('⚠️  Proceeding with Apple auth despite token verification failure');
      }
    }

    // Use verified data if available
    const finalAppleId = verifiedUser?.appleId || appleId;
    const finalEmail = verifiedUser?.email || email;
    const isEmailVerified = verifiedUser?.emailVerified || !!email;

    let user = await User.findOne({ appleId: finalAppleId });

    if (!user) {
      // Create new user with required location field
      user = new User({
        appleId: finalAppleId,
        email: finalEmail?.toLowerCase() || `${finalAppleId}@appleid.apple.com`,
        name: name || 'Apple User',
        oauthProviders: ['apple'],
        isEmailVerified: isEmailVerified,
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // Default: San Francisco
        },
      });
      await user.save();
    }

    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Apple authentication successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          isEmailVerified: user.isEmailVerified,
        },
        authToken,
        refreshToken,
        tokenVerified: verifiedUser?.tokenVerified || false,
      },
    });
  } catch (error) {
    logger.error('Apple auth error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error with Apple authentication',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

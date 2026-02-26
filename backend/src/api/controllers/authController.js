/**
 * Authentication Controller
 * Handles user registration, login, password reset, and email verification
 * @module controllers/authController
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../../core/domain/User');
const {
  verifyGoogleToken,
  verifyFacebookToken,
  verifyAppleToken,
  checkOAuthConfig,
} = require('../../shared/utils/oauthVerifier');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');
const { logger } = require('../../infrastructure/external/LoggingService');

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
    } catch (/** @type {any} */ error) {
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
  } catch (/** @type {any} */ error) {
    logger.error('Registration error:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error during registration',
      error: 'REGISTRATION_ERROR',
      details:
        process.env.NODE_ENV === 'production'
          ? null
          : error instanceof Error
            ? error.message
            : String(error),
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
  } catch (/** @type {any} */ error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
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
      return sendError(res, 400, { message: 'Verification token is required' });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 400, { message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    return sendSuccess(res, 200, {
      message: 'Email verified successfully',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Email verification error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendError(res, 400, { message: 'Email is required' });
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
  } catch (/** @type {any} */ error) {
    logger.error('Forgot password error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendError(res, 400, { message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return sendError(res, 400, { message: 'Password must be at least 8 characters long' });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 400, { message: 'Invalid or expired reset token' });
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
  } catch (/** @type {any} */ error) {
    logger.error('Reset password error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendError(res, 400, { message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const { getRedis } = require('../../config/redis');
    const logger = require('../../infrastructure/external/LoggingService').logger;

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
          } catch (/** @type {any} */ redisError) {
            // Redis failed - use MongoDB fallback
            logger.warn('Redis unavailable for token blacklisting, using MongoDB fallback', {
              error: redisError instanceof Error ? redisError.message : String(redisError),
            });

            // CRITICAL FIX: Store in MongoDB as fallback
            try {
              const BlacklistedToken = require('../../core/domain/BlacklistedToken');
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
            } catch (/** @type {any} */ mongoError) {
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
    } catch (/** @type {any} */ error) {
      // Log error but don't fail logout
      logger.error('Error during token blacklisting', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Logout error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendNotFound(res, 'User', userId);
    }

    // Verify password only for users who have one (not OAuth-only accounts)
    if (user.password) {
      if (!password) {
        return sendError(res, 400, { message: 'Password is required to delete account' });
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

    // Clean up user data from related collections
    const cleanupPromises = [];

    try {
      const Message = require('../../core/domain/Message');
      const Swipe = require('../../core/domain/Swipe');
      const Match = require('../../core/domain/Match');
      const Notification = require('../../core/domain/Notification');
      const Report = require('../../core/domain/Report');
      const Block = require('../../core/domain/Block');
      const Subscription = require('../../core/domain/Subscription');
      const SuperLike = require('../../core/domain/SuperLike');
      const BoostProfile = require('../../core/domain/BoostProfile');
      const UserActivity = require('../../core/domain/UserActivity');

      // Delete user's messages
      cleanupPromises.push(
        Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] })
      );

      // Delete user's swipes
      cleanupPromises.push(Swipe.deleteMany({ $or: [{ swiperId: userId }, { swipedId: userId }] }));

      // Delete user's matches
      cleanupPromises.push(Match.deleteMany({ users: userId }));

      // Delete user's notifications
      cleanupPromises.push(Notification.deleteMany({ userId }));

      // Delete reports filed by or against the user
      cleanupPromises.push(
        Report.deleteMany({ $or: [{ reporterId: userId }, { reportedUserId: userId }] })
      );

      // Delete blocks involving the user
      cleanupPromises.push(
        Block.deleteMany({ $or: [{ blockerId: userId }, { blockedUserId: userId }] })
      );

      // Delete subscription
      cleanupPromises.push(Subscription.deleteOne({ userId }));

      // Delete super likes
      cleanupPromises.push(
        SuperLike.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] })
      );

      // Delete boost profiles
      cleanupPromises.push(BoostProfile.deleteMany({ userId }));

      // Delete user activity logs
      cleanupPromises.push(UserActivity.deleteMany({ userId }));

      // Execute all cleanup operations
      await Promise.allSettled(cleanupPromises);

      logger.info('User data cleanup completed', { userId });
    } catch (/** @type {any} */ cleanupError) {
      // Log but don't fail the deletion - user is already deleted
      logger.error('Error during user data cleanup', {
        userId,
        error: cleanupError.message,
      });
    }

    return sendSuccess(res, 200, {
      message: 'Account deleted successfully',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Delete account error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendError(res, 400, { message: 'Refresh token is required' });
    }

    // Ensure JWT_REFRESH_SECRET is set
    if (!process.env.JWT_REFRESH_SECRET) {
      logger.error('JWT_REFRESH_SECRET is not configured');
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
    const newRefreshToken = user.generateRefreshToken();

    res.json({
      success: true,
      data: {
        authToken: newAuthToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Refresh token error:', { error: error.message, stack: error.stack });
    sendError(res, 401, {
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
    const { googleId, email, idToken } = req.body;

    // Check OAuth configuration status
    const googleConfig = checkOAuthConfig('google');
    if (!googleConfig.configured) {
      return res.status(503).json({
        success: false,
        message: 'Google Sign-In is temporarily unavailable. Please try again later.',
        errorCode: 'CLIENT_CONFIG_ERROR',
      });
    }

    if (!idToken) {
      return sendError(res, 400, { message: 'Google ID token is required' });
    }

    let verifiedUser;
    try {
      verifiedUser = await verifyGoogleToken(idToken);
    } catch (/** @type {any} */ verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error('Google token verification failed:', errorMessage);

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
        return res.status(503).json({
          success: false,
          message: 'Google Sign-In is temporarily unavailable. Please try again later.',
          errorCode: 'CLIENT_CONFIG_ERROR',
        });
      }

      return sendError(res, 401, {
        message: 'Google authentication failed. Please try again.',
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
    }

    if (googleId && verifiedUser.googleId !== googleId) {
      return sendError(res, 401, { message: 'Google ID mismatch in authentication payload' });
    }
    if (email && verifiedUser.email && verifiedUser.email.toLowerCase() !== email.toLowerCase()) {
      return sendError(res, 401, { message: 'Google email mismatch in authentication payload' });
    }

    const finalGoogleId = verifiedUser.googleId;
    const finalEmail = verifiedUser.email;
    const finalName = verifiedUser.name;
    const finalPhotoUrl = verifiedUser.photoUrl;

    if (!finalGoogleId || !finalEmail) {
      return sendError(res, 400, { message: 'Google ID and email are required' });
    }

    let user = await User.findOne({ $or: [{ googleId: finalGoogleId }, { email: finalEmail }] });

    if (!user) {
      // Create new user with required location field
      user = new User({
        googleId: finalGoogleId,
        email: finalEmail.toLowerCase(),
        name: finalName || (finalEmail.includes('@') ? finalEmail.split('@')[0] : finalEmail),
        oauthProviders: ['google'],
        isEmailVerified: !!verifiedUser.emailVerified,
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
        tokenVerified: true,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Google auth error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
    if (!facebookConfig.configured) {
      return res.status(503).json({
        success: false,
        message: 'Facebook Sign-In is temporarily unavailable. Please try again later.',
        errorCode: 'CLIENT_CONFIG_ERROR',
      });
    }
    if (!accessToken) {
      return sendError(res, 400, { message: 'Facebook access token is required' });
    }

    let verificationResult;
    try {
      verificationResult = await verifyFacebookToken(accessToken, facebookId);
    } catch (/** @type {any} */ verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error('Facebook token verification failed:', errorMessage);

      if (errorMessage.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Facebook session has expired. Please sign in again.',
          errorCode: 'TOKEN_EXPIRED',
        });
      }
      if (errorMessage.includes('client configuration')) {
        return res.status(503).json({
          success: false,
          message: 'Facebook Sign-In is temporarily unavailable. Please try again later.',
          errorCode: 'CLIENT_CONFIG_ERROR',
        });
      }

      return sendError(res, 401, {
        message: 'Facebook authentication failed. Please try again.',
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
    }

    const verifiedFacebookId = verificationResult.facebookId;
    const verifiedEmail = verificationResult.email ? verificationResult.email.toLowerCase() : null;
    const verifiedName = verificationResult.name;
    const verifiedPhotoUrl = verificationResult.photoUrl;

    if (email && verifiedEmail && email.toLowerCase() !== verifiedEmail) {
      return sendError(res, 401, { message: 'Facebook email mismatch in authentication payload' });
    }

    let user = await User.findOne({ facebookId: verifiedFacebookId });
    if (!user && verifiedEmail) {
      user = await User.findOne({ email: verifiedEmail });
    }

    if (!user) {
      if (!verifiedEmail) {
        return sendError(res, 400, {
          message:
            'Facebook account did not provide an email. Please grant email permission and try again.',
        });
      }

      // Create new user with required location field
      user = new User({
        facebookId: verifiedFacebookId,
        email: verifiedEmail,
        name:
          verifiedName ||
          name ||
          (verifiedEmail.includes('@') ? verifiedEmail.split('@')[0] : 'Facebook User'),
        oauthProviders: ['facebook'],
        isEmailVerified: true,
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // Default: San Francisco
        },
        photos:
          verifiedPhotoUrl || photoUrl
            ? [
                {
                  url: verifiedPhotoUrl || photoUrl,
                  order: 0,
                  moderationStatus: 'approved',
                },
              ]
            : [],
      });
      await user.save();
    } else if (!user.facebookId) {
      user.facebookId = verifiedFacebookId;
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
  } catch (/** @type {any} */ error) {
    logger.error('Facebook auth error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
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
      return sendError(res, 400, { message: 'Apple ID is required' });
    }
    if (!identityToken) {
      return sendError(res, 400, { message: 'Apple identity token is required' });
    }

    const appleConfig = checkOAuthConfig('apple');
    if (!appleConfig.configured) {
      return res.status(503).json({
        success: false,
        message: 'Apple Sign-In is temporarily unavailable. Please try again later.',
        errorCode: 'CLIENT_CONFIG_ERROR',
      });
    }

    let verifiedUser;
    try {
      verifiedUser = await verifyAppleToken(identityToken, appleId);
    } catch (/** @type {any} */ verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error('Apple token verification failed:', errorMessage);

      if (errorMessage.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Apple session has expired. Please sign in again.',
          errorCode: 'TOKEN_EXPIRED',
        });
      }
      if (errorMessage.includes('client configuration')) {
        return res.status(503).json({
          success: false,
          message: 'Apple Sign-In is temporarily unavailable. Please try again later.',
          errorCode: 'CLIENT_CONFIG_ERROR',
        });
      }

      return sendError(res, 401, {
        message: 'Apple authentication failed. Please try again.',
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
    }

    if (email && verifiedUser.email && email.toLowerCase() !== verifiedUser.email.toLowerCase()) {
      return sendError(res, 401, { message: 'Apple email mismatch in authentication payload' });
    }

    const finalAppleId = verifiedUser.appleId;
    const finalEmail = verifiedUser.email ? verifiedUser.email.toLowerCase() : null;
    const isEmailVerified = !!verifiedUser.emailVerified;

    let user = await User.findOne({ appleId: finalAppleId });
    if (!user && finalEmail) {
      user = await User.findOne({ email: finalEmail });
    }

    if (!user) {
      // Create new user with required location field
      user = new User({
        appleId: finalAppleId,
        email: finalEmail || `${finalAppleId}@appleid.apple.com`,
        name: name || 'Apple User',
        oauthProviders: ['apple'],
        isEmailVerified,
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749], // Default: San Francisco
        },
      });
      await user.save();
    } else if (!user.appleId) {
      user.appleId = finalAppleId;
      if (!user.oauthProviders) user.oauthProviders = [];
      if (!user.oauthProviders.includes('apple')) {
        user.oauthProviders.push('apple');
      }
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
        tokenVerified: true,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Apple auth error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error with Apple authentication',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

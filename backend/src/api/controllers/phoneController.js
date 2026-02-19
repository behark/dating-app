const crypto = require('crypto');
const { logger } = require('../../infrastructure/external/LoggingService');
const User = require('../../core/domain/User');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');

/**
 * SMS Service - Twilio integration with fallback for development
 * Configure Twilio credentials in environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */
const smsService = {
  /** @type {any} */
  client: null,

  /**
   * Initialize Twilio client if credentials are available
   */
  init: function () {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        logger.info('Twilio SMS service initialized');
      } catch (/** @type {any} */ error) {
        logger.warn('Twilio not available, using mock SMS service', { error: error.message });
      }
    } else {
      logger.warn('Twilio credentials not configured, using mock SMS service');
    }
  },

  /**
   * Send SMS verification code
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} code - Verification code to send
   * @returns {Promise<boolean>} - Success status
   */
  sendSMS: async function (phoneNumber, code) {
    const message = `Your dating app verification code is: ${code}. Valid for 15 minutes.`;

    // Use Twilio if configured
    if (this.client && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await this.client.messages.create({
          body: message,
          to: phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
        });
        logger.info('SMS sent via Twilio', { phoneNumber: phoneNumber.slice(-4) }); // Log last 4 digits only
        return true;
      } catch (/** @type {any} */ error) {
        logger.error('Twilio SMS send failed', { error: error.message, code: error.code });
        throw new Error('Failed to send SMS verification');
      }
    }

    // Development fallback - log the code (DO NOT USE IN PRODUCTION)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('DEV MODE: SMS verification code', {
        phoneLastFour: phoneNumber.slice(-4),
        code,
      });
      return true;
    }

    // Production without Twilio configured
    logger.error('SMS service not configured in production');
    throw new Error('SMS service not configured');
  },
};

// Initialize SMS service on module load
smsService.init();

// @route   POST /api/auth/send-phone-verification
// @desc    Send phone verification code
// @access  Private
exports.sendPhoneVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return sendError(res, 400, { message: 'Phone number is required' });
    }

    // Validate phone number format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ''))) {
      return sendError(res, 400, { message: 'Invalid phone number format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if phone number is already taken by another user
    if (phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return sendError(res, 400, { message: 'Phone number already in use' });
      }
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with verification code
    user.phoneNumber = phoneNumber;
    user.phoneVerificationCode = verificationCode;
    user.phoneVerificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send SMS
    await smsService.sendSMS(phoneNumber, verificationCode);

    res.json({
      success: true,
      message: 'Verification code sent to phone number',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Send phone verification error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error sending verification code',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number with code
// @access  Private
exports.verifyPhone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code } = req.body;

    if (!code) {
      return sendError(res, 400, { message: 'Verification code is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check verification code
    if (user.phoneVerificationCode !== code) {
      return sendError(res, 400, { message: 'Invalid verification code' });
    }

    // Check code expiry
    if (user.phoneVerificationCodeExpiry && new Date() > user.phoneVerificationCodeExpiry) {
      return sendError(res, 400, { message: 'Verification code has expired' });
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationCodeExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Verify phone error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error verifying phone',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/auth/resend-phone-verification
// @desc    Resend phone verification code
// @access  Private
exports.resendPhoneVerification = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.phoneNumber) {
      return sendError(res, 400, { message: 'Phone number not set' });
    }

    // Check if user requested code too recently (cooldown)
    if (
      user.phoneVerificationCodeExpiry &&
      new Date(user.phoneVerificationCodeExpiry.getTime() - 15 * 60 * 1000).getTime() > Date.now()
    ) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new code',
      });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneVerificationCode = verificationCode;
    user.phoneVerificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send SMS
    await smsService.sendSMS(user.phoneNumber, verificationCode);

    res.json({
      success: true,
      message: 'Verification code resent',
    });
  } catch (/** @type {any} */ error) {
    logger.error('Resend phone verification error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error resending verification code',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

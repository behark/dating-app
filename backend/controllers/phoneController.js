const User = require('../models/User');
const crypto = require('crypto');

// Initialize SMS service (using Twilio as an example)
const smsService = {
  sendSMS: async function (phoneNumber, code) {
    // TODO: Implement SMS sending with Twilio or another provider
    // For now, this is a placeholder
    console.log(`Sending SMS to ${phoneNumber}: Your verification code is ${code}`);
    return true;
  },
};

// @route   POST /api/auth/send-phone-verification
// @desc    Send phone verification code
// @access  Private
exports.sendPhoneVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Validate phone number format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
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
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use',
        });
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
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification code',
      error: error.message,
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
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
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
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Check code expiry
    if (new Date() > user.phoneVerificationCodeExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired',
      });
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
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying phone',
      error: error.message,
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
      return res.status(400).json({
        success: false,
        message: 'Phone number not set',
      });
    }

    // Check if user requested code too recently (cooldown)
    if (
      user.phoneVerificationCodeExpiry &&
      new Date(user.phoneVerificationCodeExpiry.getTime() - 15 * 60 * 1000) > Date.now()
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
  } catch (error) {
    console.error('Resend phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification code',
      error: error.message,
    });
  }
};

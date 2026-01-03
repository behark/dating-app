/**
 * Privacy Controller
 * Handles GDPR and CCPA compliance endpoints
 */

const User = require('../models/User');
const Message = require('../models/Message');
const Swipe = require('../models/Swipe');
const Report = require('../models/Report');
const Block = require('../models/Block');
const UserActivity = require('../models/UserActivity');

/**
 * Export all user data (GDPR Article 20 - Data Portability)
 * GET /api/privacy/export
 */
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user data from different collections
    const [
      userData,
      messages,
      swipes,
      reports,
      blocks,
      activities
    ] = await Promise.all([
      User.findById(userId).select('-password -passwordResetToken -phoneVerificationCode -emailVerificationToken').lean(),
      Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).lean(),
      Swipe.find({ $or: [{ swiper: userId }, { swiped: userId }] }).lean(),
      Report.find({ $or: [{ reporter: userId }, { reported: userId }] }).lean(),
      Block.find({ $or: [{ blocker: userId }, { blocked: userId }] }).lean(),
      UserActivity.find({ userId }).lean()
    ]);

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: 'JSON',
      dataSubject: {
        id: userId,
        email: userData?.email
      },
      profile: userData,
      messages: messages.map(msg => ({
        id: msg._id,
        direction: msg.senderId.toString() === userId.toString() ? 'sent' : 'received',
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt
      })),
      swipes: swipes.map(swipe => ({
        id: swipe._id,
        direction: swipe.swiper.toString() === userId.toString() ? 'given' : 'received',
        action: swipe.action,
        createdAt: swipe.createdAt
      })),
      reports: {
        filed: reports.filter(r => r.reporter?.toString() === userId.toString()),
        received: reports.filter(r => r.reported?.toString() === userId.toString()).length // Only count, not details
      },
      blocks: {
        blocked: blocks.filter(b => b.blocker?.toString() === userId.toString()).length,
        blockedBy: blocks.filter(b => b.blocked?.toString() === userId.toString()).length
      },
      activities: activities,
      metadata: {
        accountCreated: userData?.createdAt,
        lastActive: userData?.lastActive,
        totalLogins: activities?.filter(a => a.type === 'login')?.length || 0
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
      error: error.message
    });
  }
};

/**
 * Get privacy settings (GDPR & CCPA)
 * GET /api/privacy/settings
 */
exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings email name');
    
    res.json({
      success: true,
      data: {
        privacySettings: user.privacySettings || {
          dataSharing: true,
          marketingEmails: true,
          thirdPartySharing: false,
          analyticsTracking: true,
          doNotSell: false,
          dataRetentionPeriod: '2years'
        },
        consentHistory: user.privacySettings?.consentHistory || []
      }
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get privacy settings'
    });
  }
};

/**
 * Update privacy settings
 * PUT /api/privacy/settings
 */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const {
      dataSharing,
      marketingEmails,
      thirdPartySharing,
      analyticsTracking,
      doNotSell,
      dataRetentionPeriod
    } = req.body;

    const updateData = {
      'privacySettings.dataSharing': dataSharing,
      'privacySettings.marketingEmails': marketingEmails,
      'privacySettings.thirdPartySharing': thirdPartySharing,
      'privacySettings.analyticsTracking': analyticsTracking,
      'privacySettings.doNotSell': doNotSell,
      'privacySettings.dataRetentionPeriod': dataRetentionPeriod,
      'privacySettings.lastUpdated': new Date()
    };

    // Add consent history entry
    const consentEntry = {
      timestamp: new Date(),
      action: 'settings_updated',
      changes: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: updateData,
        $push: { 'privacySettings.consentHistory': consentEntry }
      },
      { new: true }
    ).select('privacySettings');

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: user.privacySettings
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
};

/**
 * CCPA: Do Not Sell My Personal Information
 * POST /api/privacy/do-not-sell
 */
exports.doNotSell = async (req, res) => {
  try {
    const { optOut } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'privacySettings.doNotSell': optOut !== false, // Default to true
        'privacySettings.doNotSellDate': new Date(),
        'privacySettings.thirdPartySharing': false
      },
      $push: {
        'privacySettings.consentHistory': {
          timestamp: new Date(),
          action: optOut !== false ? 'do_not_sell_enabled' : 'do_not_sell_disabled',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });

    res.json({
      success: true,
      message: optOut !== false 
        ? 'Your personal information will not be sold to third parties'
        : 'Do Not Sell preference has been disabled'
    });
  } catch (error) {
    console.error('Do Not Sell error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Do Not Sell preference'
    });
  }
};

/**
 * GDPR: Right to be Forgotten - Delete all user data
 * DELETE /api/privacy/delete-account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { confirmEmail, reason } = req.body;

    // Verify email confirmation
    const user = await User.findById(userId);
    if (user.email !== confirmEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email confirmation does not match'
      });
    }

    // Delete all user data from all collections
    await Promise.all([
      // Anonymize messages (keep for other users but remove PII)
      Message.updateMany(
        { senderId: userId },
        { $set: { content: '[Deleted]', senderId: null } }
      ),
      Message.updateMany(
        { receiverId: userId },
        { $set: { receiverId: null } }
      ),
      
      // Delete swipes
      Swipe.deleteMany({ $or: [{ swiper: userId }, { swiped: userId }] }),
      
      // Anonymize reports
      Report.updateMany(
        { reporter: userId },
        { $set: { reporter: null } }
      ),
      
      // Delete blocks
      Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] }),
      
      // Delete activity logs
      UserActivity.deleteMany({ userId }),
      
      // Finally, delete the user account
      User.findByIdAndDelete(userId)
    ]);

    // Log deletion for compliance records (anonymized)
    console.log(`Account deleted: ${userId} - Reason: ${reason || 'Not specified'}`);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

/**
 * GDPR: Right to Rectification - Update personal data
 * PUT /api/privacy/rectify
 */
exports.rectifyData = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phoneNumber', 'bio', 'age', 'gender'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select(allowedFields.join(' '));

    res.json({
      success: true,
      message: 'Personal data updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Data rectification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personal data'
    });
  }
};

/**
 * Get data processing consent status
 * GET /api/privacy/consent
 */
exports.getConsentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings createdAt');
    
    res.json({
      success: true,
      data: {
        hasConsented: user.privacySettings?.hasConsented || false,
        consentDate: user.privacySettings?.consentDate,
        consentVersion: user.privacySettings?.consentVersion || '1.0',
        purposes: {
          essential: true, // Always required
          analytics: user.privacySettings?.analyticsTracking ?? true,
          marketing: user.privacySettings?.marketingEmails ?? false,
          thirdParty: user.privacySettings?.thirdPartySharing ?? false
        },
        accountAge: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get consent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get consent status'
    });
  }
};

/**
 * Record user consent
 * POST /api/privacy/consent
 */
exports.recordConsent = async (req, res) => {
  try {
    const { purposes, policyVersion } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'privacySettings.hasConsented': true,
        'privacySettings.consentDate': new Date(),
        'privacySettings.consentVersion': policyVersion || '1.0',
        'privacySettings.analyticsTracking': purposes?.analytics ?? true,
        'privacySettings.marketingEmails': purposes?.marketing ?? false,
        'privacySettings.thirdPartySharing': purposes?.thirdParty ?? false
      },
      $push: {
        'privacySettings.consentHistory': {
          timestamp: new Date(),
          action: 'consent_given',
          version: policyVersion || '1.0',
          purposes: purposes,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });

    res.json({
      success: true,
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Record consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record consent'
    });
  }
};

/**
 * Withdraw consent
 * DELETE /api/privacy/consent
 */
exports.withdrawConsent = async (req, res) => {
  try {
    const { purposes } = req.body;

    const updates = {
      'privacySettings.lastUpdated': new Date()
    };

    if (purposes?.analytics === false) {
      updates['privacySettings.analyticsTracking'] = false;
    }
    if (purposes?.marketing === false) {
      updates['privacySettings.marketingEmails'] = false;
    }
    if (purposes?.thirdParty === false) {
      updates['privacySettings.thirdPartySharing'] = false;
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: updates,
      $push: {
        'privacySettings.consentHistory': {
          timestamp: new Date(),
          action: 'consent_withdrawn',
          purposes: purposes,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });

    res.json({
      success: true,
      message: 'Consent preferences updated'
    });
  } catch (error) {
    console.error('Withdraw consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update consent preferences'
    });
  }
};

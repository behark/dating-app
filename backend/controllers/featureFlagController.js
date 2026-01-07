const FeatureFlag = require('../models/FeatureFlag');
const { logger } = require('../services/LoggingService');
const FeatureFlagOverride = require('../models/FeatureFlagOverride');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Hash user ID for consistent rollout assignment
 */
function hashUserId(userId) {
  const str = userId.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if feature is enabled for user
 */
async function isFlagEnabledForUser(flag, userId, userGroups = []) {
  // Check user-specific override first
  const override = await FeatureFlagOverride.findOne({
    userId,
    flagName: flag.name,
  });

  if (override) {
    return override.enabled;
  }

  // If flag is globally disabled
  if (!flag.enabled) {
    return false;
  }

  // Check user groups
  if (!flag.allowedGroups.includes('all')) {
    const hasAllowedGroup = userGroups.some((group) => flag.allowedGroups.includes(group));
    if (!hasAllowedGroup) {
      return false;
    }
  }

  // Check rollout percentage
  if (flag.rolloutPercentage < 100 && userId) {
    const userHash = hashUserId(userId);
    const userPercentile = userHash % 100;
    return userPercentile < flag.rolloutPercentage;
  }

  return flag.enabled;
}

/**
 * Get user groups (beta_testers, premium, etc.)
 */
async function getUserGroups(userId) {
  const groups = [];

  // Check if user is beta tester
  let enrollment = null;
  try {
    const BetaEnrollment = require('../models/BetaEnrollment');
    enrollment = await BetaEnrollment.findOne({ userId, status: 'active' });
  } catch (error) {
    // BetaEnrollment model might not exist yet, continue without it
    console.warn('BetaEnrollment model not available:', error);
  }
  if (enrollment) {
    groups.push('beta_testers');
    if (enrollment.tier === 'vip') {
      groups.push('vip');
    }
  }

  // Check if user is premium
  const subscription = await Subscription.findOne({ userId, status: 'active' });
  if (subscription) {
    groups.push('premium');
  }

  // Check if user is admin
  const user = await User.findById(userId).select('role').lean();
  // @ts-ignore - role may not be in TypeScript types but exists in schema
  if (user && user.role === 'admin') {
    groups.push('admin');
  }

  return groups;
}

/**
 * Get feature flags for current user
 * GET /api/feature-flags
 */
exports.getUserFlags = async (req, res) => {
  try {
    const userId = req.user._id;
    const userGroups = await getUserGroups(userId);

    // Get all flags
    const flags = await FeatureFlag.find({}).lean();

    // Evaluate flags for user
    const userFlags = {};
    for (const flag of flags) {
      const enabled = await isFlagEnabledForUser(flag, userId, userGroups);
      userFlags[flag.name] = {
        enabled,
        description: flag.description,
      };
    }

    res.json({
      success: true,
      data: {
        flags: userFlags,
      },
    });
  } catch (error) {
    logger.error('Get user flags error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error fetching feature flags', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Check if specific flag is enabled
 * GET /api/feature-flags/:flagName
 */
exports.getFlag = async (req, res) => {
  try {
    const userId = req.user._id;
    const { flagName } = req.params;

    const flag = await FeatureFlag.findOne({ name: flagName });
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    const userGroups = await getUserGroups(userId);
    const enabled = await isFlagEnabledForUser(flag, userId, userGroups);

    // Check for override
    const override = await FeatureFlagOverride.findOne({
      userId,
      flagName,
    });

    res.json({
      success: true,
      data: {
        enabled,
        description: flag.description,
        rolloutPercentage: flag.rolloutPercentage,
        userOverride: override ? { enabled: override.enabled } : null,
      },
    });
  } catch (error) {
    logger.error('Get flag error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error fetching feature flag', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Get all flags (admin only)
 * GET /api/feature-flags/admin
 */
exports.getAllFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.find({}).sort({ createdAt: -1 }).lean();

    // Get override counts for each flag
    const flagsWithStats = await Promise.all(
      flags.map(async (flag) => {
        const overrideCount = await FeatureFlagOverride.countDocuments({
          flagName: flag.name,
        });
        return {
          ...flag,
          overrideCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        flags: flagsWithStats,
      },
    });
  } catch (error) {
    logger.error('Get all flags error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error fetching feature flags', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Create or update flag (admin only)
 * POST /api/feature-flags/admin
 */
exports.createOrUpdateFlag = async (req, res) => {
  try {
    const { name, enabled, description, rolloutPercentage, allowedGroups, isABTest, metadata } =
      req.body;

    if (!name) {
      return sendError(res, 400, { message: 'Flag name is required' });
    }

    // Validate rollout percentage
    if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return sendError(res, 400, { message: 'Rollout percentage must be between 0 and 100' });
    }

    // Validate allowed groups
    if (allowedGroups && !Array.isArray(allowedGroups)) {
      return sendError(res, 400, { message: 'allowedGroups must be an array' });
    }

    const flag = await FeatureFlag.findOneAndUpdate(
      { name },
      {
        name,
        enabled: enabled !== undefined ? enabled : false,
        description: description || '',
        rolloutPercentage: rolloutPercentage !== undefined ? rolloutPercentage : 0,
        allowedGroups: allowedGroups || ['all'],
        isABTest: isABTest || false,
        metadata: metadata || {},
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Feature flag saved successfully',
      data: { flag },
    });
  } catch (error) {
    logger.error('Create/update flag error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error saving feature flag', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Update rollout percentage (admin only)
 * PUT /api/feature-flags/admin/:flagName/rollout
 */
exports.updateRollout = async (req, res) => {
  try {
    const { flagName } = req.params;
    const { percentage } = req.body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return sendError(res, 400, { message: 'Percentage must be between 0 and 100' });
    }

    const flag = await FeatureFlag.findOneAndUpdate(
      { name: flagName },
      { rolloutPercentage: percentage },
      { new: true }
    );

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    res.json({
      success: true,
      message: 'Rollout percentage updated',
      data: { flag },
    });
  } catch (error) {
    logger.error('Update rollout error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error updating rollout percentage', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Set user override (admin only)
 * POST /api/feature-flags/admin/:flagName/override
 */
exports.setUserOverride = async (req, res) => {
  try {
    const { flagName } = req.params;
    const { userId, enabled, reason } = req.body;

    if (!userId || enabled === undefined) {
      return sendError(res, 400, { message: 'userId and enabled are required' });
    }

    // Verify flag exists
    const flag = await FeatureFlag.findOne({ name: flagName });
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const override = await FeatureFlagOverride.findOneAndUpdate(
      { userId, flagName },
      {
        userId,
        flagName,
        enabled,
        setBy: req.user._id,
        reason: reason || null,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'User override set successfully',
      data: { override },
    });
  } catch (error) {
    logger.error('Set user override error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error setting user override', error: error instanceof Error ? error.message : String(error), });
  }
};

/**
 * Remove user override (admin only)
 * DELETE /api/feature-flags/admin/:flagName/override/:userId
 */
exports.removeUserOverride = async (req, res) => {
  try {
    const { flagName, userId } = req.params;

    const override = await FeatureFlagOverride.findOneAndDelete({
      userId,
      flagName,
    });

    if (!override) {
      return res.status(404).json({
        success: false,
        message: 'Override not found',
      });
    }

    res.json({
      success: true,
      message: 'User override removed successfully',
    });
  } catch (error) {
    logger.error('Remove user override error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error removing user override', error: error instanceof Error ? error.message : String(error), });
  }
};

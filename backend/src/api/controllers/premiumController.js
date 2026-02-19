const User = require('../../core/domain/User');
const { logger } = require('../../infrastructure/external/LoggingService');
const Subscription = require('../../core/domain/Subscription');
const Swipe = require('../../core/domain/Swipe');
const { ERROR_MESSAGES, PREMIUM_MESSAGES } = require('../../shared/constants/messages');
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
 * Get premium subscription status for the authenticated user
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return sendSuccess(res, 200, {
        message: 'Subscription status retrieved',
        data: {
          status: 'free',
          isPremium: false,
          features: {
            unlimitedSwipes: false,
            seeWhoLikedYou: false,
            passport: false,
            advancedFilters: false,
            priorityLikes: false,
            hideAds: false,
            profileBoostAnalytics: false,
          },
        },
      });
    }

    return sendSuccess(res, 200, {
      message: 'Subscription status retrieved',
      data: {
        status: subscription.status,
        isPremium: subscription.isActive,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: subscription.features,
        usage: {
          superLikesUsedToday: subscription.superLikesUsedToday,
          profileBoostsUsedThisMonth: subscription.profileBoostsUsedThisMonth,
        },
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting subscription status:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Error retrieving subscription status',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Start a free trial subscription
 */
const startTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Subscription.activateTrial(userId);

    if (!result.success) {
      return sendError(res, 400, {
        message: result.message,
        error: 'TRIAL_ERROR',
      });
    }

    return sendSuccess(res, 200, {
      message: '7-day free trial activated!',
      data: result.subscription,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error starting trial:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error starting trial',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Upgrade to premium subscription
 */
const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType, paymentData } = req.body;

    if (!['monthly', 'yearly'].includes(planType)) {
      return sendValidationError(res, [
        { field: 'planType', message: 'Invalid plan type. Must be monthly or yearly' },
      ]);
    }

    const result = await Subscription.upgradeToPremium(userId, planType, paymentData);

    if (!result.success) {
      return sendError(res, 400, {
        message: result.message,
        error: 'UPGRADE_ERROR',
      });
    }

    return sendSuccess(res, 200, {
      message: `Upgraded to ${planType} plan!`,
      data: result.subscription,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error upgrading to premium:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error upgrading to premium',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Cancel premium subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Subscription.cancelSubscription(userId);

    if (!result.success) {
      return sendError(res, 400, {
        message: result.message,
        error: 'CANCEL_ERROR',
      });
    }

    return sendSuccess(res, 200, {
      message: 'Subscription cancelled successfully',
      data: result.subscription,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error cancelling subscription:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error cancelling subscription',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Get received likes (premium feature: See Who Liked You)
 */
const getReceivedLikes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has premium access to this feature
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('seeWhoLikedYou')) {
      return sendForbidden(res, PREMIUM_MESSAGES.SEE_WHO_LIKED);
    }

    // Get all likes received
    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }
    const receivedLikes = user?.receivedLikes || [];

    // Get user details for each like
    const likesWithDetails = [];
    for (const like of receivedLikes) {
      try {
        // Check if like is an object with details or just an ObjectId
        if (
          typeof like === 'object' &&
          like !== null &&
          'fromUserId' in like &&
          !(
            '_id' in like &&
            like._id instanceof require('mongoose').Types.ObjectId &&
            Object.keys(like).length === 1
          )
        ) {
          // Like is already a detailed object
          const likeObj = like;
          const likerUser = await User.findById(likeObj.fromUserId).select(
            '_id name age gender photos location bio interests education'
          );
          if (likerUser) {
            // @ts-ignore - fromUserId may not be in type
            likesWithDetails.push({
              _id: likeObj.fromUserId,
              action: likeObj.action || 'like',
              receivedAt: likeObj.receivedAt || new Date(),
              user: likerUser,
            });
          }
        } else {
          // Like is just an ObjectId, treat it as fromUserId
          const likerUser = await User.findById(like).select(
            '_id name age gender photos location bio interests education'
          );
          if (likerUser) {
            likesWithDetails.push({
              _id: like,
              action: 'like',
              receivedAt: new Date(),
              user: likerUser,
            });
          }
        }
      } catch (/** @type {any} */ error) {
        logger.error('Error fetching liker details:', { error: error.message, stack: error.stack });
      }
    }

    return sendSuccess(res, 200, {
      message: 'Received likes retrieved successfully',
      data: {
        totalLikes: likesWithDetails.length,
        likes: likesWithDetails.sort((a, b) => {
          const dateA =
            a.receivedAt instanceof Date
              ? a.receivedAt.getTime()
              : a.receivedAt
                ? new Date(a.receivedAt).getTime()
                : 0;
          const dateB =
            b.receivedAt instanceof Date
              ? b.receivedAt.getTime()
              : b.receivedAt
                ? new Date(b.receivedAt).getTime()
                : 0;
          return dateB - dateA;
        }),
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting received likes:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error retrieving received likes',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Set passport location (location override)
 */
const setPassportLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { longitude, latitude, city, country } = req.body;

    // Check if user has premium access to this feature
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('passport')) {
      return sendForbidden(res, PREMIUM_MESSAGES.PASSPORT);
    }

    // Validate coordinates
    if (
      !longitude ||
      !latitude ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return sendValidationError(res, [
        { field: 'coordinates', message: 'Invalid coordinates provided' },
      ]);
    }

    const user = await User.findById(userId);

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update passport mode
    const newLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      city: city || 'Unknown',
      country: country || 'Unknown',
    };

    // Save to change history
    if (!user.passportMode) {
      user.passportMode = { isActive: true, changeHistory: [] };
    }

    if (user.passportMode) {
      user.passportMode.enabled = true;
      user.passportMode.isActive = true;
      // Convert GeoJSON to latitude/longitude format
      const coordinates = newLocation.coordinates || [];
      user.passportMode.currentLocation = {
        latitude: coordinates[1] || 0,
        longitude: coordinates[0] || 0,
        city: newLocation.city,
        country: newLocation.country,
      };
      user.passportMode.lastChanged = new Date();
      user.passportMode.changeHistory = user.passportMode.changeHistory || [];
      user.passportMode.changeHistory.push({
        location: newLocation,
        city: newLocation.city,
        country: newLocation.country,
        changedAt: new Date(),
      });
    }

    await user.save();

    // PRIVACY: Only return city/country, not coordinates
    return sendSuccess(res, 200, {
      message: 'Passport location updated successfully',
      data: {
        enabled: true,
        location: {
          city: newLocation.city,
          country: newLocation.country,
          // NEVER expose coordinates
        },
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error setting passport location:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error updating passport location',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Get passport status
 */
const getPassportStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('passportMode');
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // PRIVACY: Sanitize passport location response
    const currentLocation = user?.passportMode?.currentLocation
      ? {
          city: user.passportMode.currentLocation.city || null,
          country: user.passportMode.currentLocation.country || null,
          // NEVER include coordinates
        }
      : null;

    return sendSuccess(res, 200, {
      message: 'Passport status retrieved',
      data: {
        enabled: user?.passportMode?.enabled || false,
        currentLocation,
        lastChanged: user?.passportMode?.lastChanged,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting passport status:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error retrieving passport status',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Disable passport mode
 */
const disablePassport = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    if (user.passportMode) {
      user.passportMode.enabled = false;
    }

    await user.save();

    return sendSuccess(res, 200, {
      message: 'Passport mode disabled',
      data: { enabled: false },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error disabling passport:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error disabling passport',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Get advanced filter options (schema definitions)
 */
const getAdvancedFilterOptions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has premium access
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('advancedFilters')) {
      return sendForbidden(res, PREMIUM_MESSAGES.ADVANCED_FILTERS);
    }

    // Return available filter options
    return sendSuccess(res, 200, {
      message: 'Advanced filter options retrieved',
      data: {
        income: {
          min: 0,
          max: 500000,
          step: 10000,
        },
        educationLevel: ['high_school', 'bachelor', 'masters', 'phd'],
        bodyType: ['slim', 'athletic', 'average', 'curvy', 'stocky'],
        drinkingFrequency: ['never', 'rarely', 'socially', 'regularly'],
        smokingStatus: ['never', 'rarely', 'sometimes', 'regularly'],
        maritalStatus: ['single', 'divorced', 'widowed', 'separated'],
        hasChildren: [true, false],
        wantsChildren: ['yes', 'no', 'maybe', 'unsure'],
        religion: [
          'christian',
          'jewish',
          'muslim',
          'hindu',
          'buddhist',
          'atheist',
          'agnostic',
          'other',
        ],
        zodiacSign: [
          'aries',
          'taurus',
          'gemini',
          'cancer',
          'leo',
          'virgo',
          'libra',
          'scorpio',
          'sagittarius',
          'capricorn',
          'aquarius',
          'pisces',
        ],
        languages: [
          'english',
          'spanish',
          'french',
          'german',
          'italian',
          'portuguese',
          'russian',
          'chinese',
          'japanese',
          'korean',
        ],
        travelFrequency: ['never', 'rarely', 'sometimes', 'frequently'],
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting advanced filter options:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Error retrieving filter options',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Update user advanced filters
 */
const updateAdvancedFilters = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.body;

    // Check if user has premium access
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('advancedFilters')) {
      return sendForbidden(res, PREMIUM_MESSAGES.ADVANCED_FILTERS);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { advancedFilters: filters },
      { new: true, runValidators: true }
    );
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, 200, {
      message: 'Advanced filters updated successfully',
      data: user.advancedFilters,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error updating advanced filters:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error updating advanced filters',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Send a priority like (premium feature)
 */
const sendPriorityLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return sendValidationError(res, [
        { field: 'targetUserId', message: 'targetUserId is required' },
      ]);
    }

    // Check if user has premium access
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('priorityLikes')) {
      return sendForbidden(res, PREMIUM_MESSAGES.PRIORITY_LIKES);
    }

    // Create a swipe with priority flag
    const swipe = new Swipe({
      swiperId: userId,
      swipedId: targetUserId,
      action: 'like',
      isPriority: true,
      prioritySentAt: new Date(),
    });

    await swipe.save();

    // Update priority stats
    await User.findByIdAndUpdate(userId, { $inc: { priorityLikesSent: 1 } });
    await User.findByIdAndUpdate(targetUserId, { $inc: { priorityLikesReceived: 1 } });

    return sendSuccess(res, 200, {
      message: 'Priority like sent successfully',
      data: { swipeId: swipe._id },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error sending priority like:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error sending priority like',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Update ads preferences
 */
const updateAdsPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { showAds, adCategories } = req.body;

    // Check if user has premium access to hide ads
    if (showAds === false) {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription?.hasFeature('hideAds')) {
        return sendForbidden(res, PREMIUM_MESSAGES.HIDE_ADS);
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'adsPreferences.showAds': showAds !== false,
        'adsPreferences.adCategories': adCategories || [],
        'adsPreferences.lastAdUpdate': new Date(),
      },
      { new: true }
    );
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, 200, {
      message: 'Ads preferences updated successfully',
      data: user.adsPreferences,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error updating ads preferences:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error updating ads preferences',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Get profile boost analytics
 */
const getBoostAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has premium access
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('profileBoostAnalytics')) {
      return sendForbidden(res, PREMIUM_MESSAGES.BOOST_ANALYTICS);
    }

    const user = await User.findById(userId).select('boostAnalytics');
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, 200, {
      message: 'Boost analytics retrieved',
      data: {
        totalBoosts: user?.boostAnalytics?.totalBoosts || 0,
        totalProfileViews: user?.boostAnalytics?.totalProfileViews || 0,
        totalLikesReceivedDuringBoosts: user?.boostAnalytics?.totalLikesReceivedDuringBoosts || 0,
        averageViewsPerBoost: user?.boostAnalytics?.averageViewsPerBoost || 0,
        averageLikesPerBoost: user?.boostAnalytics?.averageLikesPerBoost || 0,
        boostHistory: user?.boostAnalytics?.boostHistory || [],
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting boost analytics:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error retrieving boost analytics',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Record profile boost session
 */
const recordBoostSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { duration, viewsGained, likesGained, matches } = req.body;

    if (!duration) {
      return sendValidationError(res, [{ field: 'duration', message: 'duration is required' }]);
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    if (!user.boostAnalytics) {
      user.boostAnalytics = {
        totalBoosts: 0,
        totalProfileViews: 0,
        totalLikesReceivedDuringBoosts: 0,
        boostHistory: [],
        averageViewsPerBoost: 0,
        averageLikesPerBoost: 0,
      };
    }

    // Add boost session to history
    const newBoost = {
      startTime: new Date(new Date().getTime() - duration * 60000),
      endTime: new Date(),
      duration: duration,
      viewsGained: viewsGained || 0,
      likesGained: likesGained || 0,
      matches: matches || 0,
    };
    if (user.boostAnalytics) {
      user.boostAnalytics.boostHistory.push(newBoost);
      user.boostAnalytics.totalBoosts = (user.boostAnalytics.totalBoosts || 0) + 1;
      user.boostAnalytics.totalProfileViews =
        (user.boostAnalytics.totalProfileViews || 0) + (viewsGained || 0);
      user.boostAnalytics.totalLikesReceivedDuringBoosts =
        (user.boostAnalytics.totalLikesReceivedDuringBoosts || 0) + (likesGained || 0);

      // Calculate averages
      user.boostAnalytics.averageViewsPerBoost = Math.round(
        user.boostAnalytics.totalProfileViews / user.boostAnalytics.totalBoosts
      );
      user.boostAnalytics.averageLikesPerBoost = Math.round(
        user.boostAnalytics.totalLikesReceivedDuringBoosts / user.boostAnalytics.totalBoosts
      );
    }

    await user.save();

    return sendSuccess(res, 200, {
      message: 'Boost session recorded successfully',
      data: user.boostAnalytics,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error recording boost session:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Error recording boost session',
      error: 'INTERNAL_ERROR',
    });
  }
};

module.exports = {
  getSubscriptionStatus,
  startTrial,
  upgradeToPremium,
  cancelSubscription,
  getReceivedLikes,
  setPassportLocation,
  getPassportStatus,
  disablePassport,
  getAdvancedFilterOptions,
  updateAdvancedFilters,
  sendPriorityLike,
  updateAdsPreferences,
  getBoostAnalytics,
  recordBoostSession,
};

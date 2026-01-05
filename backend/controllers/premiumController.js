const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Swipe = require('../models/Swipe');
const { sendSuccess, sendError, sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendRateLimit, asyncHandler } = require('../utils/responseHelpers');

/**
 * Get premium subscription status for the authenticated user
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.json({
        success: true,
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

    res.json({
      success: true,
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
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription status',
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
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: '7-day free trial activated!',
      data: result.subscription,
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting trial',
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
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type. Must be monthly or yearly',
      });
    }

    const result = await Subscription.upgradeToPremium(userId, planType, paymentData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: `Upgraded to ${planType} plan!`,
      data: result.subscription,
    });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    res.status(500).json({
      success: false,
      message: 'Error upgrading to premium',
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
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: result.subscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
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
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to see who liked you.',
      });
    }

    // Get all likes received
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const receivedLikes = user?.receivedLikes || [];

    // Get user details for each like
    const likesWithDetails = [];
    for (const like of receivedLikes) {
      try {
        // Check if like is an object with details or just an ObjectId
        if (typeof like === 'object' && like.fromUserId) {
          // Like is already a detailed object
          const likerUser = await User.findById(like.fromUserId).select(
            '_id name age gender photos location bio interests education'
          );
          if (likerUser) {
            likesWithDetails.push({
              _id: like._id,
              action: like.action,
              receivedAt: like.receivedAt,
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
      } catch (error) {
        console.error('Error fetching liker details:', error);
      }
    }

    res.json({
      success: true,
      data: {
        totalLikes: likesWithDetails.length,
        likes: likesWithDetails.sort((a, b) => b.receivedAt - a.receivedAt),
      },
    });
  } catch (error) {
    console.error('Error getting received likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving received likes',
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
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to use Passport.',
      });
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
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
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
      user.passportMode = { changeHistory: [] };
    }

    if (user.passportMode) {
      user.passportMode.enabled = true;
      user.passportMode.currentLocation = newLocation;
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
    res.json({
      success: true,
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
  } catch (error) {
    console.error('Error setting passport location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating passport location',
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
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // PRIVACY: Sanitize passport location response
    const currentLocation = user?.passportMode?.currentLocation ? {
      city: user.passportMode.currentLocation.city || null,
      country: user.passportMode.currentLocation.country || null,
      // NEVER include coordinates
    } : null;

    res.json({
      success: true,
      data: {
        enabled: user?.passportMode?.enabled || false,
        currentLocation,
        lastChanged: user?.passportMode?.lastChanged,
      },
    });
  } catch (error) {
    console.error('Error getting passport status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving passport status',
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
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.passportMode) {
      user.passportMode.enabled = false;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Passport mode disabled',
      data: { enabled: false },
    });
  } catch (error) {
    console.error('Error disabling passport:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling passport',
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
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to use Advanced Filters.',
      });
    }

    // Return available filter options
    res.json({
      success: true,
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
  } catch (error) {
    console.error('Error getting advanced filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving filter options',
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
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to use Advanced Filters.',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { advancedFilters: filters },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Advanced filters updated successfully',
      data: user.advancedFilters,
    });
  } catch (error) {
    console.error('Error updating advanced filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advanced filters',
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
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    // Check if user has premium access
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.hasFeature('priorityLikes')) {
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to use Priority Likes.',
      });
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

    res.json({
      success: true,
      message: 'Priority like sent successfully',
      data: { swipeId: swipe._id },
    });
  } catch (error) {
    console.error('Error sending priority like:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending priority like',
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
        return res.status(403).json({
          success: false,
          message: 'Premium feature required. Please upgrade to hide ads.',
        });
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
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Ads preferences updated successfully',
      data: user.adsPreferences,
    });
  } catch (error) {
    console.error('Error updating ads preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ads preferences',
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
      return res.status(403).json({
        success: false,
        message: 'Premium feature required. Please upgrade to view profile boost analytics.',
      });
    }

    const user = await User.findById(userId).select('boostAnalytics');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        totalBoosts: user?.boostAnalytics?.totalBoosts || 0,
        totalProfileViews: user?.boostAnalytics?.totalProfileViews || 0,
        totalLikesReceivedDuringBoosts: user?.boostAnalytics?.totalLikesReceivedDuringBoosts || 0,
        averageViewsPerBoost: user?.boostAnalytics?.averageViewsPerBoost || 0,
        averageLikesPerBoost: user?.boostAnalytics?.averageLikesPerBoost || 0,
        boostHistory: user?.boostAnalytics?.boostHistory || [],
      },
    });
  } catch (error) {
    console.error('Error getting boost analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving boost analytics',
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
      return res.status(400).json({
        success: false,
        message: 'duration is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
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

    res.json({
      success: true,
      message: 'Boost session recorded successfully',
      data: user.boostAnalytics,
    });
  } catch (error) {
    console.error('Error recording boost session:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording boost session',
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

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');
const SuperLike = require('../models/SuperLike');

const Rewind = require('../models/Rewind');

const BoostProfile = require('../models/BoostProfile');

const User = require('../models/User');

const Swipe = require('../models/Swipe');

const UserActivity = require('../models/UserActivity');

// SUPER LIKES

/**
 * Send a super like to another user
 */
const sendSuperLike = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user.id;

    // Validate input
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent super liking yourself
    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot super like yourself',
      });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found',
      });
    }

    // Check if already swiped on this user
    const existingSwipe = await Swipe.findOne({
      swiperId: senderId,
      swipedId: recipientId,
    });

    if (existingSwipe) {
      return res.status(400).json({
        success: false,
        message: 'You have already interacted with this profile',
      });
    }

    // Check daily limit
    let canSuperLike = false;
    let remaining = 0;

    if (sender.isPremium) {
      // Premium users have unlimited super likes
      canSuperLike = true;
      remaining = -1; // Unlimited
    } else {
      // Free users: 5 per day
      const usedToday = await SuperLike.getRemainingForToday(senderId);
      remaining = 5 - usedToday;

      if (remaining <= 0) {
        return res.status(429).json({
          success: false,
          message: 'Daily super like limit reached',
          remaining: 0,
          limit: 5,
        });
      }

      canSuperLike = true;
    }

    // Create super like
    const superLike = new SuperLike({
      senderId,
      recipientId,
      message: message || null,
    });

    await superLike.save();

    // Also create a swipe record to mark this interaction
    const swipe = new Swipe({
      swiperId: senderId,
      swipedId: recipientId,
      action: 'superlike',
    });

    await swipe.save();

    // Log activity
    await UserActivity.logActivity(senderId, 'super_like', {
      recipientId,
      hasMessage: !!message,
    });

    // Check for match
    const reverseSwipe = await Swipe.findOne({
      swiperId: recipientId,
      swipedId: senderId,
      action: { $in: ['like', 'superlike'] },
    });

    let isMatch = false;
    if (reverseSwipe) {
      isMatch = true;
      // You could create a match record here
    }

    // Send notification to recipient (in production)
    console.log(`[NOTIFICATION] Super like from ${sender.name} to ${recipient.name}`);

    return res.status(201).json({
      success: true,
      message: 'Super like sent successfully',
      data: {
        superLikeId: superLike._id,
        isMatch,
        recipientName: recipient.name,
        remaining: sender.isPremium ? -1 : remaining - 1,
      },
    });
  } catch (error) {
    console.error('Error sending super like:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get remaining super likes for today
 */
const getSuperLikeQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isPremium) {
      return res.status(200).json({
        success: true,
        data: {
          remaining: -1, // Unlimited
          limit: -1,
          isPremium: true,
        },
      });
    }

    const usedToday = await SuperLike.getRemainingForToday(userId);
    const remaining = Math.max(0, 5 - usedToday);

    return res.status(200).json({
      success: true,
      data: {
        remaining,
        limit: 5,
        isPremium: false,
        usedToday,
      },
    });
  } catch (error) {
    console.error('Error getting super like quota:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// REWINDS

/**
 * Undo the last swipe
 */
const rewindLastSwipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has rewinds remaining
    let hasRewindAvailable = false;

    if (user.isPremium) {
      // Premium users have unlimited rewinds
      hasRewindAvailable = true;
    } else {
      // Free users: 1 rewind per day
      const usedToday = await Rewind.getRemainingForToday(userId);
      if (usedToday < 1) {
        hasRewindAvailable = true;
      } else {
        hasRewindAvailable = false;
      }
    }

    if (!hasRewindAvailable && !user.isPremium) {
      return res.status(429).json({
        success: false,
        message: 'Daily rewind limit reached',
      });
    }

    // Get the last swipe
    const lastSwipe = await Swipe.findOne({
      swiperId: userId,
    }).sort({ createdAt: -1 });

    if (!lastSwipe) {
      return res.status(404).json({
        success: false,
        message: 'No swipe to rewind',
      });
    }

    // Create rewind record
    const rewind = new Rewind({
      userId,
      originalSwipeId: lastSwipe._id,
      swipedUserId: lastSwipe.swipedId,
      originalAction: lastSwipe.action,
      success: true,
    });

    await rewind.save();

    // Delete the original swipe
    await Swipe.findByIdAndDelete(lastSwipe._id);

    // Log activity
    await UserActivity.logActivity(userId, 'profile_view', {
      action: 'rewind',
    });

    return res.status(200).json({
      success: true,
      message: 'Swipe rewound successfully',
      data: {
        rewindId: rewind._id,
        rewindAction: lastSwipe.action,
        targetUser: lastSwipe.swipedId,
      },
    });
  } catch (error) {
    console.error('Error rewinding swipe:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get rewind quota
 */
const getRewindQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isPremium) {
      return res.status(200).json({
        success: true,
        data: {
          remaining: -1, // Unlimited
          limit: -1,
          isPremium: true,
        },
      });
    }

    const usedToday = await Rewind.getRemainingForToday(userId);
    const remaining = Math.max(0, 1 - usedToday);

    return res.status(200).json({
      success: true,
      data: {
        remaining,
        limit: 1,
        isPremium: false,
        usedToday,
      },
    });
  } catch (error) {
    console.error('Error getting rewind quota:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// BOOST PROFILE

/**
 * Boost user's profile for 30 minutes
 */
const boostProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { durationMinutes = 30 } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check boost limit
    let canBoost = false;

    if (user.isPremium) {
      // Premium users: unlimited daily boosts
      canBoost = true;
    } else {
      // Free users: 1 boost per day
      const usedToday = await BoostProfile.getRemainingForToday(userId);
      if (usedToday < 1) {
        canBoost = true;
      } else {
        canBoost = false;
      }
    }

    if (!canBoost && !user.isPremium) {
      return res.status(429).json({
        success: false,
        message: 'Daily boost limit reached',
      });
    }

    // Check if user already has an active boost
    const activeBoost = await BoostProfile.getActiveBoost(userId);
    if (activeBoost) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active boost',
        activeBoostEndsAt: activeBoost.endsAt,
      });
    }

    // Create boost
    const boost = new BoostProfile({
      userId,
      durationMinutes,
      tier: user.isPremium ? 'premium' : 'free',
      visibilityMultiplier: user.isPremium ? 5 : 3,
    });

    await boost.save();

    // Update user's active boost
    user.activeBoostId = boost._id;
    await user.save();

    // Log activity
    await UserActivity.logActivity(userId, 'profile_update', {
      action: 'boost_profile',
      duration: durationMinutes,
    });

    return res.status(201).json({
      success: true,
      message: 'Profile boosted successfully',
      data: {
        boostId: boost._id,
        endsAt: boost.endsAt,
        visibilityMultiplier: boost.visibilityMultiplier,
        durationMinutes,
      },
    });
  } catch (error) {
    console.error('Error boosting profile:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get boost quota
 */
const getBoostQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const activeBoost = await BoostProfile.getActiveBoost(userId);

    if (activeBoost) {
      return res.status(200).json({
        success: true,
        data: {
          hasActiveBoost: true,
          activeBoost: {
            endsAt: activeBoost.endsAt,
            visibilityMultiplier: activeBoost.visibilityMultiplier,
            remainingMinutes: activeBoost.endsAt ? Math.ceil((activeBoost.endsAt.getTime() - new Date().getTime()) / 60000) : 0,
          },
        },
      });
    }

    if (user.isPremium) {
      return res.status(200).json({
        success: true,
        data: {
          hasActiveBoost: false,
          remaining: -1, // Unlimited
          limit: -1,
          isPremium: true,
        },
      });
    }

    const usedToday = await BoostProfile.getRemainingForToday(userId);
    const remaining = Math.max(0, 1 - usedToday);

    return res.status(200).json({
      success: true,
      data: {
        hasActiveBoost: false,
        remaining,
        limit: 1,
        isPremium: false,
        usedToday,
      },
    });
  } catch (error) {
    console.error('Error getting boost quota:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

module.exports = {
  sendSuperLike,
  getSuperLikeQuota,
  rewindLastSwipe,
  getRewindQuota,
  boostProfile,
  getBoostQuota,
};

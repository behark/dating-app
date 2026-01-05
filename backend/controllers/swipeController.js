const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SwipeService = require('../services/SwipeService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Helper function to send notifications
 */
const sendNotificationInternal = async (toUserId, type, title, message, data) => {
  try {
    const user = await User.findById(toUserId);
    if (!user || !user.notificationPreferences) return;

    const prefs = user.notificationPreferences;
    let shouldSend = false;

    switch (type) {
      case 'match':
        shouldSend = prefs.matchNotifications !== false;
        break;
      case 'like':
        shouldSend = prefs.likeNotifications !== false;
        break;
    }

    if (shouldSend) {
      console.log(`[NOTIFICATION] To: ${toUserId}, Type: ${type}, Title: ${title}`);
      // In production, integrate with Expo push notification service
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Create a new swipe with daily limit checking
 * Uses SwipeService for the "Double-Opt-In" Match Transaction
 */
const createSwipe = async (req, res) => {
  try {
    const { targetId, action } = req.body;
    const swiperId = req.user.id;

    // Validate input
    if (!targetId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: targetId, action',
      });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: like, pass, superlike',
      });
    }

    // Check if user is premium using Subscription model
    const subscription = await Subscription.findOne({ userId: swiperId });
    const isPremium = subscription && subscription.isActive;

    // Check swipe limit for free users
    const limitCheck = await Swipe.canSwipe(swiperId, isPremium);
    if (!limitCheck.canSwipe) {
      return sendRateLimit(res, {
        message: 'Daily swipe limit reached',
        limit: 50,
        remaining: 0,
      });
    }

    // Use SwipeService to process the swipe and check for matches
    // SwipeService uses atomic operations to prevent race conditions
    const result = await SwipeService.processSwipe(swiperId, targetId, action, {
      isPriority: req.body.isPriority || false,
    });

    // If this swipe was already processed (rapid double-click), return early
    // This prevents duplicate notifications and duplicate match processing
    if (result.alreadyProcessed) {
      return sendSuccess(res, 200, {
        message: 'Swipe already recorded',
        data: {
          swipeId: result.swipe.id,
          action: result.swipe.action,
          isMatch: false,
          match: false,
          matchData: null,
          remaining: limitCheck.remaining,
          alreadyProcessed: true,
        },
      });
    }

    // Get user info for notifications
    const swiperUser = await User.findById(swiperId).select('name').lean();
    const swiperUserName = swiperUser?.name || 'Someone';

    // Send notifications based on result
    if (result.isMatch) {
      // Send match notifications to both users
      const swipedUser = await User.findById(targetId).select('name').lean();

      await sendNotificationInternal(
        targetId,
        'match',
        "🎉 It's a Match!",
        `You and ${swiperUserName} liked each other!`,
        {
          type: 'match',
          matcherId: swiperId,
          matchId: result.matchData?.matchId,
        }
      );

      await sendNotificationInternal(
        swiperId,
        'match',
        "🎉 It's a Match!",
        `You and ${swipedUser?.name || 'Someone'} liked each other!`,
        {
          type: 'match',
          matcherId: targetId,
          matchId: result.matchData?.matchId,
        }
      );
    } else if (action === 'like' || action === 'superlike') {
      // Send like notification to the target user if they haven't matched yet
      await sendNotificationInternal(
        targetId,
        'like',
        '💗 New Like!',
        `${swiperUserName} liked your profile!`,
        { type: 'like', likerId: swiperId }
      );
    }

    return res.json({
      success: true,
      data: {
        swipeId: result.swipe.id,
        action: action,
        isMatch: result.isMatch,
        match: result.isMatch, // Keep for backward compatibility
        matchData: result.matchData,
        remaining: limitCheck.remaining - 1,
      },
    });
  } catch (error) {
    console.error('Error creating swipe:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating swipe',
    });
  }
};

/**
 * Get swipe count for today
 */
const getSwipeCountToday = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has premium subscription
    const subscription = await Subscription.findOne({ userId });
    const isPremium = subscription && subscription.isActive;

    if (isPremium) {
      return res.json({
        success: true,
        data: {
          used: 0,
          remaining: -1,
          limit: 'unlimited',
          isPremium: true,
        },
      });
    }

    const limitCheck = await Swipe.canSwipe(userId, false);

    res.json({
      success: true,
      data: {
        used: limitCheck.used,
        remaining: limitCheck.remaining,
        limit: 50,
        isPremium: false,
      },
    });
  } catch (error) {
    console.error('Error getting swipe count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving swipe count',
    });
  }
};

/**
 * Undo last swipe - Uses SwipeService for proper match cleanup
 */
const undoSwipe = async (req, res) => {
  try {
    const { swipeId } = req.body;
    const userId = req.user.id;

    if (!swipeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: swipeId',
      });
    }

    const result = await SwipeService.undoSwipe(swipeId, userId);

    res.json({
      success: true,
      message: 'Swipe undone successfully',
      data: result.undoneSwipe,
    });
  } catch (error) {
    console.error('Error undoing swipe:', error);

    if ((error instanceof Error ? error.message : String(error)) === 'Swipe not found') {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (
      (error instanceof Error ? error.message : String(error)) === 'Unauthorized to undo this swipe'
    ) {
      return res.status(403).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while undoing swipe',
    });
  }
};

/**
 * Get user's swipes
 */
const getUserSwipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const swipes = await Swipe.find({ swiperId: userId })
      .populate('swipedId', 'name photoURL age')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        swipes: swipes,
        count: swipes.length,
      },
    });
  } catch (error) {
    console.error('Error getting user swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving swipes',
    });
  }
};

/**
 * Get received swipes (likes)
 */
const getReceivedSwipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const swipes = await Swipe.find({
      swipedId: userId,
      action: { $in: ['like', 'superlike'] },
    })
      .populate('swiperId', 'name photoURL age')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        swipes: swipes,
        count: swipes.length,
      },
    });
  } catch (error) {
    console.error('Error getting received swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving received swipes',
    });
  }
};

// Query timeout constant - MUST be less than Nginx proxy_read_timeout (90s)
const MATCH_QUERY_TIMEOUT_MS = 30000;
const DEFAULT_MATCH_LIMIT = 25;
const MAX_MATCH_LIMIT = 50;

/**
 * Get all matches for the current user
 * Optimized with query timeouts and pagination
 */
const getMatches = async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = req.user.id;
    const {
      status = 'active',
      limit = DEFAULT_MATCH_LIMIT,
      skip = 0,
      page = 1,
      sortBy = 'createdAt',
    } = req.query;

    const resultLimit = Math.min(parseInt(limit), MAX_MATCH_LIMIT);
    const pageNum = parseInt(page) || 1;
    const skipCount = parseInt(skip) || (pageNum - 1) * resultLimit;

    // Run matches query and count in parallel for better performance
    const [matches, totalCount] = await Promise.all([
      Match.find({
        users: userId,
        status: status,
      })
        .populate('users', 'name photos age bio lastActive isOnline')
        .sort({ [sortBy]: -1 })
        .skip(skipCount)
        .limit(resultLimit + 1) // Fetch one extra to check for more
        .maxTimeMS(MATCH_QUERY_TIMEOUT_MS)
        .lean(),

      Match.countDocuments({
        users: userId,
        status: status,
      }).maxTimeMS(MATCH_QUERY_TIMEOUT_MS),
    ]);

    // Check if there are more results
    const hasMore = matches.length > resultLimit;
    const resultMatches = hasMore ? matches.slice(0, resultLimit) : matches;

    // Transform matches to include the other user's info prominently
    const transformedMatches = resultMatches.map((match) => {
      const otherUser = match.users.find((u) => u._id.toString() !== userId);
      return {
        matchId: match._id,
        matchedAt: match.createdAt,
        matchType: match.matchType,
        status: match.status,
        conversationStarted: match.conversationStarted,
        lastActivityAt: match.lastActivityAt,
        user: otherUser,
      };
    });

    const queryTime = Date.now() - startTime;

    // Log slow queries
    if (queryTime > 3000) {
      console.warn(`[SLOW] getMatches query took ${queryTime}ms for user ${userId}`);
    }

    res.json({
      success: true,
      data: {
        matches: transformedMatches,
        count: transformedMatches.length,
        total: totalCount,
        pagination: {
          page: pageNum,
          limit: resultLimit,
          hasMore,
          nextPage: hasMore ? pageNum + 1 : null,
        },
        meta: {
          queryTimeMs: queryTime,
        },
      },
    });
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`Error getting matches after ${queryTime}ms:`, error);

    // Check for timeout error
    if (
      (error instanceof Error ? (error instanceof Error ? error.name : 'Error') : 'Error') ===
        'MongooseError' &&
      (error instanceof Error
        ? error instanceof Error
          ? error.message
          : String(error)
        : String(error)
      ).includes('maxTimeMS')
    ) {
      return res.status(503).json({
        success: false,
        message: 'Match query timed out. Please try again.',
        error: 'QUERY_TIMEOUT',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving matches',
    });
  }
};

/**
 * Unmatch with a user
 */
const unmatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: matchId',
      });
    }

    /** @type {import('../types/index.d.ts').MatchDocument} */
    const match = await Match.unmatch(matchId, userId);

    res.json({
      success: true,
      message: 'Successfully unmatched',
      data: {
        matchId: match._id,
        status: match.status,
      },
    });
  } catch (error) {
    console.error('Error unmatching:', error);

    if ((error instanceof Error ? error.message : String(error)) === 'Match not found') {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (
      (error instanceof Error ? error.message : String(error)) === 'User is not part of this match'
    ) {
      return res.status(403).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while unmatching',
    });
  }
};

/**
 * Get swipe statistics for the current user
 */
const getSwipeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await SwipeService.getSwipeStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting swipe stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving swipe statistics',
    });
  }
};

/**
 * Get pending likes (who liked you but you haven't swiped on yet)
 * Premium feature
 */
const getPendingLikes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    // Check if user has premium subscription
    const subscription = await Subscription.findOne({ userId });
    const isPremium = subscription && subscription.isActive;

    if (!isPremium) {
      // For free users, just return the count
      const pendingLikes = await SwipeService.getPendingLikes(userId, { limit: 100 });
      return res.json({
        success: true,
        data: {
          count: pendingLikes.length,
          isPremium: false,
          message: 'Upgrade to Premium to see who liked you',
        },
      });
    }

    const pendingLikes = await SwipeService.getPendingLikes(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });

    res.json({
      success: true,
      data: {
        likes: pendingLikes,
        count: pendingLikes.length,
        isPremium: true,
      },
    });
  } catch (error) {
    console.error('Error getting pending likes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pending likes',
    });
  }
};

module.exports = {
  createSwipe,
  getSwipeCountToday,
  undoSwipe,
  getUserSwipes,
  getReceivedSwipes,
  getMatches,
  unmatch,
  getSwipeStats,
  getPendingLikes,
};

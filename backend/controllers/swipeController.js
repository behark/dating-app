const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SwipeService = require('../services/SwipeService');

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
      return res.status(429).json({
        success: false,
        message: 'Daily swipe limit reached',
        remaining: 0,
        limit: 50,
      });
    }

    // Use SwipeService to process the swipe and check for matches
    const result = await SwipeService.processSwipe(swiperId, targetId, action, {
      isPriority: req.body.isPriority || false,
    });

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

    if (error.message === 'Swipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Unauthorized to undo this swipe') {
      return res.status(403).json({
        success: false,
        message: error.message,
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

/**
 * Get all matches for the current user
 */
const getMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active', limit = 50, skip = 0, sortBy = 'createdAt' } = req.query;

    const matches = await Match.getUserMatches(userId, {
      status,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
    });

    // Transform matches to include the other user's info prominently
    const transformedMatches = matches.map((match) => {
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

    const totalCount = await Match.getMatchCount(userId, status);

    res.json({
      success: true,
      data: {
        matches: transformedMatches,
        count: transformedMatches.length,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error getting matches:', error);
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

    if (error.message === 'Match not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'User is not part of this match') {
      return res.status(403).json({
        success: false,
        message: error.message,
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

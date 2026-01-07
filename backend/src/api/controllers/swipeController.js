const Swipe = require('../../core/domain/Swipe');
const { logger } = require('../../infrastructure/external/LoggingService');
const Match = require('../../core/domain/Match');
const User = require('../../core/domain/User');
const Subscription = require('../../core/domain/Subscription');
const SwipeService = require('../../core/services/SwipeService');
const QueueService = require('../../infrastructure/queues/QueueService');
const mongoose = require('mongoose');
const cache = require('../../infrastructure/cache/CacheService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendRateLimit,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');

/**
 * Helper function to send notifications
 */
const sendNotificationInternal = async (toUserId, type, title, message, data) => {
  try {
    const user = await User.findById(toUserId).select('notificationPreferences expoPushToken');
    if (!user || !user.expoPushToken) return;

    const prefs = user.notificationPreferences || {};
    let shouldSend = false;

    switch (type) {
      case 'match':
        shouldSend = prefs.matchNotifications !== false;
        break;
      case 'like':
        shouldSend = prefs.likeNotifications !== false;
        break;
      default:
        shouldSend = true;
    }

    if (shouldSend) {
      // Send real push notification via QueueService
      await QueueService.sendPushNotification(toUserId, title, message, {
        type,
        ...data,
      });
      logger.info(`[NOTIFICATION] Queued notification for user ${toUserId}`);
    }
  } catch (error) {
    logger.error('Error sending notification:', { error: error.message, stack: error.stack });
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

    logger.debug('Processing swipe request', {
      swiperId,
      targetId,
      action,
    });

    // Validate input
    if (!targetId || !action) {
      return sendError(res, 400, { message: 'Missing required fields: targetId, action' });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return sendError(res, 400, {
        message: 'Invalid action. Must be one of: like, pass, superlike',
      });
    }

    // Validate ObjectId format for targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      logger.warn('Invalid ObjectId format for targetId:', { targetId, swiperId });
      return sendError(res, 400, {
        message: 'Invalid target user ID format',
        error: 'INVALID_ID',
      });
    }

    // Validate ObjectId format for swiperId
    if (!mongoose.Types.ObjectId.isValid(swiperId)) {
      logger.warn('Invalid ObjectId format for swiperId:', { swiperId });
      return sendError(res, 400, {
        message: 'Invalid user ID format',
        error: 'INVALID_ID',
      });
    }

    // Verify target user exists
    let targetUser;
    try {
      targetUser = await User.findById(targetId).select('_id').lean();
    } catch (error) {
      logger.error('Error finding target user', {
        error: error.message,
        stack: error.stack,
        targetId,
        swiperId,
      });
      return sendError(res, 500, {
        message: 'Error validating target user',
        error: 'VALIDATION_ERROR',
      });
    }

    if (!targetUser) {
      logger.warn('Target user not found', { targetId, swiperId });
      return sendError(res, 404, {
        message: 'Target user not found',
        error: 'USER_NOT_FOUND',
      });
    }

    // Check if user is premium using Subscription model
    const subscription = await Subscription.findOne({ userId: swiperId });
    const isPremium = subscription && subscription.isActive;

    // Check swipe limit for free users
    const limitCheck = await Swipe.canSwipe(swiperId, isPremium ?? false);
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

    logger.debug('Swipe processed', {
      swiperId,
      targetId,
      isMatch: result.isMatch,
      alreadyProcessed: result.alreadyProcessed,
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
      // Invalidate match cache for both users
      cache.invalidate(`matches:${swiperId}:*`);
      cache.invalidate(`matches:${targetId}:*`);
      logger.debug('Match cache invalidated for both users', { swiperId, targetId });

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
        remaining: (limitCheck.remaining ?? 0) - 1,
      },
    });
  } catch (error) {
    // Log error with full context
    logger.error('Error creating swipe', {
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      code: error.code,
      swiperId: req.user?.id,
      targetId: req.body?.targetId,
      action: req.body?.action,
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      logger.error('Validation error creating swipe:', {
        error: error.message,
        errors: error.errors,
        swiperId: req.user?.id,
        targetId: req.body?.targetId,
        action: req.body?.action,
      });
      return sendValidationError(res, error, 'Failed to create swipe: validation error');
    }

    if (error.name === 'CastError') {
      logger.error('Invalid ID format in swipe creation:', {
        error: error.message,
        path: error.path,
        value: error.value,
        swiperId: req.user?.id,
        targetId: req.body?.targetId,
      });
      return sendError(res, 400, {
        message: 'Invalid ID format',
        error: 'INVALID_ID',
      });
    }

    // Handle duplicate key errors (E11000) - should be rare with atomic operations
    if (error.code === 11000) {
      logger.warn('Duplicate swipe detected (race condition):', {
        error: error.message,
        keyValue: error.keyValue,
        swiperId: req.user?.id,
        targetId: req.body?.targetId,
      });
      // Return success since the swipe was already created
      return sendSuccess(res, 200, {
        message: 'Swipe already recorded',
        data: {
          swipeId: null,
          action: req.body?.action,
          isMatch: false,
          match: false,
          matchData: null,
          alreadyProcessed: true,
        },
      });
    }

    // Handle specific error messages
    if (error.message && error.message.includes('Cannot swipe on yourself')) {
      logger.warn('User attempted to swipe on themselves:', {
        userId: req.user?.id,
        targetId: req.body?.targetId,
      });
      return sendError(res, 400, {
        message: 'Cannot swipe on yourself',
        error: 'INVALID_SWIPE_TARGET',
      });
    }

    // Log the full error for debugging with enhanced context
    logger.error('Error creating swipe:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      swiperId: req.user?.id,
      targetId: req.body?.targetId,
      action: req.body?.action,
      // Additional context for debugging
      errorType: error.constructor?.name,
      errorKeys: Object.keys(error),
      // MongoDB specific error details
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      // Request context
      requestBody: req.body,
      requestMethod: req.method,
      requestPath: req.path,
      // User context
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection?.remoteAddress,
    });

    // Generic error response
    return sendError(res, 500, {
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong on our end. Please try again in a moment.'
          : `Internal server error: ${error.message}`,
      error: 'INTERNAL_SERVER_ERROR',
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
    logger.error('Error getting swipe count:', { error: error.message, stack: error.stack });
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
      return sendError(res, 400, { message: 'Missing required field: swipeId' });
    }

    const result = await SwipeService.undoSwipe(swipeId, userId);

    sendSuccess(res, 200, { message: 'Swipe undone successfully', data: result.undoneSwipe });
  } catch (error) {
    logger.error('Error undoing swipe:', { error: error.message, stack: error.stack });

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
    logger.error('Error getting user swipes:', { error: error.message, stack: error.stack });
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
    logger.error('Error getting received swipes:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving received swipes',
    });
  }
};

// Query timeout constant - MUST be less than Nginx proxy_read_timeout (90s)
// Reduced from 30s to 10s for better UX
const MATCH_QUERY_TIMEOUT_MS = 10000;
const DEFAULT_MATCH_LIMIT = 25;
const MAX_MATCH_LIMIT = 50;
const MATCH_CACHE_TTL = 120; // Cache matches for 2 minutes

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

    // Cache key includes all query parameters
    const cacheKey = `matches:${userId}:${status}:${sortBy}:${pageNum}:${resultLimit}`;

    // Try cache first for first page only (most common request)
    if (pageNum === 1) {
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.debug('Matches cache hit', { userId, cacheKey });
        return res.json(cached);
      }
    }

    // Optimized aggregation pipeline (faster than populate)
    const matches = await Match.aggregate([
      // Stage 1: Match filter (uses index: users + status)
      {
        $match: {
          users: new mongoose.Types.ObjectId(userId),
          status: status,
        },
      },

      // Stage 2: Sort (uses index: lastActivityAt for 'active' status)
      { $sort: sortBy === 'lastActivityAt' ? { lastActivityAt: -1 } : { createdAt: -1 } },

      // Stage 3: Pagination
      { $skip: skipCount },
      { $limit: resultLimit + 1 }, // +1 to check for more

      // Stage 4: Lookup users (only needed fields)
      {
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            {
              $project: {
                _id: 1,
                name: 1,
                age: 1,
                bio: 1,
                lastActive: 1,
                isOnline: 1,
                photos: { $slice: ['$photos', 1] }, // Only first photo for list view
              },
            },
          ],
          as: 'userDetails',
        },
      },

      // Stage 5: Project final shape
      {
        $project: {
          _id: 1,
          users: 1,
          createdAt: 1,
          matchType: 1,
          status: 1,
          conversationStarted: 1,
          lastActivityAt: 1,
          userDetails: 1,
        },
      },
    ])
      .maxTimeMS(MATCH_QUERY_TIMEOUT_MS)
      .allowDiskUse(true); // Allow disk use for large result sets

    // Get total count (only if needed for pagination)
    const totalCount =
      pageNum === 1
        ? await Match.countDocuments({
            users: userId,
            status: status,
          }).maxTimeMS(MATCH_QUERY_TIMEOUT_MS)
        : null;

    // Check if there are more results
    const hasMore = matches.length > resultLimit;
    const resultMatches = hasMore ? matches.slice(0, resultLimit) : matches;

    // Transform matches to include the other user's info prominently
    const transformedMatches = resultMatches.map((match) => {
      // Find the other user (not the requesting user)
      const otherUser = match.userDetails.find((u) => u._id.toString() !== userId);
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

    // Log slow queries (reduced threshold from 3s to 1s)
    if (queryTime > 1000) {
      logger.warn('Slow getMatches query', {
        userId,
        queryTime,
        matchCount: transformedMatches.length,
      });
    }

    const response = {
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
          cached: false,
        },
      },
    };

    // Cache first page for 2 minutes
    if (pageNum === 1) {
      cache.set(cacheKey, response, MATCH_CACHE_TTL);
      logger.debug('Matches cached', { userId, cacheKey, ttl: MATCH_CACHE_TTL });
    }

    res.json(response);
  } catch (error) {
    const queryTime = Date.now() - startTime;
    logger.error('Error getting matches', {
      error: error.message,
      stack: error.stack,
      queryTime,
      userId: req.user?.id,
    });

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
      return sendError(res, 503, {
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
      return sendError(res, 400, { message: 'Missing required parameter: matchId' });
    }

    // Get match first to know both users
    const match = await Match.findById(matchId);
    if (match) {
      // Invalidate match cache for both users before unmatching
      const userIds = match.users.map((u) => u.toString());
      userIds.forEach((uid) => {
        cache.invalidate(`matches:${uid}:*`);
      });
      logger.debug('Match cache invalidated for unmatch', { userIds });
    }

    await Match.unmatch(matchId, userId);
    const updatedMatch = await Match.findById(matchId);

    if (updatedMatch) {
      res.json({
        success: true,
        message: 'Successfully unmatched',
        data: {
          matchId: updatedMatch._id,
          status: updatedMatch.status,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }
  } catch (error) {
    logger.error('Error unmatching:', { error: error.message, stack: error.stack });

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
    logger.error('Error getting swipe stats:', { error: error.message, stack: error.stack });
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
    logger.error('Error getting pending likes:', { error: error.message, stack: error.stack });
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

const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * SwipeService - Handles the "Double-Opt-In" Match Transaction
 *
 * This service implements Tinder's core matching algorithm:
 * 1. Records swipe actions (LIKE, PASS, SUPERLIKE)
 * 2. When a LIKE is sent, checks if the target user has already liked the current user
 * 3. If mutual interest exists, creates a Match entry
 * 4. Returns isMatch flag to frontend for instant gratification
 *
 * RACE CONDITION PROTECTION:
 * - Uses atomic MongoDB operations (findOneAndUpdate with upsert)
 * - Handles duplicate key errors gracefully
 * - Returns existing swipe if user double-clicks rapidly
 */
class SwipeService {
  /**
   * Process a swipe action and check for matches
   * Uses atomic operations to prevent race conditions from rapid swipes
   *
   * @param {string} swiperId - The user performing the swipe
   * @param {string} targetId - The user being swiped on
   * @param {string} action - The swipe action ('like', 'pass', 'superlike')
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.isPriority] - Whether this is a priority like (premium feature)
   * @returns {Promise<Object>} Result with swipe data and match information
   */
  static async processSwipe(swiperId, targetId, action, options = { isPriority: false }) {
    const { isPriority = false } = options;
    const { logger } = require('../services/LoggingService');

    logger.debug('Processing swipe', { swiperId, targetId, action, isPriority });

    // Validate ObjectId format for swiperId
    if (!mongoose.Types.ObjectId.isValid(swiperId)) {
      logger.warn('Invalid swiperId format', { swiperId });
      throw new Error(`Invalid swiperId format: ${swiperId}`);
    }

    // Validate ObjectId format for targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      logger.warn('Invalid targetId format', { targetId });
      throw new Error(`Invalid targetId format: ${targetId}`);
    }

    // Validate that user isn't swiping on themselves
    if (swiperId.toString() === targetId.toString()) {
      logger.warn('User attempting to swipe on themselves', { swiperId, targetId });
      throw new Error('Cannot swipe on yourself');
    }

    // Verify both users exist before processing
    let swiper, target;
    try {
      [swiper, target] = await Promise.all([
        User.findById(swiperId).select('_id').lean(),
        User.findById(targetId).select('_id').lean(),
      ]);
    } catch (error) {
      logger.error('Error checking user existence', {
        error: error.message,
        stack: error.stack,
        swiperId,
        targetId,
      });
      throw new Error(`Error validating users: ${error.message}`);
    }

    if (!swiper) {
      logger.warn('Swiper user not found', { swiperId });
      throw new Error(`Swiper user not found: ${swiperId}`);
    }

    if (!target) {
      logger.warn('Target user not found', { targetId });
      throw new Error(`Target user not found: ${targetId}`);
    }

    // RACE CONDITION FIX: Use atomic createSwipeAtomic instead of find-then-save
    // This prevents duplicate swipes even with rapid clicks
    /** @type {any} */
    let swipeResult;
    try {
      swipeResult = await Swipe.createSwipeAtomic(
        /** @type {any} */ ({
          swiperId,
          swipedId: targetId,
          action,
          isPriority,
        })
      );
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000) gracefully
      // This can still happen in edge cases with high concurrency
      if (
        (error instanceof Error && 'code' in error
          ? error instanceof Error && 'code' in error
            ? error.code
            : 'UNKNOWN_ERROR'
          : 'UNKNOWN_ERROR') === 11000 ||
        (error instanceof Error
          ? error instanceof Error
            ? error.message
            : String(error)
          : String(error)
        )?.includes('duplicate key')
      ) {
        const existingSwipe = await Swipe.findOne({ swiperId, swipedId: targetId }).lean();
        if (existingSwipe) {
          // Return the existing swipe - user already swiped
          return {
            swipe: {
              id: existingSwipe._id,
              action: existingSwipe.action,
              createdAt: existingSwipe.createdAt,
            },
            isMatch: false,
            matchData: null,
            alreadyProcessed: true,
          };
        }
      }
      throw error;
    }

    // If swipe already existed, return early without reprocessing
    if (swipeResult.alreadyExists) {
      return {
        swipe: {
          id: swipeResult.swipe._id,
          action: swipeResult.swipe.action,
          createdAt: swipeResult.swipe.createdAt,
        },
        isMatch: false,
        matchData: null,
        alreadyProcessed: true,
      };
    }

    const swipe = swipeResult.swipe;

    // Track received like for "See Who Liked You" feature
    if (action === 'like' || action === 'superlike') {
      try {
        await User.findByIdAndUpdate(targetId, {
          $push: {
            receivedLikes: {
              fromUserId: swiperId,
              action: action,
              receivedAt: new Date(),
            },
          },
        });
      } catch (error) {
        // Log error but don't fail the swipe - receivedLikes is a nice-to-have feature
        // This can happen if user was deleted or there's a schema validation issue
        const { logger } = require('../services/LoggingService');
        logger.warn('Failed to update receivedLikes for user:', {
          targetId,
          swiperId,
          error: error.message,
          errorName: error.name,
        });
        // Continue processing - the swipe itself is more important
      }
    }

    // Check for match if it's a like or superlike
    let isMatch = false;
    let matchData = null;

    if (action === 'like' || action === 'superlike') {
      const matchResult = await this.checkAndCreateMatch(swiperId, targetId, action);
      isMatch = matchResult.isMatch;
      matchData = matchResult.matchData;
    }

    // Update user swipe statistics
    try {
      await User.findByIdAndUpdate(swiperId, {
        $inc: { totalSwipes: 1 },
      });
    } catch (error) {
      // Log error but don't fail the swipe - statistics update is secondary
      const { logger } = require('../services/LoggingService');
      logger.warn('Failed to update swipe statistics for user:', {
        swiperId,
        error: error.message,
        errorName: error.name,
      });
      // Continue processing - the swipe itself is more important
    }

    return {
      swipe: {
        id: swipe._id,
        action: action,
        createdAt: swipe.createdAt,
      },
      isMatch: isMatch,
      matchData: matchData,
      alreadyProcessed: false,
    };
  }

  /**
   * Check if a mutual like exists and create a match if so
   * This is the core "Double-Opt-In" logic
   *
   * @param {string} swiperId - The user who just swiped
   * @param {string} targetId - The user who was swiped on
   * @param {string} action - The swipe action
   * @returns {Promise<Object>} Match result with isMatch flag and match data
   */
  static async checkAndCreateMatch(swiperId, targetId, action) {
    const { logger } = require('../services/LoggingService');
    
    try {
      // Check if target user has already liked the current user
      const reverseSwipe = await Swipe.findOne({
        swiperId: targetId,
        swipedId: swiperId,
        action: { $in: ['like', 'superlike'] },
      }).lean();

      // No reverse like = no match
      if (!reverseSwipe) {
        return { isMatch: false, matchData: null };
      }

      // Mutual interest detected! Create the match
      const matchType =
        action === 'superlike' || reverseSwipe.action === 'superlike' ? 'superlike' : 'regular';

      let match;
      let isNew = false;
      let reactivated = false;

      try {
        const matchResult = await Match.createMatch(
          swiperId,
          targetId,
          swiperId, // The current swiper is the match initiator (they completed the match)
          matchType
        );
        match = matchResult.match;
        isNew = matchResult.isNew;
        reactivated = matchResult.reactivated;
      } catch (error) {
        logger.error('Failed to create match:', {
          swiperId,
          targetId,
          action,
          error: error.message,
          errorName: error.name,
          stack: error.stack,
        });
        // If match creation fails, return no match but don't fail the swipe
        return { isMatch: false, matchData: null };
      }

      // Update both users' match counts
      if (isNew || reactivated) {
        try {
          await Promise.all([
            User.findByIdAndUpdate(swiperId, {
              $inc: { totalMatches: 1 },
              $addToSet: { matches: targetId },
            }),
            User.findByIdAndUpdate(targetId, {
              $inc: { totalMatches: 1 },
              $addToSet: { matches: swiperId },
            }),
          ]);
        } catch (error) {
          // Log error but don't fail - match was created successfully
          logger.warn('Failed to update match counts for users:', {
            swiperId,
            targetId,
            error: error.message,
            errorName: error.name,
          });
          // Continue - the match itself is more important than the count
        }
      }

      // Get user info for the match response
      let matchedUser = null;
      try {
        matchedUser = await User.findById(targetId).select('name photos age bio').lean();
      } catch (error) {
        logger.warn('Failed to get matched user info:', {
          targetId,
          error: error.message,
          errorName: error.name,
        });
        // Continue with null user info - match is still valid
      }

      return {
        isMatch: true,
        matchData: {
          matchId: match._id,
          matchType: matchType,
          matchedAt: match.createdAt,
          isNewMatch: isNew,
          wasReactivated: reactivated,
          matchedUser: {
            id: targetId,
            name: matchedUser?.name || null,
            photo: matchedUser?.photos?.[0]?.url || null,
            age: matchedUser?.age || null,
          },
        },
      };
    } catch (error) {
      // Catch any unexpected errors in the match checking process
      logger.error('Unexpected error in checkAndCreateMatch:', {
        swiperId,
        targetId,
        action,
        error: error.message,
        errorName: error.name,
        stack: error.stack,
      });
      // Return no match rather than throwing - don't fail the swipe
      return { isMatch: false, matchData: null };
    }
  }

  /**
   * Get pending likes for a user (who liked them but they haven't swiped on yet)
   * Premium feature - "See Who Liked You"
   *
   * @param {string} userId - The user to get pending likes for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of users who liked this user
   */
  static async getPendingLikes(userId, options = {}) {
    const { limit = 50, skip = 0 } = options;

    // Find users who liked this user but haven't been swiped on yet
    const likes = await Swipe.find({
      swipedId: userId,
      action: { $in: ['like', 'superlike'] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the IDs of users who the current user has already swiped on
    const swipedUserIds = await Swipe.distinct('swipedId', { swiperId: userId });
    const swipedUserIdStrings = swipedUserIds.map((id) => id.toString());

    // Filter out users that have already been swiped on
    const pendingLikes = likes.filter(
      (like) => !swipedUserIdStrings.includes(like.swiperId.toString())
    );

    // Get user details for pending likes
    const userIds = pendingLikes.map((like) => like.swiperId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name photos age bio lastActive')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return pendingLikes.map((like) => ({
      likeId: like._id,
      action: like.action,
      likedAt: like.createdAt,
      user: userMap.get(like.swiperId.toString()),
    }));
  }

  /**
   * Undo a swipe (Rewind feature)
   *
   * @param {string} swipeId - The swipe to undo
   * @param {string} userId - The user requesting the undo
   * @returns {Promise<Object>} Result of the undo operation
   */
  static async undoSwipe(swipeId, userId) {
    const swipe = await Swipe.findById(swipeId);

    if (!swipe) {
      throw new Error('Swipe not found');
    }

    if (swipe.swiperId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to undo this swipe');
    }

    // If there was a match, we need to undo it too
    if (swipe.action === 'like' || swipe.action === 'superlike') {
      const existingMatch = await Match.matchExists(userId, swipe.swipedId.toString());
      if (existingMatch && typeof existingMatch === 'object') {
        await Match.unmatch(/** @type {any} */ (existingMatch)._id, userId);

        // Decrement match counts
        await Promise.all([
          User.findByIdAndUpdate(userId, {
            $inc: { totalMatches: -1 },
            $pull: { matches: swipe.swipedId },
          }),
          User.findByIdAndUpdate(swipe.swipedId, {
            $inc: { totalMatches: -1 },
            $pull: { matches: userId },
          }),
        ]);
      }

      // Remove from received likes
      await User.findByIdAndUpdate(swipe.swipedId, {
        $pull: {
          receivedLikes: { fromUserId: userId },
        },
      });
    }

    // Delete the swipe
    await Swipe.findByIdAndDelete(swipeId);

    // Decrement swipe count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalSwipes: -1 },
    });

    return {
      success: true,
      undoneSwipe: {
        targetId: swipe.swipedId,
        action: swipe.action,
      },
    };
  }

  /**
   * Get swipe statistics for a user
   *
   * @param {string} userId - The user to get stats for
   * @returns {Promise<Object>} Swipe statistics
   */
  static async getSwipeStats(userId) {
    const [
      totalSent,
      totalLikesSent,
      totalPassesSent,
      totalSuperLikesSent,
      totalReceived,
      totalLikesReceived,
      totalMatches,
    ] = await Promise.all([
      Swipe.countDocuments({ swiperId: userId }),
      Swipe.countDocuments({ swiperId: userId, action: 'like' }),
      Swipe.countDocuments({ swiperId: userId, action: 'pass' }),
      Swipe.countDocuments({ swiperId: userId, action: 'superlike' }),
      Swipe.countDocuments({ swipedId: userId }),
      Swipe.countDocuments({ swipedId: userId, action: { $in: ['like', 'superlike'] } }),
      Match.getMatchCount(userId),
    ]);

    const matchRate = totalLikesSent > 0 ? ((totalMatches / totalLikesSent) * 100).toFixed(1) : 0;

    return {
      sent: {
        total: totalSent,
        likes: totalLikesSent,
        passes: totalPassesSent,
        superLikes: totalSuperLikesSent,
      },
      received: {
        total: totalReceived,
        likes: totalLikesReceived,
      },
      matches: totalMatches,
      matchRate: parseFloat(String(matchRate)),
    };
  }
}

module.exports = SwipeService;

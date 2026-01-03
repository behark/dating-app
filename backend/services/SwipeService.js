const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const User = require('../models/User');

/**
 * SwipeService - Handles the "Double-Opt-In" Match Transaction
 * 
 * This service implements Tinder's core matching algorithm:
 * 1. Records swipe actions (LIKE, PASS, SUPERLIKE)
 * 2. When a LIKE is sent, checks if the target user has already liked the current user
 * 3. If mutual interest exists, creates a Match entry
 * 4. Returns isMatch flag to frontend for instant gratification
 */
class SwipeService {
  
  /**
   * Process a swipe action and check for matches
   * 
   * @param {string} swiperId - The user performing the swipe
   * @param {string} targetId - The user being swiped on
   * @param {string} action - The swipe action ('like', 'pass', 'superlike')
   * @param {Object} options - Additional options
   * @param {boolean} options.isPriority - Whether this is a priority like (premium feature)
   * @returns {Object} Result with swipe data and match information
   */
  static async processSwipe(swiperId, targetId, action, options = {}) {
    const { isPriority = false } = options;

    // Validate that user isn't swiping on themselves
    if (swiperId.toString() === targetId.toString()) {
      throw new Error('Cannot swipe on yourself');
    }

    // Check if swipe already exists
    const existingSwipe = await Swipe.findOne({
      swiperId: swiperId,
      swipedId: targetId
    }).lean();

    if (existingSwipe) {
      throw new Error('You have already swiped on this profile');
    }

    // Create the swipe record
    const swipe = new Swipe({
      swiperId: swiperId,
      swipedId: targetId,
      action: action,
      isPriority: isPriority,
      prioritySentAt: isPriority ? new Date() : undefined
    });

    await swipe.save();

    // Track received like for "See Who Liked You" feature
    if (action === 'like' || action === 'superlike') {
      await User.findByIdAndUpdate(
        targetId,
        {
          $push: {
            receivedLikes: {
              fromUserId: swiperId,
              action: action,
              receivedAt: new Date()
            }
          }
        }
      );
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
    await User.findByIdAndUpdate(swiperId, {
      $inc: { totalSwipes: 1 }
    });

    return {
      swipe: {
        id: swipe._id,
        action: action,
        createdAt: swipe.createdAt
      },
      isMatch: isMatch,
      matchData: matchData
    };
  }

  /**
   * Check if a mutual like exists and create a match if so
   * This is the core "Double-Opt-In" logic
   * 
   * @param {string} swiperId - The user who just swiped
   * @param {string} targetId - The user who was swiped on
   * @param {string} action - The swipe action
   * @returns {Object} Match result with isMatch flag and match data
   */
  static async checkAndCreateMatch(swiperId, targetId, action) {
    // Check if target user has already liked the current user
    const reverseSwipe = await Swipe.findOne({
      swiperId: targetId,
      swipedId: swiperId,
      action: { $in: ['like', 'superlike'] }
    }).lean();

    // No reverse like = no match
    if (!reverseSwipe) {
      return { isMatch: false, matchData: null };
    }

    // Mutual interest detected! Create the match
    const matchType = (action === 'superlike' || reverseSwipe.action === 'superlike') 
      ? 'superlike' 
      : 'regular';

    const { match, isNew, reactivated } = await Match.createMatch(
      swiperId,
      targetId,
      swiperId, // The current swiper is the match initiator (they completed the match)
      matchType
    );

    // Update both users' match counts
    if (isNew || reactivated) {
      await Promise.all([
        User.findByIdAndUpdate(swiperId, {
          $inc: { totalMatches: 1 },
          $addToSet: { matches: targetId }
        }),
        User.findByIdAndUpdate(targetId, {
          $inc: { totalMatches: 1 },
          $addToSet: { matches: swiperId }
        })
      ]);
    }

    // Get user info for the match response
    const matchedUser = await User.findById(targetId)
      .select('name photos age bio')
      .lean();

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
          name: matchedUser?.name,
          photo: matchedUser?.photos?.[0]?.url,
          age: matchedUser?.age
        }
      }
    };
  }

  /**
   * Get pending likes for a user (who liked them but they haven't swiped on yet)
   * Premium feature - "See Who Liked You"
   * 
   * @param {string} userId - The user to get pending likes for
   * @param {Object} options - Query options
   * @returns {Array} List of users who liked this user
   */
  static async getPendingLikes(userId, options = {}) {
    const { limit = 50, skip = 0 } = options;

    // Find users who liked this user but haven't been swiped on yet
    const likes = await Swipe.find({
      swipedId: userId,
      action: { $in: ['like', 'superlike'] }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get the IDs of users who the current user has already swiped on
    const swipedUserIds = await Swipe.distinct('swipedId', { swiperId: userId });
    const swipedUserIdStrings = swipedUserIds.map(id => id.toString());

    // Filter out users that have already been swiped on
    const pendingLikes = likes.filter(
      like => !swipedUserIdStrings.includes(like.swiperId.toString())
    );

    // Get user details for pending likes
    const userIds = pendingLikes.map(like => like.swiperId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name photos age bio lastActive')
      .lean();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return pendingLikes.map(like => ({
      likeId: like._id,
      action: like.action,
      likedAt: like.createdAt,
      user: userMap.get(like.swiperId.toString())
    }));
  }

  /**
   * Undo a swipe (Rewind feature)
   * 
   * @param {string} swipeId - The swipe to undo
   * @param {string} userId - The user requesting the undo
   * @returns {Object} Result of the undo operation
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
      const existingMatch = await Match.matchExists(userId, swipe.swipedId);
      if (existingMatch) {
        await Match.unmatch(existingMatch._id, userId);
        
        // Decrement match counts
        await Promise.all([
          User.findByIdAndUpdate(userId, {
            $inc: { totalMatches: -1 },
            $pull: { matches: swipe.swipedId }
          }),
          User.findByIdAndUpdate(swipe.swipedId, {
            $inc: { totalMatches: -1 },
            $pull: { matches: userId }
          })
        ]);
      }

      // Remove from received likes
      await User.findByIdAndUpdate(swipe.swipedId, {
        $pull: {
          receivedLikes: { fromUserId: userId }
        }
      });
    }

    // Delete the swipe
    await Swipe.findByIdAndDelete(swipeId);

    // Decrement swipe count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalSwipes: -1 }
    });

    return {
      success: true,
      undoneSwipe: {
        targetId: swipe.swipedId,
        action: swipe.action
      }
    };
  }

  /**
   * Get swipe statistics for a user
   * 
   * @param {string} userId - The user to get stats for
   * @returns {Object} Swipe statistics
   */
  static async getSwipeStats(userId) {
    const [
      totalSent,
      totalLikesSent,
      totalPassesSent,
      totalSuperLikesSent,
      totalReceived,
      totalLikesReceived,
      totalMatches
    ] = await Promise.all([
      Swipe.countDocuments({ swiperId: userId }),
      Swipe.countDocuments({ swiperId: userId, action: 'like' }),
      Swipe.countDocuments({ swiperId: userId, action: 'pass' }),
      Swipe.countDocuments({ swiperId: userId, action: 'superlike' }),
      Swipe.countDocuments({ swipedId: userId }),
      Swipe.countDocuments({ swipedId: userId, action: { $in: ['like', 'superlike'] } }),
      Match.getMatchCount(userId)
    ]);

    const matchRate = totalLikesSent > 0 
      ? ((totalMatches / totalLikesSent) * 100).toFixed(1)
      : 0;

    return {
      sent: {
        total: totalSent,
        likes: totalLikesSent,
        passes: totalPassesSent,
        superLikes: totalSuperLikesSent
      },
      received: {
        total: totalReceived,
        likes: totalLikesReceived
      },
      matches: totalMatches,
      matchRate: parseFloat(matchRate)
    };
  }
}

module.exports = SwipeService;

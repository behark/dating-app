const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  // The user who performed the swipe
  swiperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // The user who was swiped on
  swipedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // The action taken
  action: {
    type: String,
    enum: ['like', 'pass', 'superlike'],
    required: true,
  },

  // Premium feature: Priority Like flag
  isPriority: {
    type: Boolean,
    default: false,
  },
  prioritySentAt: Date,

  // Timestamp of the swipe
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // Automatically delete after 30 days (30 * 24 * 60 * 60 seconds)
  },
});

// Compound index for efficient queries - UNIQUE constraint prevents duplicates
swipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });

// Index for finding all swipes by a user
swipeSchema.index({ swiperId: 1, createdAt: -1 });

// Index for finding who swiped on a user
swipeSchema.index({ swipedId: 1, action: 1 });

// TD-003: Indexes for match rate and analytics queries
// Index for match rate queries by action and date
swipeSchema.index({ action: 1, createdAt: -1 }, { name: 'action_createdAt_metrics' });
// Compound index for mutual like lookup (match detection)
swipeSchema.index({ swiperId: 1, swipedId: 1, action: 1 }, { name: 'swiper_swiped_action_match' });

// TD-004: Optimized index for reverse match lookup (critical for match detection performance)
// Covers queries like: { swipedId: X, swiperId: Y, action: 'like' }
swipeSchema.index({ swipedId: 1, swiperId: 1, action: 1 }, { name: 'reverse_match_lookup' });
// Index for "who liked me" queries with action filter
swipeSchema.index({ swipedId: 1, action: 1, createdAt: -1 }, { name: 'who_liked_me' });

/**
 * RACE CONDITION FIX: Atomic swipe creation using findOneAndUpdate
 * This prevents duplicate swipes when user clicks rapidly
 * 
 * Uses MongoDB's atomic upsert with $setOnInsert to ensure only one swipe is created
 * even if multiple requests arrive simultaneously
 * 
 * @param {Object} swipeData - { swiperId, swipedId, action, isPriority }
 * @returns {Promise<{swipe: any, isNew: boolean, alreadyExists: boolean}>} { swipe, isNew } - The swipe document and whether it was newly created
 */
swipeSchema.statics.createSwipeAtomic = async function(swipeData) {
  const { swiperId, swipedId, action, isPriority = false } = swipeData;
  
  // Use findOneAndUpdate with upsert to atomically create or find existing swipe
  // $setOnInsert only sets fields if this is a new document (insert)
  // @ts-ignore - Mongoose static method context
  const result = await this.findOneAndUpdate(
    { 
      swiperId: swiperId, 
      swipedId: swipedId 
    },
    { 
      $setOnInsert: {
        swiperId: swiperId,
        swipedId: swipedId,
        action: action,
        isPriority: isPriority,
        prioritySentAt: isPriority ? new Date() : undefined,
        createdAt: new Date(),
      }
    },
    { 
      upsert: true,
      new: true,
      rawResult: true,  // Get the raw MongoDB result to check if upserted
      runValidators: true,
    }
  );
  
  // Check if this was a new insert or existing document
  /** @type {any} */
  const typedResult = result;
  const isNew = typedResult.lastErrorObject?.upserted != null;
  
  return {
    swipe: typedResult.value,
    isNew: isNew,
    alreadyExists: !isNew,
  };
};

// Static method to get swiped user IDs for a swiper
// @ts-ignore - Mongoose static method context
swipeSchema.statics.getSwipedUserIds = function (swiperId) {
  return this.distinct('swipedId', { swiperId });
};

// @ts-ignore - Mongoose static method context
// Static method to check if user has swiped on another user
swipeSchema.statics.hasSwiped = function (swiperId, swipedId) {
  return this.exists({ swiperId, swipedId });
};
// @ts-ignore - Mongoose static method context

// Static method to get mutual likes (matches)
swipeSchema.statics.getMatches = function (userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { swiperId: userId, action: 'like' },
          { swipedId: userId, action: 'like' },
        ],
      },
    },
    {
      $group: {
        _id: {
          user1: { $min: ['$swiperId', '$swipedId'] },
          user2: { $max: ['$swiperId', '$swipedId'] },
        },
        likes: {
          $push: {
            swiperId: '$swiperId',
            swipedId: '$swipedId',
            action: '$action',
            createdAt: '$createdAt',
          },
        },
      },
    },
    {
      $match: {
        'likes.1': { $exists: true }, // Must have at least 2 likes (mutual)
      },
    },
    {
      $project: {
        user1: '$_id.user1',
        user2: '$_id.user2',
        matchDate: { $max: '$likes.createdAt' },
      },
    },
  ]);
};

// Static method to get swipe count for today
swipeSchema.statics.getSwipeCountToday = async function (swiperId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
// @ts-ignore - Mongoose static method context

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.countDocuments({
    swiperId: swiperId,
    createdAt: { $gte: today, $lt: tomorrow },
  });
};

// Static method to check if user can swipe (freemium limit check)
/**
 * @param {string} swiperId 
 * @param {boolean} isPremium 
 * @returns {Promise<{canSwipe: boolean, remaining: number, used?: number}>}
 */
swipeSchema.statics.canSwipe = async function (swiperId, isPremium = false) {
  if (isPremium) {
    // @ts-ignore - Mongoose static method context
    return { canSwipe: true, remaining: -1 };
  }

  const DAILY_SWIPE_LIMIT = 50;
  /** @type {number} */
  const swipeCount = await this.getSwipeCountToday(swiperId);
  const remaining = Math.max(0, DAILY_SWIPE_LIMIT - swipeCount);

  return {
    canSwipe: swipeCount < DAILY_SWIPE_LIMIT,
    remaining: remaining,
    used: swipeCount,
  };
};

/**
 * @typedef {import('../types/index').SwipeDocument} SwipeDocument
 * @typedef {import('../types/index').SwipeModel} SwipeModel
 */

/** @type {SwipeModel} */
const SwipeModel = mongoose.model('Swipe', swipeSchema);

module.exports = SwipeModel;

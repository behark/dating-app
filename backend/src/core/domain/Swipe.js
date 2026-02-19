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
/** @this {any} */
swipeSchema.statics.createSwipeAtomic = async function (swipeData) {
  const { swiperId, swipedId, action, isPriority = false } = swipeData;

  // Use findOneAndUpdate with upsert to atomically create or find existing swipe
  // $setOnInsert only sets fields if this is a new document (insert)
  const beforeTime = new Date();
  const result = await this.findOneAndUpdate(
    {
      swiperId: swiperId,
      swipedId: swipedId,
    },
    {
      $setOnInsert: {
        swiperId: swiperId,
        swipedId: swipedId,
        action: action,
        isPriority: isPriority,
        prioritySentAt: isPriority ? new Date() : undefined,
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  // In Mongoose 8.x, result is the document directly (not wrapped in rawResult)
  // Check if this was a new insert by comparing createdAt timestamp
  // If createdAt is very recent (within 2 seconds of beforeTime), it's likely a new document
  // This works because $setOnInsert only sets createdAt on insert, not on update
  let swipe = result;
  if (!swipe) {
    // Fallback: if result is null, find the document
    swipe = await this.findOne({ swiperId, swipedId });
    if (!swipe) {
      throw new Error('Failed to create or find swipe document');
    }
  }

  // Determine if document was newly created
  // Check if createdAt is very recent (within 2 seconds) - this indicates a new insert
  const createdAt = swipe.createdAt instanceof Date ? swipe.createdAt : new Date(swipe.createdAt);
  const timeDiff = Math.abs(beforeTime.getTime() - createdAt.getTime());
  const isNew = timeDiff < 2000; // Within 2 seconds = likely new document

  return {
    swipe: swipe,
    isNew: isNew,
    alreadyExists: !isNew,
  };
};

// Static method to get swiped user IDs for a swiper
// @ts-ignore - Mongoose static method context
// @ts-ignore
swipeSchema.statics.getSwipedUserIds = function (swiperId) {
  // @ts-ignore
  return this.distinct('swipedId', { swiperId });
};

// @ts-ignore - Mongoose static method context
// Static method to check if user has swiped on another user
// @ts-ignore
swipeSchema.statics.hasSwiped = function (swiperId, swipedId) {
  // @ts-ignore
  return this.exists({ swiperId, swipedId });
};
// @ts-ignore - Mongoose static method context

// Static method to get mutual likes (matches)
// @ts-ignore
swipeSchema.statics.getMatches = function (userId) {
  // @ts-ignore
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
// @ts-ignore
swipeSchema.statics.getSwipeCountToday = async function (swiperId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // @ts-ignore - Mongoose static method context

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // @ts-ignore
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
// @ts-ignore
swipeSchema.statics.canSwipe = async function (swiperId, isPremium = false) {
  if (isPremium) {
    // @ts-ignore - Mongoose static method context
    return { canSwipe: true, remaining: -1 };
  }

  const DAILY_SWIPE_LIMIT = 50;
  /** @type {number} */
  // @ts-ignore
  const swipeCount = await this.getSwipeCountToday(swiperId);
  const remaining = Math.max(0, DAILY_SWIPE_LIMIT - swipeCount);

  return {
    canSwipe: swipeCount < DAILY_SWIPE_LIMIT,
    remaining: remaining,
    used: swipeCount,
  };
};

/**
 * @typedef {import('../../../types/index').SwipeDocument} SwipeDocument
 * @typedef {import('../../../types/index').SwipeModel} SwipeModel
 */

/** @type {SwipeModel} */
// @ts-ignore
const SwipeModel = mongoose.model('Swipe', swipeSchema);

module.exports = SwipeModel;

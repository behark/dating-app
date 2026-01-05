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

// Compound index for efficient queries
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

// Prevent duplicate swipes between same users
swipeSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingSwipe = await this.constructor.findOne({
      swiperId: this.swiperId,
      swipedId: this.swipedId,
    });

    if (existingSwipe) {
      const error = new Error('User has already swiped on this profile');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to get swiped user IDs for a swiper
swipeSchema.statics.getSwipedUserIds = function (swiperId) {
  return this.distinct('swipedId', { swiperId });
};

// Static method to check if user has swiped on another user
swipeSchema.statics.hasSwiped = function (swiperId, swipedId) {
  return this.exists({ swiperId, swipedId });
};

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

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.countDocuments({
    swiperId: swiperId,
    createdAt: { $gte: today, $lt: tomorrow },
  });
};

// Static method to check if user can swipe (freemium limit check)
swipeSchema.statics.canSwipe = async function (swiperId, isPremium = false) {
  if (isPremium) {
    return { canSwipe: true, remaining: -1 };
  }

  const DAILY_SWIPE_LIMIT = 50;
  const swipeCount = await this.getSwipeCountToday(swiperId);
  const remaining = Math.max(0, DAILY_SWIPE_LIMIT - swipeCount);

  return {
    canSwipe: swipeCount < DAILY_SWIPE_LIMIT,
    remaining: remaining,
    used: swipeCount,
  };
};

module.exports = mongoose.model('Swipe', swipeSchema);

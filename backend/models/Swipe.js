const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  // The user who performed the swipe
  swiperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // The user who was swiped on
  swipedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // The action taken
  action: {
    type: String,
    enum: ['like', 'pass', 'superlike'],
    required: true
  },

  // Timestamp of the swipe
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Automatically delete after 30 days (30 * 24 * 60 * 60 seconds)
  }
});

// Compound index for efficient queries
swipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });

// Index for finding all swipes by a user
swipeSchema.index({ swiperId: 1, createdAt: -1 });

// Index for finding who swiped on a user
swipeSchema.index({ swipedId: 1, action: 1 });

// Prevent duplicate swipes between same users
swipeSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingSwipe = await this.constructor.findOne({
      swiperId: this.swiperId,
      swipedId: this.swipedId
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
swipeSchema.statics.getSwipedUserIds = function(swiperId) {
  return this.distinct('swipedId', { swiperId });
};

// Static method to check if user has swiped on another user
swipeSchema.statics.hasSwiped = function(swiperId, swipedId) {
  return this.exists({ swiperId, swipedId });
};

// Static method to get mutual likes (matches)
swipeSchema.statics.getMatches = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { swiperId: userId, action: 'like' },
          { swipedId: userId, action: 'like' }
        ]
      }
    },
    {
      $group: {
        _id: {
          user1: { $min: ['$swiperId', '$swipedId'] },
          user2: { $max: ['$swiperId', '$swipedId'] }
        },
        likes: {
          $push: {
            swiperId: '$swiperId',
            swipedId: '$swipedId',
            action: '$action',
            createdAt: '$createdAt'
          }
        }
      }
    },
    {
      $match: {
        'likes.1': { $exists: true } // Must have at least 2 likes (mutual)
      }
    },
    {
      $project: {
        user1: '$_id.user1',
        user2: '$_id.user2',
        matchDate: { $max: '$likes.createdAt' }
      }
    }
  ]);
};

module.exports = mongoose.model('Swipe', swipeSchema);
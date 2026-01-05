const mongoose = require('mongoose');

const swipeStreakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastSwipeDate: {
    type: Date,
    default: null,
  },
  streakStartDate: {
    type: Date,
    default: null,
  },
  swipesInCurrentStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalSwipes: {
    type: Number,
    default: 0,
    min: 0,
  },
  swipeHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      swipeCount: {
        type: Number,
        default: 0,
      },
    },
  ],
  streakBrokenCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  notifiedAboutStreak: {
    type: Boolean,
    default: false,
  },
  notifiedAboutMilestone: {
    type: Boolean,
    default: false,
  },
  milestoneReached: {
    type: Number,
    default: null, // e.g., 7, 14, 30, 60, 100
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
swipeStreakSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
swipeStreakSchema.index({ userId: 1 });
swipeStreakSchema.index({ currentStreak: -1 }); // For leaderboards
swipeStreakSchema.index({ longestStreak: -1 }); // For leaderboards
swipeStreakSchema.index({ lastSwipeDate: -1 });

module.exports = mongoose.model('SwipeStreak', swipeStreakSchema);

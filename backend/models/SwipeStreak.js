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
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
// Note: userId index is automatically created by unique: true, so we don't need to add it explicitly
swipeStreakSchema.index({ currentStreak: -1 }); // For leaderboards
swipeStreakSchema.index({ longestStreak: -1 }); // For leaderboards
swipeStreakSchema.index({ lastSwipeDate: -1 });

/**
 * @typedef {import('../types/index').SwipeStreakDocument} SwipeStreakDocument
 * @typedef {import('../types/index').SwipeStreakModel} SwipeStreakModel
 */

/** @type {SwipeStreakModel} */
// @ts-ignore
const SwipeStreakModel = mongoose.model('SwipeStreak', swipeStreakSchema);

module.exports = SwipeStreakModel;

const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    // The user whose activity is being tracked
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Type of activity
    activityType: {
      type: String,
      enum: [
        'login',
        'profile_view',
        'swipe',
        'message',
        'match',
        'super_like',
        'video_call',
        'profile_update',
        'logout',
      ],
      required: true,
    },

    // Related entity (user who was viewed, matched with, etc.)
    relatedUserId: mongoose.Schema.Types.ObjectId,

    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed,

    // Timestamp of activity
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 7776000, // Auto-delete after 90 days (90 * 24 * 60 * 60 seconds)
    },
  },
  {
    timestamps: false, // Only use createdAt
  }
);

// Indexes for efficient queries
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 });

// TD-003: Additional indexes for retention queries
// Optimized for DAU/WAU/MAU distinct queries
userActivitySchema.index({ createdAt: -1, userId: 1 }, { name: 'createdAt_userId_dau' });
// Optimized for retention cohort queries (userId $in with createdAt range)
userActivitySchema.index({ userId: 1, createdAt: 1 }, { name: 'userId_createdAt_retention' });

// Static method to get recently active users
userActivitySchema.statics.getRecentlyActiveUsers = async function (
  lookbackHours = 24,
  limit = 50
) {
  const timeframe = new Date();
  timeframe.setHours(timeframe.getHours() - lookbackHours);

  // @ts-ignore - Mongoose static method context
  return await this.aggregate([
    {
      $match: {
        activityType: { $in: ['login', 'message', 'swipe', 'profile_view'] },
        createdAt: { $gte: timeframe },
      },
    },
    {
      $group: {
        _id: '$userId',
        lastActivityAt: { $max: '$createdAt' },
        activityCount: { $sum: 1 },
      },
    },
    {
      $sort: { lastActivityAt: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 1,
        lastActivityAt: 1,
        activityCount: 1,
        userName: '$user.name',
        userAge: '$user.age',
        userPhotos: '$user.photos',
        userLocation: '$user.location',
        userIsVerified: '$user.isProfileVerified',
      },
    },
  ]);
};

// Static method to log activity
userActivitySchema.statics.logActivity = async function (userId, activityType, metadata = {}) {
  // @ts-ignore - Mongoose static method context
  // @ts-ignore
  try {
    // @ts-ignore
    await this.create({
      userId,
      activityType,
      metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Static method to get user's recent activity
userActivitySchema.statics.getUserRecentActivity = function (
  userId,
  limit = 20,
  hoursBack = 7 * 24
) {
  const timeframe = new Date();
  // @ts-ignore - Mongoose static method context
  timeframe.setHours(timeframe.getHours() - hoursBack);

  // @ts-ignore
  return this.find({
    userId,
    createdAt: { $gte: timeframe },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get activity summary for a user
userActivitySchema.statics.getActivitySummary = async function (userId, days = 7) {
  const timeframe = new Date();
  timeframe.setDate(timeframe.getDate() - days);

  // Convert userId string to ObjectId safely
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? mongoose.Types.ObjectId.createFromHexString
      ? mongoose.Types.ObjectId.createFromHexString(userId)
      : // @ts-ignore - Mongoose static method context
        new mongoose.Types.ObjectId(userId)
    : userId;

  // @ts-ignore
  return await this.aggregate([
    {
      $match: {
        userId: userObjectId,
        createdAt: { $gte: timeframe },
      },
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * @typedef {import('../types/index').UserActivityDocument} UserActivityDocument
 * @typedef {import('../types/index').UserActivityModel} UserActivityModel
 */

/** @type {UserActivityModel} */
// @ts-ignore
const UserActivityModel = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivityModel;

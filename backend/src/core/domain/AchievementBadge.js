const mongoose = require('mongoose');

const achievementBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  badgeType: {
    type: String,
    enum: [
      'first_match', // Earned on first match
      'matchmaker', // 10 matches
      'socialite', // 25 matches
      'legend', // 50 matches
      'swipe_master', // 100 swipes in a day
      'swipe_legend', // 500 total swipes
      'streak_champion_7', // 7-day swipe streak
      'streak_champion_30', // 30-day swipe streak
      'streak_champion_100', // 100-day swipe streak
      'conversation_starter', // First message exchanged
      'chat_enthusiast', // 10 conversations
      'profile_perfectionist', // Complete profile (photos, bio, interests)
      'early_adopter', // Joined in first 30 days of feature
      'group_date_host', // Created first group date
      'event_attendee', // Attended first event
      'friend_reviewer', // Left first friend review
      'social_butterfly', // 5 friends in friends list
      'connector', // Recommended a friend
      'verified_user', // Completed profile verification
    ],
    required: true,
  },
  badgeName: {
    type: String,
    required: true,
  },
  badgeDescription: {
    type: String,
    required: true,
  },
  badgeIcon: {
    type: String,
    required: true, // URL or emoji representing the badge
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  progressRequired: {
    type: Number,
    required: true, // e.g., matches needed for matchmaker badge
  },
  progressCurrent: {
    type: Number,
    default: 0,
  },
  isUnlocked: {
    type: Boolean,
    default: false,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  points: {
    type: Number,
    default: 0, // Bonus points for unlocking
  },
  metadata: {
    relatedAchievementId: mongoose.Schema.Types.ObjectId,
    triggerEvent: String, // e.g., 'match_created', 'message_sent'
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

// Compound index for efficient queries
achievementBadgeSchema.index({ userId: 1, isUnlocked: 1 });
achievementBadgeSchema.index({ userId: 1, badgeType: 1 }, { unique: true });
achievementBadgeSchema.index({ isUnlocked: -1, unlockedAt: -1 });

achievementBadgeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * @typedef {import('../../../types/index').AchievementBadgeDocument} AchievementBadgeDocument
 * @typedef {import('../../../types/index').AchievementBadgeModel} AchievementBadgeModel
 */

/** @type {AchievementBadgeModel} */
// @ts-ignore
const AchievementBadgeModel = mongoose.model('AchievementBadge', achievementBadgeSchema);

module.exports = AchievementBadgeModel;

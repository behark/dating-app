const mongoose = require('mongoose');

const friendReviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match', // Reference to the match if review is about a match
  },
  groupDateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupDate', // Reference to group date if review is about a group date experience
  },
  reviewType: {
    type: String,
    enum: ['private_match', 'friend_opinion', 'group_date_participant'],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  categories: {
    friendliness: {
      type: Number,
      min: 1,
      max: 5,
    },
    authenticity: {
      type: Number,
      min: 1,
      max: 5,
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5,
    },
    conversationSkills: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  pros: [String], // Tags like 'Good listener', 'Punctual', 'Funny'
  cons: [String], // Tags like 'Talks too much', 'Inattentive'
  wouldRecommend: {
    type: Boolean,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: true, // Can reviewee see this review?
  },
  isVerified: {
    type: Boolean,
    default: false, // Verified reviews show the match actually happened
  },
  verificationProof: {
    type: String,
    enum: ['mutual_match', 'group_date_attendance', 'message_exchange'],
    default: null,
  },
  helpful: {
    type: Number,
    default: 0, // Upvote count
  },
  unhelpful: {
    type: Number,
    default: 0, // Downvote count
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
    enum: ['inappropriate', 'fake', 'spam', 'harassing'],
    default: null,
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
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

// Unique constraint: one review per reviewer-reviewee pair per context
friendReviewSchema.index(
  { reviewerId: 1, revieweeId: 1, matchId: 1 },
  { unique: true, sparse: true }
);
friendReviewSchema.index({ revieweeId: 1, isPublic: 1 });
friendReviewSchema.index({ reviewId: 1 });
friendReviewSchema.index({ isVerified: 1, moderationStatus: 1 });
friendReviewSchema.index({ createdAt: -1 });

friendReviewSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * @typedef {import('../../../types/index').FriendReviewDocument} FriendReviewDocument
 * @typedef {import('../../../types/index').FriendReviewModel} FriendReviewModel
 */

/** @type {FriendReviewModel} */
// @ts-ignore
const FriendReviewModel = mongoose.model('FriendReview', friendReviewSchema);

module.exports = FriendReviewModel;

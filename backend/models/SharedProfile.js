const mongoose = require('mongoose');

const sharedProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sharedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shareMethod: {
    type: String,
    enum: ['link', 'qr_code', 'social_media', 'email', 'direct_message', 'public_link'],
    required: true,
  },
  shareToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'whatsapp', 'telegram', 'email', 'link', 'qr'],
    default: 'link',
  },
  recipientInfo: {
    email: String,
    phoneNumber: String,
    externalUserId: String,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  viewHistory: [
    {
      viewedAt: {
        type: Date,
        default: Date.now,
      },
      viewerInfo: {
        ipAddress: String,
        userAgent: String,
        location: String,
      },
    },
  ],
  isPublic: {
    type: Boolean,
    default: false,
  },
  allowComments: {
    type: Boolean,
    default: false,
  },
  allowMessaging: {
    type: Boolean,
    default: true,
  },
  customMessage: {
    type: String,
    maxlength: 300,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  trackingEnabled: {
    type: Boolean,
    default: true,
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

// Indexes for efficient queries
sharedProfileSchema.index({ userId: 1 });
sharedProfileSchema.index({ shareToken: 1 }, { unique: true });
sharedProfileSchema.index({ sharedByUserId: 1 });
sharedProfileSchema.index({ createdAt: -1 });

sharedProfileSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// TTL index to auto-delete expired share links after 30 days (includes expiresAt index)
sharedProfileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * @typedef {import('../types/index').SharedProfileDocument} SharedProfileDocument
 * @typedef {import('../types/index').SharedProfileModel} SharedProfileModel
 */

/** @type {SharedProfileModel} */
const SharedProfileModel = mongoose.model('SharedProfile', sharedProfileSchema);

module.exports = SharedProfileModel;

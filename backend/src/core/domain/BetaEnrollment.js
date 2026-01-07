const mongoose = require('mongoose');

const betaEnrollmentSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true,
      index: true,
    },

    // Email
    email: {
      type: String,
      required: true,
    },

    // Name
    name: {
      type: String,
      required: true,
    },

    // Beta tier
    tier: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard',
    },

    // Features user has access to
    features: {
      type: [String],
      default: ['all'],
    },

    // Device info
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Consent preferences
    consent: {
      dataCollection: { type: Boolean, default: true },
      crashReporting: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      screenshots: { type: Boolean, default: false },
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BetaEnrollment', betaEnrollmentSchema);

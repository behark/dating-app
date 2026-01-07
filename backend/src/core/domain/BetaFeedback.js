const mongoose = require('mongoose');

const betaFeedbackSchema = new mongoose.Schema(
  {
    // User who submitted feedback
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },

    // Feedback type
    type: {
      type: String,
      required: true,
      enum: ['general', 'feature', 'bug', 'suggestion'],
      index: true,
    },

    // Category
    category: {
      type: String,
      required: true,
    },

    // Title
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Description
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    // Rating (1-5)
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Screenshot (base64 or URL)
    screenshot: {
      type: String,
      default: null,
    },

    // Screen name where feedback was submitted
    screenName: {
      type: String,
      default: null,
    },

    // Device info
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // App version
    appVersion: {
      type: String,
      default: null,
    },

    // Tags
    tags: {
      type: [String],
      default: [],
    },

    // Status
    status: {
      type: String,
      enum: ['new', 'reviewing', 'acknowledged', 'implemented', 'wont-fix'],
      default: 'new',
      index: true,
    },

    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: null,
    },

    // Assigned to
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Notes (admin)
    notes: {
      type: String,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
betaFeedbackSchema.index({ userId: 1, createdAt: -1 });
betaFeedbackSchema.index({ type: 1, status: 1, createdAt: -1 });
betaFeedbackSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('BetaFeedback', betaFeedbackSchema);

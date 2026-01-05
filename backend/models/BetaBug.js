const mongoose = require('mongoose');

const betaBugSchema = new mongoose.Schema(
  {
    // User who reported bug
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
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

    // Severity
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    // Reproducibility
    reproducibility: {
      type: String,
      enum: ['always', 'sometimes', 'rarely'],
      default: 'sometimes',
    },

    // Steps to reproduce
    stepsToReproduce: {
      type: [String],
      default: [],
    },

    // Expected behavior
    expectedBehavior: {
      type: String,
      maxlength: 1000,
    },

    // Actual behavior
    actualBehavior: {
      type: String,
      maxlength: 1000,
    },

    // Screenshot
    screenshot: {
      type: String,
      default: null,
    },

    // Screen recording
    screenRecording: {
      type: String,
      default: null,
    },

    // Logs
    logs: {
      type: [String],
      default: [],
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

    // OS version
    osVersion: {
      type: String,
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ['new', 'confirmed', 'in_progress', 'fixed', 'wont-fix', 'duplicate'],
      default: 'new',
      index: true,
    },

    // Assigned to
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
betaBugSchema.index({ userId: 1, createdAt: -1 });
betaBugSchema.index({ severity: 1, status: 1, createdAt: -1 });
betaBugSchema.index({ status: 1, assignee: 1 });

module.exports = mongoose.model('BetaBug', betaBugSchema);

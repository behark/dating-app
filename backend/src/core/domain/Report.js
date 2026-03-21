const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'harassment',
        'spam',
        'inappropriate_content',
        'fake_profile',
        'scam',
        'underage',
        'threatening',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    evidence: [
      {
        type: String, // URLs to screenshots or other evidence
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warning', 'temporary_ban', 'permanent_ban'],
      default: 'none',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

// Compound index for admin moderation queue (pending reports, newest first)
reportSchema.index({ status: 1, createdAt: -1 }, { name: 'moderation_queue' });

// Compound index for checking if user was already reported by another user
reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { name: 'reporter_reported_pair' });

/**
 * @typedef {import('../../../types/index').ReportDocument} ReportDocument
 * @typedef {import('../../../types/index').ReportModel} ReportModel
 */

/** @type {ReportModel} */
// @ts-ignore
const ReportModel = mongoose.model('Report', reportSchema);

module.exports = ReportModel;

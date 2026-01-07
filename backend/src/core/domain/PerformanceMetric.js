/**
 * Performance Metric Model
 * Stores performance metrics for API requests and database queries
 */

const mongoose = require('mongoose');

const performanceMetricSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['api_request', 'database_query', 'cache_operation', 'external_api_call'],
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true, // Duration in milliseconds
      index: true,
    },
    statusCode: {
      type: Number,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isSlow: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVerySlow: {
      type: Boolean,
      default: false,
      index: true,
    },
    isError: {
      type: Boolean,
      default: false,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
performanceMetricSchema.index({ type: 1, timestamp: -1 });
performanceMetricSchema.index({ endpoint: 1, timestamp: -1 });
performanceMetricSchema.index({ isSlow: 1, timestamp: -1 });
performanceMetricSchema.index({ isVerySlow: 1, timestamp: -1 });
performanceMetricSchema.index({ isError: 1, timestamp: -1 });
performanceMetricSchema.index({ userId: 1, timestamp: -1 });

// TTL index to automatically delete old metrics (30 days)
performanceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Static method to get slow requests
performanceMetricSchema.statics.getSlowRequests = function (startDate, endDate, limit = 100) {
  // @ts-ignore - Mongoose static method typing
  return this.find({
    type: 'api_request',
    isSlow: true,
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .sort({ duration: -1 })
    .limit(limit)
    .lean();
};

// Static method to get slow queries
performanceMetricSchema.statics.getSlowQueries = function (startDate, endDate, limit = 100) {
  // @ts-ignore - Mongoose static method typing
  return this.find({
    type: 'database_query',
    isSlow: true,
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .sort({ duration: -1 })
    .limit(limit)
    .lean();
};

// Static method to get performance summary
performanceMetricSchema.statics.getPerformanceSummary = async function (
  startDate,
  endDate,
  groupBy = 'endpoint'
) {
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: `$${groupBy}`,
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        minDuration: { $min: '$duration' },
        maxDuration: { $max: '$duration' },
        p95Duration: { $percentile: { input: '$duration', p: [0.95], method: 'approximate' } },
        p99Duration: { $percentile: { input: '$duration', p: [0.99], method: 'approximate' } },
        slowCount: { $sum: { $cond: ['$isSlow', 1, 0] } },
        verySlowCount: { $sum: { $cond: ['$isVerySlow', 1, 0] } },
        errorCount: { $sum: { $cond: ['$isError', 1, 0] } },
      },
    },
    {
      $sort: { avgDuration: -1 },
    },
  ];

  // @ts-ignore - Mongoose static method typing
  return this.aggregate(pipeline);
};

// Static method to get average response times by endpoint
performanceMetricSchema.statics.getAverageResponseTimes = function (startDate, endDate) {
  // @ts-ignore - Mongoose static method typing
  return this.aggregate([
    {
      $match: {
        type: 'api_request',
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$endpoint',
        avgDuration: { $avg: '$duration' },
        count: { $sum: 1 },
        slowCount: { $sum: { $cond: ['$isSlow', 1, 0] } },
      },
    },
    {
      $sort: { avgDuration: -1 },
    },
  ]);
};

const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema);

module.exports = PerformanceMetric;

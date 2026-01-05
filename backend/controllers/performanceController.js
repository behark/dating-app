/**
 * Performance Controller
 * Handles performance metrics endpoints
 */

const PerformanceMetric = require('../models/PerformanceMetric');
const { getPerformanceMetrics } = require('../middleware/performanceMonitoring');
const { logger } = require('../services/LoggingService');

/**
 * Get real-time performance metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting performance metrics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
    });
  }
};

/**
 * Get slow requests
 */
exports.getSlowRequests = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate ? new Date(endDate) : new Date();

    const slowRequests = await PerformanceMetric.getSlowRequests(start, end, parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        slowRequests,
        count: slowRequests.length,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting slow requests', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow requests',
    });
  }
};

/**
 * Get slow database queries
 */
exports.getSlowQueries = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate ? new Date(endDate) : new Date();

    const slowQueries = await PerformanceMetric.getSlowQueries(start, end, parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        slowQueries,
        count: slowQueries.length,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting slow queries', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow queries',
    });
  }
};

/**
 * Get performance summary
 */
exports.getPerformanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'endpoint' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await PerformanceMetric.getPerformanceSummary(start, end, groupBy);

    res.json({
      success: true,
      data: {
        summary,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        groupBy,
      },
    });
  } catch (error) {
    logger.error('Error getting performance summary', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance summary',
    });
  }
};

/**
 * Get average response times by endpoint
 */
exports.getAverageResponseTimes = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate ? new Date(endDate) : new Date();

    const averages = await PerformanceMetric.getAverageResponseTimes(start, end);

    res.json({
      success: true,
      data: {
        averages,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting average response times', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get average response times',
    });
  }
};

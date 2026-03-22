/**
 * Metrics Routes
 * API endpoints for accessing analytics metrics
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { analyticsMetricsService } = require('../../core/services/AnalyticsMetricsService');
const { authenticate, isAdmin } = require('../middleware/auth');
const { logger } = require('../../infrastructure/external/LoggingService');

// All metrics routes require authentication and admin role
router.use(authenticate);

/**
 * @route   GET /api/metrics/dashboard
 * @desc    Get comprehensive metrics dashboard
 * @access  Private (Admin)
 */
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : new Date();

    const dashboard = await analyticsMetricsService.getDashboardMetrics(
      /** @type {any} */ (start),
      end
    );

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching dashboard metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard metrics',
    });
  }
});

/**
 * @route   GET /api/metrics/dau
 * @desc    Get Daily Active Users
 * @access  Private (Admin)
 */
router.get('/dau', isAdmin, async (req, res) => {
  try {
    const date = /** @type {string} */ (req.query.date);
    const targetDate = date ? new Date(date) : new Date();

    const dau = await analyticsMetricsService.getDailyActiveUsers(targetDate);

    res.json({
      success: true,
      data: dau,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching DAU:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching DAU',
    });
  }
});

/**
 * @route   GET /api/metrics/active-users
 * @desc    Get DAU, WAU, MAU together
 * @access  Private (Admin)
 */
router.get('/active-users', isAdmin, async (req, res) => {
  try {
    const [dau, wau, mau] = await Promise.all([
      analyticsMetricsService.getDailyActiveUsers(),
      analyticsMetricsService.getWeeklyActiveUsers(),
      analyticsMetricsService.getMonthlyActiveUsers(),
    ]);

    res.json({
      success: true,
      data: {
        dau,
        wau,
        mau,
        stickiness: mau.count > 0 ? parseFloat(((dau.count / mau.count) * 100).toFixed(2)) : 0,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching active users:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching active users',
    });
  }
});

/**
 * @route   GET /api/metrics/retention
 * @desc    Get retention metrics (D1, D7, D30)
 * @access  Private (Admin)
 */
router.get('/retention', isAdmin, async (req, res) => {
  try {
    const cohortDate = /** @type {string} */ (req.query.cohortDate);
    const days = /** @type {string} */ (req.query.days);

    const targetDate = cohortDate
      ? new Date(cohortDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const retentionDays = days ? days.split(',').map(Number) : [1, 7, 30];

    const retention = await analyticsMetricsService.getRetentionRate(targetDate, retentionDays);

    res.json({
      success: true,
      data: retention,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching retention:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching retention metrics',
    });
  }
});

/**
 * @route   GET /api/metrics/retention/rolling
 * @desc    Get rolling retention
 * @access  Private (Admin)
 */
router.get('/retention/rolling', isAdmin, async (req, res) => {
  try {
    const days = /** @type {string} */ (req.query.days);
    const lookbackDays = days ? parseInt(days) : 30;

    const retention = await analyticsMetricsService.getRollingRetention(lookbackDays);

    res.json({
      success: true,
      data: retention,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching rolling retention:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching rolling retention',
    });
  }
});

/**
 * @route   GET /api/metrics/matches
 * @desc    Get match rate metrics
 * @access  Private (Admin)
 */
router.get('/matches', isAdmin, async (req, res) => {
  try {
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [matchRate, swipeConversion] = await Promise.all([
      analyticsMetricsService.getMatchRate(start, end),
      analyticsMetricsService.getSwipeToMatchConversion(start, end),
    ]);

    res.json({
      success: true,
      data: {
        matchRate,
        swipeConversion,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching match metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching match metrics',
    });
  }
});

/**
 * @route   GET /api/metrics/messages
 * @desc    Get messaging metrics
 * @access  Private (Admin)
 */
router.get('/messages', isAdmin, async (req, res) => {
  try {
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [responseRate, avgMessages] = await Promise.all([
      analyticsMetricsService.getMessageResponseRate(start, end),
      analyticsMetricsService.getAverageMessagesPerMatch(start, end),
    ]);

    res.json({
      success: true,
      data: {
        responseRate,
        avgMessages,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching message metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching message metrics',
    });
  }
});

/**
 * @route   GET /api/metrics/premium
 * @desc    Get premium conversion metrics
 * @access  Private (Admin)
 */
router.get('/premium', isAdmin, async (req, res) => {
  try {
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [conversionRate, churnRate] = await Promise.all([
      analyticsMetricsService.getPremiumConversionRate(start, end),
      analyticsMetricsService.getPremiumChurnRate(start, end),
    ]);

    res.json({
      success: true,
      data: {
        conversionRate,
        churnRate,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching premium metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching premium metrics',
    });
  }
});

/**
 * @route   GET /api/metrics/photos
 * @desc    Get photo upload metrics
 * @access  Private (Admin)
 */
router.get('/photos', isAdmin, async (req, res) => {
  try {
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const uploadMetrics = await analyticsMetricsService.getPhotoUploadSuccessRate(start, end);

    res.json({
      success: true,
      data: uploadMetrics,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error fetching photo metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching photo metrics',
    });
  }
});

/**
 * @route   POST /api/metrics/crash
 * @desc    Report app crash (from mobile clients)
 * @access  Private (requires authentication to prevent spam)
 */
router.post(
  '/crash',
  [
    body('platform').optional().isString().isLength({ max: 50 }),
    body('version').optional().isString().isLength({ max: 20 }),
    body('errorMessage').optional().isString().isLength({ max: 2000 }),
    body('stackTrace').optional().isString().isLength({ max: 10000 }),
  ],
  async (req, res) => {
    try {
      const { platform, version, errorMessage, stackTrace } = req.body;

      analyticsMetricsService.trackCrash(
        platform || 'unknown',
        version || 'unknown',
        errorMessage || 'No message',
        stackTrace || 'No stack trace'
      );

      res.json({
        success: true,
        message: 'Crash reported',
      });
    } catch (/** @type {any} */ error) {
      logger.error('Error reporting crash:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error reporting crash',
      });
    }
  }
);

/**
 * @route   GET /api/metrics/export
 * @desc    Export metrics data as CSV
 * @access  Private (Admin)
 */
router.get('/export', isAdmin, async (req, res) => {
  try {
    const type = /** @type {string} */ (req.query.type);
    const startDate = /** @type {string} */ (req.query.startDate);
    const endDate = /** @type {string} */ (req.query.endDate);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dashboard = await analyticsMetricsService.getDashboardMetrics(
      /** @type {any} */ (start),
      end
    );

    // Guard against missing/partial data to avoid 500s
    const safeDashboard = dashboard || {};
    const engagement = safeDashboard.engagement || {};
    const matching = safeDashboard.matching || {};
    const messaging = safeDashboard.messaging || {};
    const monetization = safeDashboard.monetization || {};
    const retention = safeDashboard.retention || {};
    const generatedAt = safeDashboard.generatedAt || new Date().toISOString();

    // Convert to CSV format
    const csvRows = [
      'Metric,Value,Date',
      `DAU,${engagement.dau ?? 0},${generatedAt}`,
      `WAU,${engagement.wau ?? 0},${generatedAt}`,
      `MAU,${engagement.mau ?? 0},${generatedAt}`,
      `Match Rate,${matching.matchRate ?? 0}%,${generatedAt}`,
      `Swipe-to-Match,${matching.swipeToMatchConversion ?? 0}%,${generatedAt}`,
      `Message Response Rate,${messaging.responseRate ?? 0}%,${generatedAt}`,
      `Premium Conversion,${monetization.premiumConversionRate ?? 0}%,${generatedAt}`,
      `D1 Retention,${retention.D1 ?? 0}%,${generatedAt}`,
      `D7 Retention,${retention.D7 ?? 0}%,${generatedAt}`,
      `D30 Retention,${retention.D30 ?? 0}%,${generatedAt}`,
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csvRows.join('\n'));
  } catch (/** @type {any} */ error) {
    logger.error('Error exporting metrics:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error exporting metrics',
    });
  }
});

module.exports = router;

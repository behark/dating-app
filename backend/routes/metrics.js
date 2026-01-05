/**
 * Metrics Routes
 * API endpoints for accessing analytics metrics
 */

const express = require('express');
const router = express.Router();
const { analyticsMetricsService } = require('../services/AnalyticsMetricsService');
const { authenticate, isAdmin } = require('../middleware/auth');

// All metrics routes require authentication and admin role
router.use(authenticate);

/**
 * @route   GET /api/metrics/dashboard
 * @desc    Get comprehensive metrics dashboard
 * @access  Private (Admin)
 */
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : new Date();

    const dashboard = await analyticsMetricsService.getDashboardMetrics(start, end);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard metrics',
      error: error.message,
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
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const dau = await analyticsMetricsService.getDailyActiveUsers(targetDate);

    res.json({
      success: true,
      data: dau,
    });
  } catch (error) {
    console.error('Error fetching DAU:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DAU',
      error: error.message,
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
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active users',
      error: error.message,
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
    const { cohortDate, days } = req.query;

    const targetDate = cohortDate
      ? new Date(cohortDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const retentionDays = days ? days.split(',').map(Number) : [1, 7, 30];

    const retention = await analyticsMetricsService.getRetentionRate(targetDate, retentionDays);

    res.json({
      success: true,
      data: retention,
    });
  } catch (error) {
    console.error('Error fetching retention:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching retention metrics',
      error: error.message,
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
    const { days } = req.query;
    const lookbackDays = days ? parseInt(days) : 30;

    const retention = await analyticsMetricsService.getRollingRetention(lookbackDays);

    res.json({
      success: true,
      data: retention,
    });
  } catch (error) {
    console.error('Error fetching rolling retention:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rolling retention',
      error: error.message,
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
    const { startDate, endDate } = req.query;

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
  } catch (error) {
    console.error('Error fetching match metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching match metrics',
      error: error.message,
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
    const { startDate, endDate } = req.query;

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
  } catch (error) {
    console.error('Error fetching message metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message metrics',
      error: error.message,
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
    const { startDate, endDate } = req.query;

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
  } catch (error) {
    console.error('Error fetching premium metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching premium metrics',
      error: error.message,
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
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const uploadMetrics = await analyticsMetricsService.getPhotoUploadSuccessRate(start, end);

    res.json({
      success: true,
      data: uploadMetrics,
    });
  } catch (error) {
    console.error('Error fetching photo metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching photo metrics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/metrics/crash
 * @desc    Report app crash (from mobile clients)
 * @access  Private
 */
router.post('/crash', async (req, res) => {
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
  } catch (error) {
    console.error('Error reporting crash:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting crash',
    });
  }
});

/**
 * @route   GET /api/metrics/export
 * @desc    Export metrics data as CSV
 * @access  Private (Admin)
 */
router.get('/export', isAdmin, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dashboard = await analyticsMetricsService.getDashboardMetrics(start, end);

    // Convert to CSV format
    const csvRows = [
      'Metric,Value,Date',
      `DAU,${dashboard.engagement.dau},${dashboard.generatedAt}`,
      `WAU,${dashboard.engagement.wau},${dashboard.generatedAt}`,
      `MAU,${dashboard.engagement.mau},${dashboard.generatedAt}`,
      `Match Rate,${dashboard.matching.matchRate}%,${dashboard.generatedAt}`,
      `Swipe-to-Match,${dashboard.matching.swipeToMatchConversion}%,${dashboard.generatedAt}`,
      `Message Response Rate,${dashboard.messaging.responseRate}%,${dashboard.generatedAt}`,
      `Premium Conversion,${dashboard.monetization.premiumConversionRate}%,${dashboard.generatedAt}`,
      `D1 Retention,${dashboard.retention.D1}%,${dashboard.generatedAt}`,
      `D7 Retention,${dashboard.retention.D7}%,${dashboard.generatedAt}`,
      `D30 Retention,${dashboard.retention.D30}%,${dashboard.generatedAt}`,
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting metrics',
      error: error.message,
    });
  }
});

module.exports = router;

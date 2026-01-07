/**
 * Performance Routes
 * API endpoints for performance monitoring
 */

const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// All performance routes require authentication
router.use(authenticate);

// Real-time metrics (available to all authenticated users)
router.get('/metrics', performanceController.getMetrics);

// Admin-only routes
router.use(isAdmin);

// Slow requests
router.get('/slow-requests', performanceController.getSlowRequests);

// Slow queries
router.get('/slow-queries', performanceController.getSlowQueries);

// Performance summary
router.get('/summary', performanceController.getPerformanceSummary);

// Average response times
router.get('/average-response-times', performanceController.getAverageResponseTimes);

module.exports = router;

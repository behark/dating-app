const express = require('express');
const { body, query } = require('express-validator');
const {
  discoverUsers,
  getDiscoverySettings,
  updateLocation,
} = require('../controllers/discoveryController');
const { apiCache, staleWhileRevalidate } = require('../middleware/apiCache');

// Mock authentication middleware (replace with actual auth in production)
const mockAuth = (req, res, next) => {
  // In production, this should verify JWT tokens, etc.
  // For now, we'll accept a userId in headers for testing
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (userId) {
    req.user = { id: userId };
  }
  next();
};

const router = express.Router();

// Apply mock authentication to all routes
router.use(mockAuth);

// GET /api/discover - Discover users within radius
router.get(
  '/discover',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    query('radius')
      .isInt({ min: 1, max: 50000 })
      .withMessage('Radius must be between 1 and 50000 meters'),
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
  apiCache('discovery', 60),
  discoverUsers
);

// GET /api/discover/settings - Get user's discovery preferences
router.get('/discover/settings', apiCache('preferences', 600), getDiscoverySettings);

// PUT /api/discover/location - Update user's location
router.put(
  '/discover/location',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
  ],
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
  updateLocation
);

module.exports = router;

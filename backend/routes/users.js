const express = require('express');
const { query } = require('express-validator');
const { discoverUsers } = require('../controllers/discoveryController');
const { apiCache } = require('../middleware/apiCache');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/discover
 * @desc    Discover users within a specified radius using geolocation
 * @access  Private (requires authentication)
 *
 * Query Parameters:
 * - lat: Latitude of the search center (-90 to 90)
 * - lng: Longitude of the search center (-180 to 180)
 * - radius: Search radius in meters (1 to 50000)
 *
 * Features:
 * - Uses MongoDB's $near with 2dsphere index for efficient geospatial queries
 * - Excludes users the current user has already swiped on
 * - Respects user's discovery preferences (age range, gender, distance)
 * - Returns distance to each user in kilometers
 * - Applies location privacy settings
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     users: [...],      // Array of nearby user profiles
 *     count: number,     // Total number of results
 *     searchParams: {    // Echo of search parameters used
 *       latitude: number,
 *       longitude: number,
 *       radius: number
 *     }
 *   }
 * }
 */
router.get(
  '/discover',
  authenticate, // Require authentication
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
  apiCache('user-discovery', 60), // Cache for 60 seconds
  discoverUsers
);

module.exports = router;

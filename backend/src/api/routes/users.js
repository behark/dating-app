const express = require('express');
const { query } = require('express-validator');
const { discoverUsers } = require('../controllers/discoveryController');
const { apiCache } = require('../middleware/apiCache');
const { authenticate } = require('../middleware/auth');
const User = require('../../core/domain/User');
const { sendSuccess, sendError, sendNotFound } = require('../../shared/utils/responseHelpers');

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

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, async (req, res) => {
  /** @type {import('../../../types/index').AuthenticatedRequest} */
  const authReq = req;
  try {
    const { id } = req.params;
    const currentUserId = authReq.user?.id;

    if (!id) {
      return sendError(res, 400, { message: 'User ID is required', error: 'VALIDATION_ERROR' });
    }

    // Get user profile
    const user = await User.findById(id)
      .select(
        '-password -refreshToken -emailVerificationToken -passwordResetToken -passwordResetExpires'
      )
      .maxTimeMS(10000)
      .lean();

    if (!user) {
      return sendNotFound(res, 'User');
    }

    // Check if current user has blocked this user or vice versa
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('blockedUsers').lean();
      if (
        currentUser?.blockedUsers?.some((blockedId) => blockedId.toString() === id) ||
        user.blockedUsers?.some((blockedId) => blockedId.toString() === currentUserId)
      ) {
        return sendNotFound(res, 'User');
      }
    }

    return sendSuccess(res, 200, {
      message: 'User profile retrieved successfully',
      data: { user },
    });
  } catch (/** @type {any} */ error) {
    console.error('Error getting user profile:', error);
    return sendError(res, 500, {
      message: 'Failed to retrieve user profile',
      error: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;

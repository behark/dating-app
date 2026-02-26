const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const SocialFeaturesController = require('../controllers/socialFeaturesController');
const { authenticate } = require('../middleware/auth');
const { socialLimiter } = require('../middleware/rateLimiter');
const { apiCache, invalidateCache } = require('../middleware/apiCache');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => {
        if ('path' in err) {
          return { field: err.path, message: err.msg };
        }
        return { field: 'unknown', message: err.msg };
      }),
    });
  }
  next();
};

/**
 * GROUP DATES
 */
// Create a group date
router.post('/group-dates', SocialFeaturesController.createGroupDate);

// Join a group date
router.post('/group-dates/:groupDateId/join', SocialFeaturesController.joinGroupDate);

// Leave a group date
router.post('/group-dates/:groupDateId/leave', SocialFeaturesController.leaveGroupDate);

// Get nearby group dates
router.get('/group-dates/nearby', SocialFeaturesController.getNearbyGroupDates);

/**
 * FRIEND REVIEWS
 */
// Create a friend review
router.post('/reviews', SocialFeaturesController.createFriendReview);

// Get reviews for a user
router.get('/reviews/:userId', SocialFeaturesController.getUserReviews);

/**
 * IN-APP EVENTS
 */
// Create an event
router.post('/events', socialLimiter, SocialFeaturesController.createEvent);

// Register for an event
router.post(
  '/events/:eventId/register',
  socialLimiter,
  [param('eventId').isMongoId().withMessage('Invalid event ID format')],
  handleValidationErrors,
  SocialFeaturesController.registerForEvent
);

// Leave an event
router.post(
  '/events/:eventId/leave',
  socialLimiter,
  [param('eventId').isMongoId().withMessage('Invalid event ID format')],
  handleValidationErrors,
  SocialFeaturesController.leaveEvent
);

// Get nearby events
router.get(
  '/events/nearby',
  socialLimiter,
  apiCache('events', 300), // Cache for 5 minutes
  [
    query('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    query('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    query('maxDistance')
      .optional()
      .isInt({ min: 1, max: 50000 })
      .withMessage('Max distance must be between 1 and 50000 meters'),
    query('category')
      .optional()
      .isIn([
        'networking',
        'singles_mixer',
        'social_party',
        'speed_dating',
        'activity',
        'workshop',
        'vacation',
        'challenge',
        'other',
      ])
      .withMessage('Invalid event category'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  handleValidationErrors,
  SocialFeaturesController.getNearbyEvents
);

/**
 * PROFILE SHARING
 */
// Create a shareable profile link
router.post('/share-profile/:userId', SocialFeaturesController.createShareableProfileLink);

// Share profile with someone
router.post('/share-profile/:userId/with', SocialFeaturesController.shareProfileWith);

// Get shared profile by token (no auth required for this endpoint)
router.get('/shared-profile/:shareToken', SocialFeaturesController.getSharedProfile);

// Get all shared profiles for a user
router.get('/share-profile/:userId/links', SocialFeaturesController.getUserSharedProfiles);

// Deactivate a share link
router.delete('/share-profile/:shareToken', SocialFeaturesController.deactivateShareLink);

module.exports = router;

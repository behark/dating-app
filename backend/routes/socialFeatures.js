const express = require('express');
const SocialFeaturesController = require('../controllers/socialFeaturesController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

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
router.post('/events', SocialFeaturesController.createEvent);

// Register for an event
router.post('/events/:eventId/register', SocialFeaturesController.registerForEvent);

// Get nearby events
router.get('/events/nearby', SocialFeaturesController.getNearbyEvents);

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

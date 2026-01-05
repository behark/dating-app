const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  connectSpotify,
  connectInstagram,
  disconnectSpotify,
  disconnectInstagram,
  getSocialMedia,
} = require('../controllers/socialMediaController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // @ts-ignore - express-validator union type handling
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

// Connect Spotify
router.post(
  '/connect-spotify',
  authenticate,
  [
    body('spotifyId').notEmpty().withMessage('Spotify ID is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('profileUrl').optional().isURL(),
  ],
  handleValidationErrors,
  connectSpotify
);

// Connect Instagram
router.post(
  '/connect-instagram',
  authenticate,
  [
    body('instagramId').notEmpty().withMessage('Instagram ID is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('profileUrl').optional().isURL(),
  ],
  handleValidationErrors,
  connectInstagram
);

// Disconnect Spotify
router.delete('/disconnect-spotify', authenticate, disconnectSpotify);

// Disconnect Instagram
router.delete('/disconnect-instagram', authenticate, disconnectInstagram);

// Get social media - SECURITY: Requires auth and can only view matched users' social media
const { authorizeMatchedUsers } = require('../middleware/auth');
router.get('/:userId/social-media', authenticate, authorizeMatchedUsers, getSocialMedia);

module.exports = router;

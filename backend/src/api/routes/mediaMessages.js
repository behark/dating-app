const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const mediaMessagesController = require('../controllers/mediaMessagesController');

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

// GIFs
router.post(
  '/gif',
  authenticate,
  [
    body('matchId').isMongoId().withMessage('Invalid match ID format'),
    body('gifUrl').isURL().withMessage('Invalid GIF URL'),
  ],
  handleValidationErrors,
  mediaMessagesController.sendGifMessage
);
router.get('/gifs/popular', authenticate, mediaMessagesController.getPopularGifs);
router.get(
  '/gifs/search',
  authenticate,
  [query('q').trim().notEmpty().withMessage('Search query is required').isLength({ max: 200 })],
  handleValidationErrors,
  mediaMessagesController.searchGifs
);

// Stickers
router.post(
  '/sticker',
  authenticate,
  [
    body('matchId').isMongoId().withMessage('Invalid match ID format'),
    body('stickerId').trim().notEmpty().withMessage('Sticker ID is required'),
  ],
  handleValidationErrors,
  mediaMessagesController.sendStickerMessage
);
router.get('/sticker-packs', authenticate, mediaMessagesController.getStickerPacks);

// Voice Messages
router.post(
  '/voice',
  authenticate,
  [
    body('matchId').isMongoId().withMessage('Invalid match ID format'),
    body('duration')
      .optional()
      .isFloat({ min: 0.1, max: 300 })
      .withMessage('Duration must be between 0.1 and 300 seconds'),
  ],
  handleValidationErrors,
  mediaMessagesController.sendVoiceMessage
);
router.post(
  '/voice/transcribe',
  authenticate,
  [body('messageId').isMongoId().withMessage('Invalid message ID format')],
  handleValidationErrors,
  mediaMessagesController.transcribeVoiceMessage
);

// Video Calls
router.post(
  '/video-call/initiate',
  authenticate,
  [body('matchId').isMongoId().withMessage('Invalid match ID format')],
  handleValidationErrors,
  mediaMessagesController.initiateVideoCall
);
router.put(
  '/video-call/status',
  authenticate,
  [
    body('callId').notEmpty().withMessage('Call ID is required'),
    body('status')
      .isIn(['ringing', 'connected', 'ended', 'missed', 'declined'])
      .withMessage('Invalid call status'),
  ],
  handleValidationErrors,
  mediaMessagesController.updateVideoCallStatus
);

module.exports = router;

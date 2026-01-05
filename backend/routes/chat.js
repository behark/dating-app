const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  markMessageAsRead,
  getReadReceipts,
  sendEncryptedMessage,
} = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

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

const router = express.Router();

// Apply authentication to all routes (CRITICAL: Remove mock auth in production)
router.use(authenticate);

// GET /api/chat/conversations - Get all conversations for user
router.get('/conversations', getConversations);

// GET /api/chat/unread - Get total unread messages count
router.get('/unread', getUnreadCount);

// GET /api/chat/messages/:matchId - Get messages for a specific match
router.get(
  '/messages/:matchId',
  [
    param('matchId').isMongoId().withMessage('Invalid match ID format'),
    // Optional query params validation
    body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  getMessages
);

// PUT /api/chat/messages/:matchId/read - Mark messages as read for a match
router.put('/messages/:matchId/read', markAsRead);

// PUT /api/chat/messages/:messageId/read-single - Mark single message as read
router.put('/messages/:messageId/read-single', markMessageAsRead);

// GET /api/chat/receipts/:matchId - Get read receipts for a conversation
router.get('/receipts/:matchId', getReadReceipts);

// POST /api/chat/messages/encrypted - Send an encrypted message
router.post(
  '/messages/encrypted',
  [
    body('matchId').isMongoId().withMessage('Invalid match ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'video', 'audio'])
      .withMessage('Invalid message type'),
  ],
  handleValidationErrors,
  sendEncryptedMessage
);

// DELETE /api/chat/messages/:messageId - Delete a message
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;

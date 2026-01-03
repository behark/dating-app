const express = require('express');
const {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  markMessageAsRead,
  getReadReceipts,
  sendEncryptedMessage
} = require('../controllers/chatController');

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

// GET /api/chat/conversations - Get all conversations for user
router.get('/conversations', getConversations);

// GET /api/chat/unread - Get total unread messages count
router.get('/unread', getUnreadCount);

// GET /api/chat/messages/:matchId - Get messages for a specific match
router.get('/messages/:matchId', getMessages);

// PUT /api/chat/messages/:matchId/read - Mark messages as read for a match
router.put('/messages/:matchId/read', markAsRead);

// PUT /api/chat/messages/:messageId/read-single - Mark single message as read
router.put('/messages/:messageId/read-single', markMessageAsRead);

// GET /api/chat/receipts/:matchId - Get read receipts for a conversation
router.get('/receipts/:matchId', getReadReceipts);

// POST /api/chat/messages/encrypted - Send an encrypted message
router.post('/messages/encrypted', sendEncryptedMessage);

// DELETE /api/chat/messages/:messageId - Delete a message
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
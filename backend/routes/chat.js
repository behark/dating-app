const express = require('express');
const {
  getMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage
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

// DELETE /api/chat/messages/:messageId - Delete a message
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
const express = require('express');
const { generateIcebreakers } = require('../controllers/aiController');

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

// POST /api/ai/icebreaker - Generate icebreaker messages for a target user
router.post('/icebreaker', generateIcebreakers);

module.exports = router;

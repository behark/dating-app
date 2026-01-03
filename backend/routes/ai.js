const express = require('express');
const {
  generateIcebreakers,
  getSmartPhotoSelection,
  generateBioSuggestions,
  calculateCompatibilityScore,
  getConversationStarters,
  analyzePhotoQuality,
  getPersonalizedMatches,
  getProfileImprovementSuggestions,
  getConversationInsights
} = require('../controllers/aiController');

// Mock authentication middleware (replace with actual auth in production)
const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (userId) {
    req.user = { id: userId };
  }
  next();
};

const router = express.Router();

// Apply mock authentication to all routes
router.use(mockAuth);

// ============================================================
// AI/ML ENDPOINTS
// ============================================================

// POST /api/ai/icebreaker - Generate icebreaker messages for a target user
router.post('/icebreaker', generateIcebreakers);

// GET /api/ai/smart-photos/:userId - Get smart photo selection recommendations
router.get('/smart-photos/:userId', getSmartPhotoSelection);

// POST /api/ai/bio-suggestions - Generate bio suggestions
router.post('/bio-suggestions', generateBioSuggestions);

// GET /api/ai/compatibility/:userId/:targetUserId - Calculate compatibility score
router.get('/compatibility/:userId/:targetUserId', calculateCompatibilityScore);

// POST /api/ai/conversation-starters - Get conversation starter suggestions
router.post('/conversation-starters', getConversationStarters);

// POST /api/ai/analyze-photo - Analyze photo quality
router.post('/analyze-photo', analyzePhotoQuality);

// GET /api/ai/personalized-matches/:userId - Get personalized match recommendations
router.get('/personalized-matches/:userId', getPersonalizedMatches);

// GET /api/ai/profile-suggestions/:userId - Get profile improvement suggestions
router.get('/profile-suggestions/:userId', getProfileImprovementSuggestions);

// GET /api/ai/conversation-insights/:userId - Get conversation insights
router.get('/conversation-insights/:userId', getConversationInsights);

module.exports = router;

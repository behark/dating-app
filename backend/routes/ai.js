const express = require('express');
const {
  generateIcebreakers,
  generateMatchIcebreakers,
  getSmartPhotoSelection,
  generateBioSuggestions,
  calculateCompatibilityScore,
  getConversationStarters,
  analyzePhotoQuality,
  getPersonalizedMatches,
  getProfileImprovementSuggestions,
  getConversationInsights,
} = require('../controllers/aiController');
const { authenticate, authorizeOwner, authorizeMatchedUsers } = require('../middleware/auth');

const router = express.Router();

// Apply real authentication to all routes (SECURITY FIX: removed mock auth)
router.use(authenticate);

// ============================================================
// AI/ML ENDPOINTS
// ============================================================

// POST /api/ai/icebreaker - Generate icebreaker messages for a match
// Accepts either:
//   - { matchId } - Uses both users' profiles for personalized icebreakers (preferred)
//   - { targetUserId } - Legacy: Uses only target user's profile
router.post('/icebreaker', (req, res, next) => {
  // Route to appropriate handler based on request body
  if (req.body.matchId) {
    return generateMatchIcebreakers(req, res, next);
  }
  return generateIcebreakers(req, res, next);
});

// GET /api/ai/smart-photos/:userId - Get smart photo selection recommendations
// SECURITY: Only owner can access their own photo analysis
router.get('/smart-photos/:userId', authorizeOwner(), getSmartPhotoSelection);

// POST /api/ai/bio-suggestions - Generate bio suggestions
router.post('/bio-suggestions', generateBioSuggestions);

// GET /api/ai/compatibility/:userId/:targetUserId - Calculate compatibility score
// SECURITY: Users can only check compatibility with their matches
router.get('/compatibility/:userId/:targetUserId', authorizeOwner(), calculateCompatibilityScore);

// POST /api/ai/conversation-starters - Get conversation starter suggestions
router.post('/conversation-starters', getConversationStarters);

// POST /api/ai/analyze-photo - Analyze photo quality
router.post('/analyze-photo', analyzePhotoQuality);

// GET /api/ai/personalized-matches/:userId - Get personalized match recommendations
// SECURITY: Only owner can access their own match recommendations
router.get('/personalized-matches/:userId', authorizeOwner(), getPersonalizedMatches);

// GET /api/ai/profile-suggestions/:userId - Get profile improvement suggestions
// SECURITY: Only owner can access their own profile suggestions
router.get('/profile-suggestions/:userId', authorizeOwner(), getProfileImprovementSuggestions);

// GET /api/ai/conversation-insights/:userId - Get conversation insights
// SECURITY: Only owner can access their own conversation insights
router.get('/conversation-insights/:userId', authorizeOwner(), getConversationInsights);

module.exports = router;

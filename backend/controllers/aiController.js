const User = require('../models/User');
const { logger } = require('../services/LoggingService');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Mock LLM function - generates icebreakers without OpenAI
 * Can be replaced with actual OpenAI API call
 */
const generateIcebreakersMock = (interests, bio) => {
  const icebreakers = [];

  // Generate icebreakers based on interests
  if (interests && interests.length > 0) {
    const interest = interests[Math.floor(Math.random() * interests.length)];

    icebreakers.push(
      `I noticed you're into ${interest.toLowerCase()}. What got you started with that?`,
      `Your ${interest.toLowerCase()} interest caught my eye! Are you more of a casual enthusiast or full-on obsessed? 😄`,
      `I see ${interest.toLowerCase()} in your interests. Let's talk about that! What's the most interesting thing about it?`
    );
  }

  // If we don't have enough, generate generic ones
  if (icebreakers.length < 3) {
    const generic = [
      `Hey! I saw your profile and thought we might have some things in common. What's something you're passionate about?`,
      `Hi there! I'm curious - what's the best part of your day usually?`,
      `Hey! I'd love to get to know you better. What's something that always makes you smile?`,
    ];

    // Add generic ones to fill up to 3
    while (icebreakers.length < 3) {
      const randomGeneric = generic[Math.floor(Math.random() * generic.length)];
      if (!icebreakers.includes(randomGeneric)) {
        icebreakers.push(randomGeneric);
      }
    }
  }

  // If we have bio, try to incorporate it
  if (bio && bio.length > 0) {
    const bioKeywords = bio.toLowerCase().match(/\b\w{4,}\b/g) || [];
    if (bioKeywords.length > 0) {
      const keyword = bioKeywords[Math.floor(Math.random() * bioKeywords.length)];
      icebreakers[0] = `I read your bio and the word "${keyword}" stood out to me. Tell me more about that!`;
    }
  }

  return icebreakers.slice(0, 3);
};

/**
 * OpenAI API function - generates icebreakers using OpenAI
 * Replace the mock function with this when OpenAI API key is available
 */
const generateIcebreakersOpenAI = async (interests, bio) => {
  let OpenAI;
  try {
    OpenAI = require('openai').OpenAI;
  } catch (error) {
    logger.warn('OpenAI package not installed, falling back to mock');
    return generateIcebreakersMock(interests, bio);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const interestsText =
    interests && interests.length > 0
      ? `Interests: ${interests.join(', ')}`
      : 'No specific interests listed';

  const bioText = bio && bio.length > 0 ? `Bio: ${bio}` : 'No bio provided';

  const prompt = `You are a helpful assistant for a dating app. Generate 3 funny, interesting, and engaging opening lines (icebreakers) for someone to use when messaging a match. 

The target user's profile information:
${interestsText}
${bioText}

Requirements:
- Make them funny, lighthearted, and engaging
- Reference their interests or bio naturally (don't force it)
- Keep them conversational and not too long (1-2 sentences max)
- Make them feel personal and genuine
- Vary the style (one could be a question, one could be playful, one could be curious)
- Avoid being too forward or inappropriate

Return ONLY a JSON array of exactly 3 strings, no other text. Example format:
["Hey! I noticed you're into hiking. What's your favorite trail?", "Your bio made me laugh! Are you always this witty?", "I'm curious - what's the story behind your interest in photography?"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates engaging icebreaker messages for a dating app. Always return a valid JSON array of exactly 3 strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    const responseString = response || '';

    if (!responseString) {
      return ['Hey! How are you?', "What's your favorite hobby?", 'Tell me about yourself!'];
    }

    // Try to parse as JSON object first (if OpenAI returns wrapped JSON)
    try {
      const parsed = JSON.parse(responseString);
      if (parsed.icebreakers && Array.isArray(parsed.icebreakers)) {
        return parsed.icebreakers.slice(0, 3);
      }
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    } catch (e) {
      // If not JSON, try to extract array from text
      const arrayMatch = responseString ? responseString.match(/\[(.*?)\]/s) : null;
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]).slice(0, 3);
        } catch (e2) {
          // Fallback to mock
        }
      }
    }

    // Fallback to mock if parsing fails
    return generateIcebreakersMock(interests, bio);
  } catch (error) {
    logger.error('OpenAI API error:', { error: error.message, stack: error.stack });
    // Fallback to mock on error
    return generateIcebreakersMock(interests, bio);
  }
};

/**
 * Generate icebreaker messages for a target user
 * POST /api/ai/icebreaker
 */
const generateIcebreakers = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    // Validate input
    if (!targetUserId) {
      return sendError(res, 400, { message: 'targetUserId is required' });
    }

    // Validate targetUserId format (MongoDB ObjectId)
    if (!require('mongoose').Types.ObjectId.isValid(targetUserId)) {
      return sendError(res, 400, { message: 'Invalid targetUserId format' });
    }

    // Get target user from database
    const targetUser = await User.findById(targetUserId).select('interests bio name');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    // Extract interests and bio
    const interests = targetUser.interests || [];
    const bio = targetUser.bio || '';

    // Generate icebreakers
    let icebreakers;

    // Use OpenAI if API key is available, otherwise use mock
    if (process.env.OPENAI_API_KEY && process.env.USE_OPENAI !== 'false') {
      try {
        icebreakers = await generateIcebreakersOpenAI(interests, bio);
      } catch (error) {
        logger.error('OpenAI generation failed, falling back to mock:', {
          error: error.message,
          stack: error.stack,
        });
        icebreakers = generateIcebreakersMock(interests, bio);
      }
    } else {
      // Use mock LLM
      icebreakers = generateIcebreakersMock(interests, bio);
    }

    // Ensure we have exactly 3 icebreakers
    while (icebreakers.length < 3) {
      icebreakers.push(
        `Hey! I'd love to get to know you better. What's something interesting about you?`
      );
    }

    // Return the icebreakers as JSON array
    return res.status(200).json({
      success: true,
      icebreakers: icebreakers.slice(0, 3),
    });
  } catch (error) {
    logger.error('Error generating icebreakers:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to generate icebreakers', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Get smart photo selection recommendations
 * Analyzes user's photos and suggests which ones to prioritize
 * GET /api/ai/smart-photos/:userId
 */
const getSmartPhotoSelection = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!require('mongoose').Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, { message: 'Invalid userId format' });
    }

    const user = await User.findById(userId).select('photos');
    if (!user || !user.photos || user.photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or has no photos',
      });
    }

    // Mock AI analysis of photos
    const recommendations = user.photos.map((photo, index) => ({
      photoIndex: index,
      photoUrl: photo,
      score: 50 + Math.random() * 50, // Score 50-100
      reasons: ['Clear face visible', 'Good lighting', 'Attractive composition'],
      priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
      suggestions: ['Consider using as primary photo', 'Great for second position'],
    }));

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 5),
        analysis: {
          totalPhotos: user.photos.length,
          averageScore:
            recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length,
          suggestedPrimaryPhoto: recommendations[0],
          improvementAreas: [
            'Add more diverse photos',
            'Ensure at least one full-body photo',
            'Include photos of your hobbies',
          ],
        },
      },
    });
  } catch (error) {
    logger.error('Error analyzing photos:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to analyze photos', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Generate bio suggestions
 * POST /api/ai/bio-suggestions
 */
const generateBioSuggestions = async (req, res) => {
  try {
    const { userId, interests = [], currentBio = '' } = req.body;

    if (!userId) {
      return sendError(res, 400, { message: 'userId is required' });
    }

    // Mock bio suggestions based on interests
    const bioTemplates = {
      sports: 'Adventure seeker | ${sport} enthusiast | Always up for something new 🏃',
      travel: 'World explorer 🌍 | Love discovering new places | ${destination} was amazing',
      reading: 'Bookworm 📚 | Coffee lover ☕ | Always reading my next favorite',
      fitness: 'Gym regular 💪 | Health conscious | Fitness goals: ${goal}',
      art: "Creative soul 🎨 | Artist/Art lover | Life's too short for boring walls",
      music: 'Music lover 🎵 | ${genre} fan | Spotify playlist curator',
      cooking: "Food enthusiast 🍳 | Home cook | Let's grab something delicious",
      pets: 'Animal lover 🐕 | Have ${petType} | Pet parent life',
      default:
        "Looking for something real ✨ | Interested in ${interests} | Let's see where this goes",
    };

    const suggestions = [];

    // Generate personalized suggestions
    if (interests.length > 0) {
      const interest = interests[0].toLowerCase();
      const template = bioTemplates[interest] || bioTemplates.default;

      suggestions.push({
        bio: template.replace(/\$\{[^}]+\}/g, 'your detail'),
        tone: 'casual',
        reason: `Highlights your interest in ${interest}`,
      });

      suggestions.push({
        bio: `${interests.join(', ')} | Looking to meet someone genuine | Open to new experiences`,
        tone: 'friendly',
        reason: 'Lists multiple interests naturally',
      });

      suggestions.push({
        bio: `Passionate about ${interests.join(' and ')} | Believe in being authentic | Let's grab coffee and see if we click?`,
        tone: 'warm',
        reason: 'Personal and inviting tone',
      });
    }

    // Add generic suggestions if needed
    if (suggestions.length < 3) {
      suggestions.push({
        bio: "Looking for genuine connection | Open-minded | Let's see where this goes ✨",
        tone: 'friendly',
        reason: 'Universal and approachable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 5),
        explanations: {
          toneAdvice: 'Keep it genuine and approachable',
          lengthTip: 'Aim for 50-150 characters',
          avoidList: [
            'Generic clichés',
            'Excessive emojis',
            'Negativity',
            'Looking for free rides',
          ],
        },
      },
    });
  } catch (error) {
    logger.error('Error generating bio suggestions:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to generate bio suggestions', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Calculate compatibility score between two users
 * GET /api/ai/compatibility/:userId/:targetUserId
 */
const calculateCompatibilityScore = async (req, res) => {
  try {
    const { userId, targetUserId } = req.params;

    if (
      !require('mongoose').Types.ObjectId.isValid(userId) ||
      !require('mongoose').Types.ObjectId.isValid(targetUserId)
    ) {
      return sendError(res, 400, { message: 'Invalid userId format' });
    }

    const user = await User.findById(userId).select('interests ageRange values gender location');
    const targetUser = await User.findById(targetUserId).select(
      'interests ageRange values gender location'
    );

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'One or both users not found',
      });
    }

    // Calculate compatibility based on multiple factors
    let score = 0;
    const breakdown = {
      interestMatch: 0,
      valueMatch: 0,
      ageCompatibility: 0,
      locationProximity: 0,
      genderPreference: 0,
    };

    // Interest matching
    const commonInterests = (user.interests || []).filter((i) =>
      (targetUser.interests || []).includes(i)
    );
    breakdown.interestMatch = Math.min(
      100,
      (commonInterests.length / Math.max((user.interests || []).length, 1)) * 100
    );

    // Age compatibility
    const ageDiff = Math.abs((user.age || 0) - (targetUser.age || 0));
    breakdown.ageCompatibility = Math.max(0, 100 - ageDiff * 5);

    // Gender preference (simplified)
    breakdown.genderPreference = 50; // Default to compatible

    // Value match
    const commonValues = (user.values || []).filter((v) => (targetUser.values || []).includes(v));
    breakdown.valueMatch = Math.min(
      100,
      (commonValues.length / Math.max((user.values || []).length, 1)) * 100
    );

    // Location (mock)
    breakdown.locationProximity = 70; // Would calculate real distance in production

    // Calculate weighted score
    score =
      breakdown.interestMatch * 0.25 +
      breakdown.valueMatch * 0.25 +
      breakdown.ageCompatibility * 0.2 +
      breakdown.genderPreference * 0.2 +
      breakdown.locationProximity * 0.1;

    return res.status(200).json({
      success: true,
      data: {
        score: Math.round(score),
        breakdown: {
          interestMatch: Math.round(breakdown.interestMatch),
          valueMatch: Math.round(breakdown.valueMatch),
          ageCompatibility: Math.round(breakdown.ageCompatibility),
          locationProximity: Math.round(breakdown.locationProximity),
          genderPreference: Math.round(breakdown.genderPreference),
        },
        explanation: getCompatibilityExplanation(score, commonInterests, commonValues),
      },
    });
  } catch (error) {
    logger.error('Error calculating compatibility:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to calculate compatibility', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Get conversation starters for a user
 * POST /api/ai/conversation-starters
 */
const getConversationStarters = async (req, res) => {
  try {
    const { userId, targetUserId, targetProfile = {} } = req.body;

    if (!userId || !targetUserId) {
      return sendError(res, 400, { message: 'userId and targetUserId are required' });
    }

    const targetUser = await User.findById(targetUserId).select('interests bio name');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    const interests = targetProfile.interests || targetUser.interests || [];
    const bio = targetProfile.bio || targetUser.bio || '';

    // Generate conversation starters
    let starters = [];

    // Based on interests
    if (interests.length > 0) {
      const interest = interests[0];
      starters.push(
        `I saw you're into ${interest}! What got you started with that? 🤔`,
        `${interest} is awesome! What's your favorite thing about it? ✨`,
        `I'm curious about your interest in ${interest} - tell me more! 👀`
      );
    }

    // Based on bio
    if (bio && bio.length > 0) {
      const bioKeywords = bio.match(/\b\w{4,}\b/g) || [];
      if (bioKeywords.length > 0) {
        const keyword = bioKeywords[0];
        starters.push(
          `Your bio mentioned "${keyword}" - that caught my attention! 😊`,
          `I loved reading about ${keyword} in your bio. That's cool!`,
          `Tell me more about that ${keyword} thing you mentioned? 👂`
        );
      }
    }

    // Generic engaging starters
    starters.push(
      `Hey! I'd love to know what your ideal weekend looks like 🎉`,
      `If you could have dinner with anyone, who would it be? 🍽️`,
      `What's something about you that people usually get wrong? 🤷`
    );

    // Use existing icebreakers
    const icebreakers = generateIcebreakersMock(interests, bio);
    starters = [...new Set([...icebreakers, ...starters])];

    return res.status(200).json({
      success: true,
      data: {
        starters: starters.slice(0, 5),
        reasoning: {
          interestBased: interests.length > 0 ? `Based on their interest in ${interests[0]}` : null,
          bioBased: bio ? 'Based on their bio' : null,
          personalizationLevel: 'high',
        },
      },
    });
  } catch (error) {
    logger.error('Error getting conversation starters:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, { message: 'Failed to get conversation starters', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Helper function to generate compatibility explanation
 */
const getCompatibilityExplanation = (score, commonInterests, commonValues) => {
  let explanation = '';

  if (score >= 80) {
    explanation = 'Excellent match! You have a lot in common.';
  } else if (score >= 60) {
    explanation = 'Good compatibility! You share some important values and interests.';
  } else if (score >= 40) {
    explanation = 'You might be compatible! Worth exploring to see if there is chemistry.';
  } else {
    explanation =
      'Limited compatibility based on interests and values. Could still be worth trying!';
  }

  if (commonInterests.length > 0) {
    explanation += ` You both enjoy ${commonInterests.slice(0, 2).join(' and ')}.`;
  }

  return explanation;
};

/**
 * Analyze photo quality
 * POST /api/ai/analyze-photo (multipart form data)
 */
const analyzePhotoQuality = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, { message: 'No photo provided' });
    }

    // Mock photo analysis
    const analysis = {
      quality: {
        sharpness: 85,
        lighting: 75,
        composition: 80,
        facialVisibility: 95,
        clarity: 88,
      },
      suggestions: ['Excellent face visibility', 'Good natural lighting', 'Well-composed shot'],
      score: 87,
      suitableForProfile: true,
      issues: [],
    };

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Error analyzing photo:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to analyze photo', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Get personalized match recommendations
 * GET /api/ai/personalized-matches/:userId
 */
const getPersonalizedMatches = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, useLocation = true, useInterests = true, useValues = true } = req.query;

    if (!require('mongoose').Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, { message: 'Invalid userId format' });
    }

    const user = await User.findById(userId).select(
      'interests values location age gender preference'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Mock personalized matches
    const matches = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      matches.push({
        userId: `user_${Date.now()}_${i}`,
        name: `Match ${i + 1}`,
        age: 25 + Math.floor(Math.random() * 10),
        compatibilityScore: 60 + Math.floor(Math.random() * 40),
        sharedInterests: (user.interests || []).slice(0, 2),
        distance: Math.floor(Math.random() * 20) + 1,
        ranking: i + 1,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        matches,
        reasoning: {
          algorithm: 'Interest and value-based matching with location proximity',
          factors: {
            useInterests,
            useValues,
            useLocation,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error getting personalized matches:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, { message: 'Failed to get personalized matches', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Get profile improvement suggestions
 * GET /api/ai/profile-suggestions/:userId
 */
const getProfileImprovementSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!require('mongoose').Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, { message: 'Invalid userId format' });
    }

    const user = await User.findById(userId).select('photos bio interests');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate suggestions based on profile analysis
    const suggestions = [];

    if (!user.photos || user.photos.length < 3) {
      suggestions.push({
        area: 'Photos',
        priority: 'high',
        suggestion: 'Add more photos to increase profile visibility',
        impact: 'More photos increase match chances by 30%',
      });
    }

    if (!user.bio || user.bio.length < 20) {
      suggestions.push({
        area: 'Bio',
        priority: 'high',
        suggestion: 'Write a more descriptive bio',
        impact: 'Good bios lead to more meaningful matches',
      });
    }

    if (!user.interests || user.interests.length < 5) {
      suggestions.push({
        area: 'Interests',
        priority: 'medium',
        suggestion: 'Add more interests to help with matching',
        impact: '5+ interests improve match accuracy',
      });
    }

    // Always include some general tips
    suggestions.push({
      area: 'Profile Completeness',
      priority: 'medium',
      suggestion: 'Fill in all optional fields for better matches',
      impact: 'Complete profiles are 2x more likely to match',
    });

    return res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 5),
        priority: suggestions.filter((s) => s.priority === 'high').map((s) => s.suggestion),
        impact: {
          completenessScore: calculateCompletenessScore(user),
          potentialImprovementScore: 85,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting suggestions:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to get profile suggestions', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Get conversation insights
 * GET /api/ai/conversation-insights/:userId
 */
const getConversationInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!require('mongoose').Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, { message: 'Invalid userId format' });
    }

    // Mock insights based on user data
    const insights = [
      {
        title: "You're Great at Opening Lines",
        description: 'Your conversation starters have a 45% response rate (avg: 22%)',
        impact: 'positive',
        tip: 'Keep being genuine and asking personalized questions',
      },
      {
        title: 'Response Time Matters',
        description: 'Users who respond within 2 hours are 3x more likely to meet',
        impact: 'neutral',
        tip: 'Try to respond to messages within a few hours',
      },
      {
        title: 'Emoji Usage',
        description: 'Using 1-2 emojis increases response rates by 25%',
        impact: 'positive',
        tip: "Don't overuse emojis, but a couple can help break the ice",
      },
    ];

    const tips = [
      'Ask open-ended questions to keep conversations flowing',
      'Share something personal early to build trust',
      'Show genuine interest in their hobbies and interests',
      'Avoid one-word responses',
      'Use humor when appropriate',
      'Plan a date within 3-5 exchanges',
    ];

    const patterns = {
      averageMessageLength: '45 characters',
      averageResponseTime: '2 hours',
      mostCommonTopics: ['travel', 'food', 'hobbies'],
      conversationDuration: '3-5 exchanges before meeting',
    };

    return res.status(200).json({
      success: true,
      data: {
        insights,
        tips,
        patterns,
      },
    });
  } catch (error) {
    logger.error('Error getting insights:', { error: error.message, stack: error.stack });
    return sendError(res, 500, { message: 'Failed to get conversation insights', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

/**
 * Helper function to calculate profile completeness
 */
const calculateCompletenessScore = (user) => {
  let score = 0;
  const maxPoints = 100;

  if (user.photos && user.photos.length > 0) score += 20;
  if (user.photos && user.photos.length >= 3) score += 10;
  if (user.bio && user.bio.length > 20) score += 15;
  if (user.interests && user.interests.length > 0) score += 20;
  if (user.interests && user.interests.length >= 5) score += 10;
  if (user.age) score += 10;
  if (user.gender) score += 10;
  if (user.location) score += 5;

  return Math.min(score, maxPoints);
};

/**
 * Mock LLM function - generates match-based icebreakers without OpenAI
 * Generates conversation starters based on BOTH users' profiles
 */
const generateMatchIcebreakersMock = (currentUser, matchUser) => {
  const icebreakers = [];
  const currentInterests = currentUser.interests || [];
  const matchInterests = matchUser.interests || [];
  const currentBio = currentUser.bio || '';
  const matchBio = matchUser.bio || '';

  // Find common interests
  const commonInterests = currentInterests.filter((interest) =>
    matchInterests.some((mi) => mi.toLowerCase() === interest.toLowerCase())
  );

  // Generate icebreakers based on common interests
  if (commonInterests.length > 0) {
    const sharedInterest = commonInterests[0];
    icebreakers.push(
      `I noticed we both love ${sharedInterest.toLowerCase()}! What got you into it?`,
      `A fellow ${sharedInterest.toLowerCase()} enthusiast! What's your favorite thing about it?`
    );
  }

  // Generate icebreaker based on match's unique interests
  const uniqueMatchInterests = matchInterests.filter(
    (interest) => !currentInterests.some((ci) => ci.toLowerCase() === interest.toLowerCase())
  );
  if (uniqueMatchInterests.length > 0) {
    const uniqueInterest = uniqueMatchInterests[0];
    icebreakers.push(
      `I saw you're into ${uniqueInterest.toLowerCase()} - I've always been curious about that! Can you tell me more?`
    );
  }

  // Generate icebreaker mentioning current user's interest
  if (currentInterests.length > 0 && icebreakers.length < 3) {
    const myInterest = currentInterests[0];
    icebreakers.push(
      `I'm really into ${myInterest.toLowerCase()} - have you ever tried it? Would love to share the experience!`
    );
  }

  // If we have bio info, incorporate it
  if (matchBio && matchBio.length > 0 && icebreakers.length < 3) {
    const bioKeywords = matchBio.toLowerCase().match(/\b\w{4,}\b/g) || [];
    if (bioKeywords.length > 0) {
      const keyword = bioKeywords[Math.floor(Math.random() * bioKeywords.length)];
      icebreakers.push(
        `Your bio caught my attention - especially the part about "${keyword}". What's the story there?`
      );
    }
  }

  // Fill with engaging generic ones if needed
  const genericIcebreakers = [
    `Hey ${matchUser.name || 'there'}! Your profile really stood out to me. What's something you're passionate about right now?`,
    `Hi! I'm curious - what's the most interesting thing that happened to you recently?`,
    `Hey! If you could have dinner with anyone, who would it be and why?`,
  ];

  while (icebreakers.length < 3) {
    const generic = genericIcebreakers[icebreakers.length];
    if (generic && !icebreakers.includes(generic)) {
      icebreakers.push(generic);
    }
  }

  return icebreakers.slice(0, 3);
};

/**
 * OpenAI API function - generates match-based icebreakers using OpenAI
 * Uses both users' profiles to create highly personalized conversation starters
 */
const generateMatchIcebreakersOpenAI = async (currentUser, matchUser) => {
  let OpenAI;
  try {
    OpenAI = require('openai').OpenAI;
  } catch (error) {
    logger.warn('OpenAI package not installed, falling back to mock');
    return generateMatchIcebreakersMock(currentUser, matchUser);
  }

  if (!process.env.OPENAI_API_KEY) {
    return generateMatchIcebreakersMock(currentUser, matchUser);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Format user profiles for the prompt
  const currentInterests =
    currentUser.interests?.length > 0 ? currentUser.interests.join(', ') : 'Not specified';
  const matchInterests =
    matchUser.interests?.length > 0 ? matchUser.interests.join(', ') : 'Not specified';

  const currentBio = currentUser.bio || 'No bio provided';
  const matchBio = matchUser.bio || 'No bio provided';

  // Find common interests for the prompt
  const commonInterests = (currentUser.interests || []).filter((interest) =>
    (matchUser.interests || []).some((mi) => mi.toLowerCase() === interest.toLowerCase())
  );

  const prompt = `You are a dating app conversation coach. Generate 3 unique, engaging, and non-generic conversation starters (icebreakers) for a user to send to their match.

YOUR USER'S PROFILE:
- Name: ${currentUser.name || 'User'}
- Interests: ${currentInterests}
- Bio: ${currentBio}

THEIR MATCH'S PROFILE:
- Name: ${matchUser.name || 'Match'}
- Interests: ${matchInterests}
- Bio: ${matchBio}

COMMON INTERESTS: ${commonInterests.length > 0 ? commonInterests.join(', ') : 'None identified'}

REQUIREMENTS:
1. Make each icebreaker unique and personalized - reference specific details from BOTH profiles
2. If there are common interests, leverage them to create connection
3. Be playful, witty, and show genuine curiosity
4. Keep each message 1-2 sentences max
5. Vary the style: one could be a question, one could be playful observation, one could reference shared interests
6. Don't be creepy, overly forward, or generic
7. Show personality and make the match want to respond

Return your response as a JSON object with an "icebreakers" array containing exactly 3 strings.
Example format: {"icebreakers": ["First icebreaker...", "Second icebreaker...", "Third icebreaker..."]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a witty dating coach who helps people start engaging conversations. You create personalized, fun, and thoughtful conversation starters that make people want to respond. Always return valid JSON with an "icebreakers" array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    const responseString = response || '';

    if (!responseString) {
      return ['Hey! How are you?', "What's your favorite hobby?", 'Tell me about yourself!'];
    }

    try {
      const parsed = JSON.parse(responseString);
      if (parsed.icebreakers && Array.isArray(parsed.icebreakers)) {
        return parsed.icebreakers.slice(0, 3);
      }
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    } catch (e) {
      // Try to extract array from response if JSON parsing fails
      const arrayMatch = responseString ? responseString.match(/\[([\s\S]*?)\]/) : null;
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]).slice(0, 3);
        } catch (e2) {
          // Fall through to mock
        }
      }
    }

    return generateMatchIcebreakersMock(currentUser, matchUser);
  } catch (error) {
    logger.error('OpenAI API error for match icebreakers:', {
      error: error.message,
      stack: error.stack,
    });
    return generateMatchIcebreakersMock(currentUser, matchUser);
  }
};

/**
 * Generate icebreaker messages for a match (using both users' profiles)
 * POST /api/ai/icebreaker (with matchId parameter)
 *
 * This endpoint generates personalized conversation starters based on
 * both users' interests and bios for more meaningful icebreakers.
 *
 * @param {import('../types/index').AuthenticatedRequest} req - Express request object, containing matchId in the body.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<any>} - A promise that resolves to an Express response.
 */
const generateMatchIcebreakers = async (req, res) => {
  try {
    const { matchId } = req.body;
    const currentUserId = req.user?.id;

    // Validate matchId
    if (!matchId) {
      return sendError(res, 400, { message: 'matchId is required' });
    }

    // Validate matchId format (MongoDB ObjectId)
    if (!require('mongoose').Types.ObjectId.isValid(matchId)) {
      return sendError(res, 400, { message: 'Invalid matchId format' });
    }

    // Get current user if authenticated
    let currentUser = null;
    if (currentUserId && require('mongoose').Types.ObjectId.isValid(currentUserId)) {
      currentUser = await User.findById(currentUserId).select('name interests bio matches');
    }

    // Get match user from database
    const matchUser = await User.findById(matchId).select('name interests bio');

    if (!matchUser) {
      return res.status(404).json({
        success: false,
        message: 'Match user not found',
      });
    }

    // Verify that these users are actually matched (if current user is authenticated)
    if (currentUser && currentUser.matches) {
      const isMatched = currentUser.matches.some((m) => m.toString() === matchId.toString());
      if (!isMatched) {
        return res.status(403).json({
          success: false,
          message: 'You are not matched with this user',
        });
      }
    }

    // Generate icebreakers
    let icebreakers;

    // Use OpenAI if available and both users have profiles
    if (process.env.OPENAI_API_KEY && process.env.USE_OPENAI !== 'false') {
      try {
        if (currentUser) {
          // Use both users' profiles for personalized icebreakers
          icebreakers = await generateMatchIcebreakersOpenAI(currentUser, matchUser);
        } else {
          // Fallback to single-user icebreakers if no current user
          icebreakers = await generateIcebreakersOpenAI(
            matchUser.interests || [],
            matchUser.bio || ''
          );
        }
      } catch (error) {
        logger.error('OpenAI generation failed, falling back to mock:', {
          error: error.message,
          stack: error.stack,
        });
        if (currentUser) {
          icebreakers = generateMatchIcebreakersMock(currentUser, matchUser);
        } else {
          icebreakers = generateIcebreakersMock(matchUser.interests || [], matchUser.bio || '');
        }
      }
    } else {
      // Use mock LLM
      if (currentUser) {
        icebreakers = generateMatchIcebreakersMock(currentUser, matchUser);
      } else {
        icebreakers = generateIcebreakersMock(matchUser.interests || [], matchUser.bio || '');
      }
    }

    // Ensure we have exactly 3 icebreakers
    while (icebreakers.length < 3) {
      icebreakers.push(
        `Hey ${matchUser.name || 'there'}! I'd love to get to know you better. What's something interesting about you?`
      );
    }

    // Find common interests for response
    const commonInterests =
      currentUser?.interests?.filter((interest) =>
        matchUser.interests?.some((mi) => mi.toLowerCase() === interest.toLowerCase())
      ) || [];

    return res.status(200).json({
      success: true,
      icebreakers: icebreakers.slice(0, 3),
      matchInfo: {
        matchId: matchId,
        matchName: matchUser.name,
        commonInterests: commonInterests,
        hasCommonInterests: commonInterests.length > 0,
      },
    });
  } catch (error) {
    logger.error('Error generating match icebreakers:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, { message: 'Failed to generate icebreakers', error: process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined, });
  }
};

module.exports = {
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
};

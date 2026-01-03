const User = require('../models/User');

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
      `Hey! I'd love to get to know you better. What's something that always makes you smile?`
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
    OpenAI = require('openai');
  } catch (error) {
    console.warn('OpenAI package not installed, falling back to mock');
    return generateIcebreakersMock(interests, bio);
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const interestsText = interests && interests.length > 0 
    ? `Interests: ${interests.join(', ')}` 
    : 'No specific interests listed';
  
  const bioText = bio && bio.length > 0 
    ? `Bio: ${bio}` 
    : 'No bio provided';

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
          content: 'You are a helpful assistant that generates engaging icebreaker messages for a dating app. Always return a valid JSON array of exactly 3 strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    
    // Try to parse as JSON object first (if OpenAI returns wrapped JSON)
    try {
      const parsed = JSON.parse(response);
      if (parsed.icebreakers && Array.isArray(parsed.icebreakers)) {
        return parsed.icebreakers.slice(0, 3);
      }
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    } catch (e) {
      // If not JSON, try to extract array from text
      const arrayMatch = response.match(/\[(.*?)\]/s);
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
    console.error('OpenAI API error:', error);
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
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required'
      });
    }

    // Validate targetUserId format (MongoDB ObjectId)
    if (!require('mongoose').Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetUserId format'
      });
    }

    // Get target user from database
    const targetUser = await User.findById(targetUserId).select('interests bio name');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
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
        console.error('OpenAI generation failed, falling back to mock:', error);
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
      icebreakers: icebreakers.slice(0, 3)
    });

  } catch (error) {
    console.error('Error generating icebreakers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate icebreakers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generateIcebreakers
};

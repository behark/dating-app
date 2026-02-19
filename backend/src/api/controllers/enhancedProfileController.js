const User = require('../../core/domain/User');
const { logger } = require('../../infrastructure/external/LoggingService');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');

// Predefined prompts
const PROFILE_PROMPTS = [
  { id: 'traveling', question: 'Where would I love to travel next?' },
  { id: 'weekend', question: 'My ideal weekend looks like...' },
  { id: 'binge_watch', question: 'My favorite thing to binge-watch is...' },
  { id: 'pet_peeve', question: 'My biggest pet peeve is...' },
  { id: 'hobby', question: 'My hidden talent is...' },
  { id: 'favorite_food', question: 'My comfort food is...' },
  { id: 'movie', question: 'My all-time favorite movie is...' },
  { id: 'book', question: 'A book that changed my life...' },
  { id: 'learn', question: "I'd love to learn how to..." },
  { id: 'proud', question: "I'm most proud of..." },
  { id: 'superpower', question: 'If I had a superpower, it would be...' },
  { id: 'adventure', question: 'My craziest adventure was...' },
];

// @route   GET /api/profile/prompts/list
// @desc    Get all available profile prompts
// @access  Public
exports.getAllPrompts = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        prompts: PROFILE_PROMPTS,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Get prompts error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error fetching prompts',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/prompts/update
// @desc    Update user profile prompts (max 3)
// @access  Private
exports.updatePrompts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompts } = req.body; // Array of { promptId, answer }

    if (!Array.isArray(prompts)) {
      return sendError(res, 400, { message: 'Prompts must be an array' });
    }

    if (prompts.length > 3) {
      return sendError(res, 400, { message: 'Maximum 3 prompts allowed' });
    }

    // Validate prompts
    for (const prompt of prompts) {
      const validPrompt = PROFILE_PROMPTS.find((p) => p.id === prompt.promptId);
      if (!validPrompt) {
        return res.status(400).json({
          success: false,
          message: `Invalid prompt ID: ${prompt.promptId}`,
        });
      }

      if (!prompt.answer || prompt.answer.trim().length === 0) {
        return sendError(res, 400, { message: 'Prompt answer cannot be empty' });
      }

      if (prompt.answer.length > 300) {
        return sendError(res, 400, { message: 'Prompt answer must not exceed 300 characters' });
      }
    }

    const user = await User.findByIdAndUpdate(userId, { profilePrompts: prompts }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile prompts updated successfully',
      data: {
        prompts: user.profilePrompts,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Update prompts error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error updating prompts',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/education
// @desc    Update user education information
// @access  Private
exports.updateEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { school, degree, fieldOfStudy, graduationYear } = req.body;

    const updateData = {};
    if (school || degree || fieldOfStudy || graduationYear) {
      updateData.education = {
        school: school?.trim(),
        degree: degree?.trim(),
        fieldOfStudy: fieldOfStudy?.trim(),
        graduationYear,
      };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Education information updated',
      data: {
        education: user.education,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Update education error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error updating education',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/occupation
// @desc    Update user occupation information
// @access  Private
exports.updateOccupation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobTitle, company, industry } = req.body;

    const updateData = {};
    if (jobTitle || company || industry) {
      updateData.occupation = {
        jobTitle: jobTitle?.trim(),
        company: company?.trim(),
        industry: industry?.trim(),
      };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Occupation information updated',
      data: {
        occupation: user.occupation,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Update occupation error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error updating occupation',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/height
// @desc    Update user height
// @access  Private
exports.updateHeight = async (req, res) => {
  try {
    const userId = req.user._id;
    const { value, unit } = req.body;

    if (!value || !unit) {
      return sendError(res, 400, { message: 'Height value and unit are required' });
    }

    if (unit !== 'cm' && unit !== 'ft') {
      return res.status(400).json({
        success: false,
        message: 'Unit must be "cm" or "ft"',
      });
    }

    const user = await User.findByIdAndUpdate(userId, { height: { value, unit } }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Height updated',
      data: {
        height: user.height,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Update height error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error updating height',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/ethnicity
// @desc    Update user ethnicity
// @access  Private
exports.updateEthnicity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { ethnicity } = req.body;

    if (!Array.isArray(ethnicity)) {
      return sendError(res, 400, { message: 'Ethnicity must be an array' });
    }

    if (ethnicity.length > 3) {
      return sendError(res, 400, { message: 'Maximum 3 ethnicities allowed' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ethnicity: ethnicity.map((e) => e.trim()) },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Ethnicity updated',
      data: {
        ethnicity: user.ethnicity,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Update ethnicity error:', { error: error.message, stack: error.stack });
    sendError(res, 500, {
      message: 'Error updating ethnicity',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

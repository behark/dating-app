const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllPrompts,
  updatePrompts,
  updateEducation,
  updateOccupation,
  updateHeight,
  updateEthnicity,
} = require('../controllers/enhancedProfileController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // @ts-ignore - express-validator union type handling
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

// Get all available prompts
router.get('/prompts/list', getAllPrompts);

// Update profile prompts
router.put(
  '/prompts/update',
  authenticate,
  [
    body('prompts').isArray().withMessage('Prompts must be an array'),
    body('prompts.*.promptId').notEmpty().withMessage('Prompt ID is required'),
    body('prompts.*.answer').notEmpty().withMessage('Answer is required').isLength({ max: 300 }),
  ],
  handleValidationErrors,
  updatePrompts
);

// Update education
router.put(
  '/education',
  authenticate,
  [
    body('school').optional().trim(),
    body('degree').optional().trim(),
    body('fieldOfStudy').optional().trim(),
    body('graduationYear').optional().isInt(),
  ],
  handleValidationErrors,
  updateEducation
);

// Update occupation
router.put(
  '/occupation',
  authenticate,
  [
    body('jobTitle').optional().trim(),
    body('company').optional().trim(),
    body('industry').optional().trim(),
  ],
  handleValidationErrors,
  updateOccupation
);

// Update height
router.put(
  '/height',
  authenticate,
  [
    body('value').notEmpty().isFloat({ min: 0 }).withMessage('Valid height value is required'),
    body('unit').isIn(['cm', 'ft']).withMessage('Unit must be cm or ft'),
  ],
  handleValidationErrors,
  updateHeight
);

// Update ethnicity
router.put(
  '/ethnicity',
  authenticate,
  [body('ethnicity').isArray().withMessage('Ethnicity must be an array')],
  handleValidationErrors,
  updateEthnicity
);

module.exports = router;

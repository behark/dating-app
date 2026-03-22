const express = require('express');
const { param, validationResult } = require('express-validator');
const { getFeatureFlags, updateFeatureFlag } = require('../controllers/featureFlagController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get feature flags (any authenticated user)
router.get('/', getFeatureFlags);

// Update a feature flag (admin only)
router.put(
  '/:flagName',
  isAdmin,
  [
    param('flagName')
      .trim()
      .notEmpty()
      .withMessage('Flag name is required')
      .isLength({ max: 100 })
      .withMessage('Flag name must not exceed 100 characters'),
  ],
  (req, res, next) => {
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
  },
  updateFeatureFlag
);

module.exports = router;

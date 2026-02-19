const express = require('express');
const { getFeatureFlags, updateFeatureFlag } = require('../controllers/featureFlagController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getFeatureFlags);
router.put('/:flagName', updateFeatureFlag);

module.exports = router;

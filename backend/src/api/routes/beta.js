const express = require('express');
const { getBetaFeatures, enrollInBeta } = require('../controllers/betaController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/features', getBetaFeatures);
router.post('/enroll', enrollInBeta);

module.exports = router;

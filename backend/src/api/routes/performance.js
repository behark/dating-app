const express = require('express');
const {
  getPerformanceMetrics,
  reportPerformance,
} = require('../controllers/performanceController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/metrics', getPerformanceMetrics);
router.post('/report', reportPerformance);

module.exports = router;

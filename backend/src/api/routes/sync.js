const express = require('express');
const { executeOfflineActions } = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/execute', executeOfflineActions);

module.exports = router;

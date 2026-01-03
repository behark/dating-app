const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const mediaMessagesController = require('../controllers/mediaMessagesController');

// GIFs
router.post('/gif', authenticate, mediaMessagesController.sendGifMessage);
router.get('/gifs/popular', authenticate, mediaMessagesController.getPopularGifs);
router.get('/gifs/search', authenticate, mediaMessagesController.searchGifs);

// Stickers
router.post('/sticker', authenticate, mediaMessagesController.sendStickerMessage);
router.get('/sticker-packs', authenticate, mediaMessagesController.getStickerPacks);

// Voice Messages
router.post('/voice', authenticate, mediaMessagesController.sendVoiceMessage);
router.post('/voice/transcribe', authenticate, mediaMessagesController.transcribeVoiceMessage);

// Video Calls
router.post('/video-call/initiate', authenticate, mediaMessagesController.initiateVideoCall);
router.put('/video-call/status', authenticate, mediaMessagesController.updateVideoCallStatus);

module.exports = router;

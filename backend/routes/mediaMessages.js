const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mediaMessagesController = require('../controllers/mediaMessagesController');

// GIFs
router.post('/gif', auth, mediaMessagesController.sendGifMessage);
router.get('/gifs/popular', auth, mediaMessagesController.getPopularGifs);
router.get('/gifs/search', auth, mediaMessagesController.searchGifs);

// Stickers
router.post('/sticker', auth, mediaMessagesController.sendStickerMessage);
router.get('/sticker-packs', auth, mediaMessagesController.getStickerPacks);

// Voice Messages
router.post('/voice', auth, mediaMessagesController.sendVoiceMessage);
router.post('/voice/transcribe', auth, mediaMessagesController.transcribeVoiceMessage);

// Video Calls
router.post('/video-call/initiate', auth, mediaMessagesController.initiateVideoCall);
router.put('/video-call/status', auth, mediaMessagesController.updateVideoCallStatus);

module.exports = router;

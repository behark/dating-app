const express = require('express');
const router = express.Router();

// Import routes
const discoveryRoutes = require('./discovery');
const chatRoutes = require('./chat');
const aiRoutes = require('./ai');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const swipeRoutes = require('./swipe');
const notificationRoutes = require('./notifications');
const enhancedProfileRoutes = require('./enhancedProfile');
const activityRoutes = require('./activity');
const socialMediaRoutes = require('./socialMedia');
const safetyRoutes = require('./safety');
const premiumRoutes = require('./premium');
const paymentRoutes = require('./payment');
const advancedInteractionsRoutes = require('./advancedInteractions');
const discoveryEnhancementsRoutes = require('./discoveryEnhancements');
const mediaMessagesRoutes = require('./mediaMessages');
const gamificationRoutes = require('./gamification');
const socialFeaturesRoutes = require('./socialFeatures');
const privacyRoutes = require('./privacy');
const metricsRoutes = require('./metrics');
const usersRoutes = require('./users');
const uploadRoutes = require('./upload');

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile/enhanced', enhancedProfileRoutes);
router.use('/profile', profileRoutes);
router.use('/activity', activityRoutes);
router.use('/social-media', socialMediaRoutes);
router.use('/discovery', discoveryEnhancementsRoutes);
router.use('/', discoveryRoutes);
router.use('/chat/media', mediaMessagesRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', aiRoutes);
router.use('/swipes', swipeRoutes);

// Disabled: nice-to-have features (files kept in codebase)
router.use('/interactions', advancedInteractionsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/safety', safetyRoutes);
router.use('/premium', premiumRoutes);
// router.use('/payment', paymentRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/social', socialFeaturesRoutes);
router.use('/privacy', privacyRoutes);
router.use('/metrics', metricsRoutes);
router.use('/users', usersRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

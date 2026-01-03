const Swipe = require('../models/Swipe');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Helper function to send notifications
 */
const sendNotificationInternal = async (toUserId, type, title, message, data) => {
  try {
    const user = await User.findById(toUserId);
    if (!user || !user.notificationPreferences) return;

    const prefs = user.notificationPreferences;
    let shouldSend = false;

    switch (type) {
      case 'match':
        shouldSend = prefs.matchNotifications !== false;
        break;
      case 'like':
        shouldSend = prefs.likeNotifications !== false;
        break;
    }

    if (shouldSend) {
      console.log(`[NOTIFICATION] To: ${toUserId}, Type: ${type}, Title: ${title}`);
      // In production, integrate with Expo push notification service
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Create a new swipe with daily limit checking
 */
const createSwipe = async (req, res) => {
  try {
    const { targetId, action } = req.body;
    const swiperId = req.user.id;

    // Validate input
    if (!targetId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: targetId, action'
      });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: like, pass, superlike'
      });
    }

    // Check if user is premium using Subscription model
    const subscription = await Subscription.findOne({ userId: swiperId });
    const isPremium = subscription && subscription.isActive;

    // Check swipe limit for free users
    const limitCheck = await Swipe.canSwipe(swiperId, isPremium);
    if (!limitCheck.canSwipe) {
      return res.status(429).json({
        success: false,
        message: 'Daily swipe limit reached',
        remaining: 0,
        limit: 50
      });
    }

    // Check if swipe already exists
    const existingSwipe = await Swipe.findOne({
      swiperId: swiperId,
      swipedId: targetId
    });

    if (existingSwipe) {
      return res.status(400).json({
        success: false,
        message: 'You have already swiped on this profile'
      });
    }

    // Create swipe
    const swipe = new Swipe({
      swiperId: swiperId,
      swipedId: targetId,
      action: action
    });

    await swipe.save();

    // Track received like for "See Who Liked You" feature
    if (action === 'like' || action === 'superlike') {
      await User.findByIdAndUpdate(
        targetId,
        {
          $push: {
            receivedLikes: {
              fromUserId: swiperId,
              action: action,
              receivedAt: new Date()
            }
          }
        },
        { new: true }
      );
    }

    // Check for match if it's a like
    let isMatch = false;
    let matchData = null;
    const swiperUser = await User.findById(swiperId);

    if (action === 'like' || action === 'superlike') {
      // TD-004: Added .lean() for read-only reverse match lookup
      const reverseSwipe = await Swipe.findOne({
        swiperId: targetId,
        swipedId: swiperId,
        action: { $in: ['like', 'superlike'] }
      }).lean();

      if (reverseSwipe) {
        isMatch = true;
        // Update both users' match arrays
        await User.findByIdAndUpdate(
          swiperId,
          { $addToSet: { matches: targetId } },
          { new: true }
        );

        await User.findByIdAndUpdate(
          targetId,
          { $addToSet: { matches: swiperId } },
          { new: true }
        );

        // Get the swiped user's name for notification
        const swipedUser = await User.findById(targetId).select('name');
        const swiperUserName = swiperUser.name || 'Someone';

        // Send match notifications to both users
        await sendNotificationInternal(
          targetId,
          'match',
          '🎉 It\'s a Match!',
          `You and ${swiperUserName} liked each other!`,
          { type: 'match', matcherId: swiperId }
        );

        await sendNotificationInternal(
          swiperId,
          'match',
          '🎉 It\'s a Match!',
          `You and ${swipedUser?.name || 'Someone'} liked each other!`,
          { type: 'match', matcherId: targetId }
        );
      } else {
        // Send like notification to the target user if they haven't matched yet
        const swiperUserName = swiperUser.name || 'Someone';
        await sendNotificationInternal(
          targetId,
          'like',
          '💗 New Like!',
          `${swiperUserName} liked your profile!`,
          { type: 'like', likerId: swiperId }
        );
      }
    }

    return res.json({
      success: true,
      data: {
        swipeId: swipe._id,
        action: action,
        match: isMatch,
        remaining: limitCheck.remaining - 1
      }
    });
  } catch (error) {
    console.error('Error creating swipe:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating swipe'
    });
  }
};

/**
 * Get swipe count for today
 */
const getSwipeCountToday = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has premium subscription
    const subscription = await Subscription.findOne({ userId });
    const isPremium = subscription && subscription.isActive;

    if (isPremium) {
      return res.json({
        success: true,
        data: {
          used: 0,
          remaining: -1,
          limit: 'unlimited',
          isPremium: true
        }
      });
    }

    const limitCheck = await Swipe.canSwipe(userId, false);

    res.json({
      success: true,
      data: {
        used: limitCheck.used,
        remaining: limitCheck.remaining,
        limit: 50,
        isPremium: false
      }
    });
  } catch (error) {
    console.error('Error getting swipe count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving swipe count'
    });
  }
};

/**
 * Undo last swipe
 */
const undoSwipe = async (req, res) => {
  try {
    const { swipeId } = req.body;
    const userId = req.user.id;

    if (!swipeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: swipeId'
      });
    }

    const swipe = await Swipe.findById(swipeId);

    if (!swipe) {
      return res.status(404).json({
        success: false,
        message: 'Swipe not found'
      });
    }

    if (swipe.swiperId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this swipe'
      });
    }

    // Delete the swipe
    await Swipe.findByIdAndDelete(swipeId);

    res.json({
      success: true,
      message: 'Swipe undone successfully'
    });
  } catch (error) {
    console.error('Error undoing swipe:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while undoing swipe'
    });
  }
};

/**
 * Get user's swipes
 */
const getUserSwipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const swipes = await Swipe.find({ swiperId: userId })
      .populate('swipedId', 'name photoURL age')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        swipes: swipes,
        count: swipes.length
      }
    });
  } catch (error) {
    console.error('Error getting user swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving swipes'
    });
  }
};

/**
 * Get received swipes (likes)
 */
const getReceivedSwipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const swipes = await Swipe.find({
      swipedId: userId,
      action: { $in: ['like', 'superlike'] }
    })
      .populate('swiperId', 'name photoURL age')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        swipes: swipes,
        count: swipes.length
      }
    });
  } catch (error) {
    console.error('Error getting received swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving received swipes'
    });
  }
};

module.exports = {
  createSwipe,
  getSwipeCountToday,
  undoSwipe,
  getUserSwipes,
  getReceivedSwipes
};

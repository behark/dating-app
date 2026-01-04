/**
 * Background Jobs Processors
 * Job handlers for queue processing
 */

const QueueService = require('./QueueService');
const { cache, CACHE_KEYS, CACHE_TTL } = require('../config/redis');
const StorageService = require('./StorageService');

// Models
const User = require('../models/User');
const Message = require('../models/Message');
const Swipe = require('../models/Swipe');

// Constants
const { QUEUES, JOB_TYPES } = QueueService;

/**
 * Initialize all job processors
 */
const initializeProcessors = () => {
  // Notification processors
  setupNotificationProcessors();
  
  // Match processors
  setupMatchProcessors();
  
  // Email processors
  setupEmailProcessors();
  
  // Moderation processors
  setupModerationProcessors();
  
  // Analytics processors
  setupAnalyticsProcessors();
  
  // Cleanup processors
  setupCleanupProcessors();
  
  console.log('All job processors initialized');
};

/**
 * Notification Job Processors
 */
const setupNotificationProcessors = () => {
  const queue = QueueService.QUEUES.PUSH_NOTIFICATIONS;
  const notificationQueue = require('bull')(queue, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  // Process push notifications
  notificationQueue.process(JOB_TYPES.SEND_PUSH_NOTIFICATION, async (job) => {
    const { userId, title, body, data } = job.data;
    
    try {
      // Get user's push token
      const user = await User.findById(userId).select('expoPushToken notificationPreferences');
      
      if (!user?.expoPushToken) {
        return { success: false, reason: 'No push token' };
      }
      
      // Check notification preferences
      if (data.type === 'message' && !user.notificationPreferences?.messageNotifications) {
        return { success: false, reason: 'User disabled message notifications' };
      }
      if (data.type === 'match' && !user.notificationPreferences?.matchNotifications) {
        return { success: false, reason: 'User disabled match notifications' };
      }
      
      // Send via Expo Push Notification Service
      const { Expo } = require('expo-server-sdk');
      const expo = new Expo();
      
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        return { success: false, reason: 'Invalid push token' };
      }
      
      const message = {
        to: user.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      };
      
      const ticket = await expo.sendPushNotificationsAsync([message]);
      
      return { success: true, ticket };
    } catch (error) {
      console.error('Push notification error:', error);
      throw error;
    }
  });
  
  // Batch notifications
  notificationQueue.process(JOB_TYPES.SEND_BATCH_NOTIFICATIONS, async (job) => {
    const { notifications } = job.data;
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();
    
    const messages = [];
    
    for (const notif of notifications) {
      const user = await User.findById(notif.userId).select('expoPushToken');
      
      if (user?.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: notif.title,
          body: notif.body,
          data: notif.data,
        });
      }
    }
    
    if (messages.length === 0) {
      return { success: true, sent: 0 };
    }
    
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    
    return { success: true, sent: tickets.length };
  });
};

/**
 * Match Job Processors
 */
const setupMatchProcessors = () => {
  const Bull = require('bull');
  const matchQueue = new Bull(QUEUES.MATCHES, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  // Process new match
  matchQueue.process(JOB_TYPES.PROCESS_MATCH, async (job) => {
    const { swiperId, swipedId, matchId } = job.data;
    
    try {
      // Get both users
      const [swiper, swiped] = await Promise.all([
        User.findById(swiperId).select('name photos expoPushToken notificationPreferences'),
        User.findById(swipedId).select('name photos expoPushToken notificationPreferences'),
      ]);
      
      if (!swiper || !swiped) {
        return { success: false, reason: 'User not found' };
      }
      
      // Send match notifications to both users
      const notifications = [];
      
      if (swiper.notificationPreferences?.matchNotifications !== false && swiper.expoPushToken) {
        notifications.push({
          userId: swiperId,
          title: "It's a Match! 🎉",
          body: `You and ${swiped.name} liked each other!`,
          data: { type: 'match', matchId, userId: swipedId },
        });
      }
      
      if (swiped.notificationPreferences?.matchNotifications !== false && swiped.expoPushToken) {
        notifications.push({
          userId: swipedId,
          title: "It's a Match! 🎉",
          body: `You and ${swiper.name} liked each other!`,
          data: { type: 'match', matchId, userId: swiperId },
        });
      }
      
      // Queue notifications
      if (notifications.length > 0) {
        await QueueService.addJob(
          QUEUES.PUSH_NOTIFICATIONS,
          JOB_TYPES.SEND_BATCH_NOTIFICATIONS,
          { notifications }
        );
      }
      
      // Invalidate cache for both users
      await Promise.all([
        cache.del(`${CACHE_KEYS.MATCHES}${swiperId}`),
        cache.del(`${CACHE_KEYS.MATCHES}${swipedId}`),
        cache.del(`${CACHE_KEYS.DISCOVERY}${swiperId}`),
        cache.del(`${CACHE_KEYS.DISCOVERY}${swipedId}`),
      ]);
      
      // Update match counts
      await User.updateMany(
        { _id: { $in: [swiperId, swipedId] } },
        { $inc: { 'stats.totalMatches': 1 } }
      );
      
      return { success: true, matchId };
    } catch (error) {
      console.error('Process match error:', error);
      throw error;
    }
  });
  
  // Calculate compatibility score
  matchQueue.process(JOB_TYPES.CALCULATE_COMPATIBILITY, async (job) => {
    const { userId1, userId2 } = job.data;
    
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2),
    ]);
    
    if (!user1 || !user2) {
      return { success: false, score: 0 };
    }
    
    let score = 0;
    
    // Interest overlap (max 40 points)
    const commonInterests = user1.interests?.filter(i => 
      user2.interests?.includes(i)
    ) || [];
    score += Math.min(commonInterests.length * 5, 40);
    
    // Age preference match (max 20 points)
    const age1InRange = user1.age >= user2.preferredAgeRange?.min && 
                        user1.age <= user2.preferredAgeRange?.max;
    const age2InRange = user2.age >= user1.preferredAgeRange?.min && 
                        user2.age <= user1.preferredAgeRange?.max;
    if (age1InRange && age2InRange) score += 20;
    else if (age1InRange || age2InRange) score += 10;
    
    // Education similarity (max 15 points)
    if (user1.education?.school && user2.education?.school &&
        user1.education.school === user2.education.school) {
      score += 15;
    } else if (user1.education?.degree && user2.education?.degree &&
               user1.education.degree === user2.education.degree) {
      score += 10;
    }
    
    // Lifestyle compatibility (max 25 points)
    if (user1.lifestyle && user2.lifestyle) {
      const lifestyleMatch = [
        user1.lifestyle.smoking === user2.lifestyle.smoking,
        user1.lifestyle.drinking === user2.lifestyle.drinking,
        user1.lifestyle.exercise === user2.lifestyle.exercise,
        user1.lifestyle.diet === user2.lifestyle.diet,
        user1.lifestyle.pets === user2.lifestyle.pets,
      ].filter(Boolean).length;
      score += lifestyleMatch * 5;
    }
    
    return { success: true, score: Math.min(score, 100) };
  });
  
  // Update recommendations
  matchQueue.process(JOB_TYPES.UPDATE_RECOMMENDATIONS, async (job) => {
    const { userId } = job.data;
    
    // This would typically run a more sophisticated ML recommendation algorithm
    // For now, we just invalidate cache to force fresh discovery
    await cache.del(`${CACHE_KEYS.DISCOVERY}${userId}`);
    
    return { success: true };
  });
};

/**
 * Email Job Processors
 */
const setupEmailProcessors = () => {
  const Bull = require('bull');
  const emailQueue = new Bull(QUEUES.EMAILS, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  const nodemailer = require('nodemailer');
  
  // Create transporter only if credentials are configured
  let transporter = null;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    console.warn('⚠️  SMTP credentials not configured - email job processing disabled');
  }
  
  // Generic email sender
  emailQueue.process(JOB_TYPES.SEND_EMAIL, async (job) => {
    if (!transporter) {
      console.warn('Email service not configured - skipping email job');
      return { success: false, reason: 'Email service not configured' };
    }

    const { to, template, data } = job.data;
    
    const emailTemplates = {
      welcome: {
        subject: 'Welcome to Dating App! 💕',
        html: `<h1>Welcome, ${data.name}!</h1><p>Start finding your perfect match today.</p>`,
      },
      match: {
        subject: "You've got a new match! 🎉",
        html: `<h1>It's a Match!</h1><p>You and ${data.matchName} have liked each other.</p>`,
      },
      message: {
        subject: `New message from ${data.senderName}`,
        html: `<p>${data.senderName} sent you a message: "${data.preview}"</p>`,
      },
      verification: {
        subject: 'Verify your email',
        html: `<p>Your verification code is: <strong>${data.code}</strong></p>`,
      },
      passwordReset: {
        subject: 'Reset your password',
        html: `<p>Click <a href="${data.resetLink}">here</a> to reset your password.</p>`,
      },
    };
    
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Unknown email template: ${template}`);
    }
    
    try {
      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@datingapp.com',
        to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  });
  
  // Weekly digest
  emailQueue.process(JOB_TYPES.SEND_WEEKLY_DIGEST, async (job) => {
    if (!transporter) {
      console.warn('Email service not configured - skipping weekly digest job');
      return { success: false, reason: 'Email service not configured' };
    }

    const { userId } = job.data;
    
    const user = await User.findById(userId).select('email name');
    if (!user || !user.email) {
      return { success: false, reason: 'User not found or no email' };
    }
    
    // Get weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [views, likes, matches] = await Promise.all([
      User.countDocuments({ 
        'profileViews.viewerId': { $exists: true },
        'profileViews.viewedAt': { $gte: weekAgo },
        _id: userId,
      }),
      Swipe.countDocuments({
        swipedId: userId,
        action: 'like',
        createdAt: { $gte: weekAgo },
      }),
      Swipe.countDocuments({
        $or: [{ swiperId: userId }, { swipedId: userId }],
        isMatch: true,
        createdAt: { $gte: weekAgo },
      }),
    ]);
    
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@datingapp.com',
        to: user.email,
        subject: `Your weekly update on Dating App 📊`,
        html: `
          <h1>Hi ${user.name}!</h1>
          <p>Here's your activity this week:</p>
          <ul>
            <li>👀 Profile views: ${views}</li>
            <li>❤️ Likes received: ${likes}</li>
            <li>🎉 New matches: ${matches}</li>
          </ul>
          <p>Keep swiping to find your perfect match!</p>
        `,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
    
    return { success: true };
  });
};

/**
 * Moderation Job Processors
 */
const setupModerationProcessors = () => {
  const Bull = require('bull');
  const moderationQueue = new Bull(QUEUES.MODERATION, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  // Image moderation
  moderationQueue.process(JOB_TYPES.MODERATE_IMAGE, async (job) => {
    const { userId, imageUrl, photoId } = job.data;
    
    try {
      // Use Cloudinary's moderation or external service
      const result = await StorageService.moderateImage(imageUrl);
      
      // Update photo moderation status
      const status = result.safe ? 'approved' : 'rejected';
      
      await User.updateOne(
        { _id: userId, 'photos._id': photoId },
        { $set: { 'photos.$.moderationStatus': status } }
      );
      
      // If rejected, notify user
      if (!result.safe) {
        await QueueService.sendPushNotification(
          userId,
          'Photo Rejected',
          'One of your photos didn\'t meet our community guidelines and was removed.',
          { type: 'moderation', photoId }
        );
      }
      
      return { success: true, status, moderation: result.moderation };
    } catch (error) {
      console.error('Image moderation error:', error);
      throw error;
    }
  });
  
  // Profile review
  moderationQueue.process(JOB_TYPES.MODERATE_PROFILE, async (job) => {
    const { userId } = job.data;
    
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, reason: 'User not found' };
    }
    
    const issues = [];
    
    // Check bio for inappropriate content
    if (user.bio) {
      const bannedWords = ['spam', 'sell', 'buy', 'website', 'click here'];
      const lowerBio = user.bio.toLowerCase();
      const foundBanned = bannedWords.filter(w => lowerBio.includes(w));
      if (foundBanned.length > 0) {
        issues.push({ field: 'bio', reason: 'Potentially promotional content' });
      }
    }
    
    // Check for suspicious patterns
    if (user.photos?.length === 0 && user.bio?.length > 200) {
      issues.push({ field: 'profile', reason: 'Long bio with no photos' });
    }
    
    return { success: true, issues, needsReview: issues.length > 0 };
  });
};

/**
 * Analytics Job Processors
 */
const setupAnalyticsProcessors = () => {
  const Bull = require('bull');
  const analyticsQueue = new Bull(QUEUES.ANALYTICS, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  // Track event
  analyticsQueue.process(JOB_TYPES.TRACK_EVENT, async (job) => {
    const { userId, eventType, eventData, timestamp } = job.data;
    
    // Store in analytics collection or send to external service
    // For now, log and update user activity
    console.log(`Analytics: ${eventType} for user ${userId}`, eventData);
    
    await User.updateOne(
      { _id: userId },
      { 
        $set: { lastActive: timestamp },
        $push: {
          activityLog: {
            $each: [{ type: eventType, data: eventData, timestamp }],
            $slice: -100, // Keep last 100 activities
          },
        },
      }
    );
    
    return { success: true };
  });
  
  // Update user stats
  analyticsQueue.process(JOB_TYPES.UPDATE_USER_STATS, async (job) => {
    const { userId } = job.data;
    
    const [swipesGiven, swipesReceived, matches, messages] = await Promise.all([
      Swipe.countDocuments({ swiperId: userId }),
      Swipe.countDocuments({ swipedId: userId }),
      Swipe.countDocuments({
        $or: [{ swiperId: userId }, { swipedId: userId }],
        isMatch: true,
      }),
      Message.countDocuments({ senderId: userId }),
    ]);
    
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'stats.swipesGiven': swipesGiven,
          'stats.swipesReceived': swipesReceived,
          'stats.totalMatches': matches,
          'stats.messagesSent': messages,
        },
      }
    );
    
    return { success: true, stats: { swipesGiven, swipesReceived, matches, messages } };
  });
};

/**
 * Cleanup Job Processors
 */
const setupCleanupProcessors = () => {
  const Bull = require('bull');
  const cleanupQueue = new Bull(QUEUES.CLEANUP, {
    redis: process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    prefix: 'dating-app',
  });
  
  // Cleanup expired tokens
  cleanupQueue.process(JOB_TYPES.CLEANUP_EXPIRED_TOKENS, async (job) => {
    const result = await User.updateMany(
      { passwordResetTokenExpiry: { $lt: new Date() } },
      { $unset: { passwordResetToken: 1, passwordResetTokenExpiry: 1 } }
    );
    
    return { success: true, modified: result.modifiedCount };
  });
  
  // Cleanup old messages (archive messages older than 1 year)
  cleanupQueue.process(JOB_TYPES.CLEANUP_OLD_MESSAGES, async (job) => {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    // Archive to a separate collection before deleting
    const oldMessages = await Message.find({ createdAt: { $lt: oneYearAgo } });
    
    if (oldMessages.length > 0) {
      // In production, you'd move these to an archive collection
      console.log(`Archiving ${oldMessages.length} old messages`);
    }
    
    return { success: true, archived: oldMessages.length };
  });
  
  // Flag inactive users
  cleanupQueue.process(JOB_TYPES.CLEANUP_INACTIVE_USERS, async (job) => {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    
    const result = await User.updateMany(
      { 
        lastActive: { $lt: sixMonthsAgo },
        isActive: true,
        isDeactivated: { $ne: true },
      },
      { $set: { isInactive: true } }
    );
    
    return { success: true, flagged: result.modifiedCount };
  });
};

/**
 * Schedule recurring jobs
 */
const scheduleRecurringJobs = async () => {
  // Daily cleanup at 3 AM
  await QueueService.addRepeatableJob(
    QUEUES.CLEANUP,
    JOB_TYPES.CLEANUP_EXPIRED_TOKENS,
    {},
    { cron: '0 3 * * *' }
  );
  
  // Weekly message cleanup on Sundays at 4 AM
  await QueueService.addRepeatableJob(
    QUEUES.CLEANUP,
    JOB_TYPES.CLEANUP_OLD_MESSAGES,
    {},
    { cron: '0 4 * * 0' }
  );
  
  // Monthly inactive user cleanup on 1st at 5 AM
  await QueueService.addRepeatableJob(
    QUEUES.CLEANUP,
    JOB_TYPES.CLEANUP_INACTIVE_USERS,
    {},
    { cron: '0 5 1 * *' }
  );
  
  console.log('Recurring jobs scheduled');
};

module.exports = {
  initializeProcessors,
  scheduleRecurringJobs,
};

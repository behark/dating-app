/**
 * Queue Service
 * Message queue using Bull (Redis-backed) for background job processing
 */

const Bull = require('bull');
const { getRedis } = require('../config/redis');

// Queue configurations
const QUEUE_CONFIG = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 1000, // Keep last 1000 failed jobs
  },
  limiter: {
    max: 100, // Max jobs per duration
    duration: 1000, // Duration in ms
  },
};

// Queue names
const QUEUES = {
  NOTIFICATIONS: 'notifications',
  MATCHES: 'matches',
  EMAILS: 'emails',
  ANALYTICS: 'analytics',
  MODERATION: 'moderation',
  CLEANUP: 'cleanup',
  PUSH_NOTIFICATIONS: 'push-notifications',
};

// Job types
const JOB_TYPES = {
  // Notification jobs
  SEND_PUSH_NOTIFICATION: 'send-push-notification',
  SEND_BATCH_NOTIFICATIONS: 'send-batch-notifications',

  // Match jobs
  PROCESS_MATCH: 'process-match',
  CALCULATE_COMPATIBILITY: 'calculate-compatibility',
  UPDATE_RECOMMENDATIONS: 'update-recommendations',

  // Email jobs
  SEND_EMAIL: 'send-email',
  SEND_VERIFICATION_EMAIL: 'send-verification-email',
  SEND_MATCH_EMAIL: 'send-match-email',
  SEND_WEEKLY_DIGEST: 'send-weekly-digest',

  // Analytics jobs
  TRACK_EVENT: 'track-event',
  UPDATE_USER_STATS: 'update-user-stats',
  GENERATE_REPORT: 'generate-report',

  // Moderation jobs
  MODERATE_IMAGE: 'moderate-image',
  MODERATE_PROFILE: 'moderate-profile',
  REVIEW_REPORT: 'review-report',

  // Cleanup jobs
  CLEANUP_EXPIRED_TOKENS: 'cleanup-expired-tokens',
  CLEANUP_OLD_MESSAGES: 'cleanup-old-messages',
  CLEANUP_INACTIVE_USERS: 'cleanup-inactive-users',
  ARCHIVE_DATA: 'archive-data',
};

// Queue instances store
const queues = {};

/**
 * Get Redis connection config for Bull
 */
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return redisUrl;
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_QUEUE_DB) || 1, // Use different DB for queues
  };
};

/**
 * Create or get a queue instance
 */
const getQueue = (queueName) => {
  if (!queues[queueName]) {
    queues[queueName] = new Bull(queueName, {
      redis: getRedisConfig(),
      defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
      limiter: QUEUE_CONFIG.limiter,
      prefix: 'dating-app',
    });

    // Setup event handlers
    setupQueueEvents(queues[queueName], queueName);
  }

  return queues[queueName];
};

/**
 * Setup queue event handlers
 */
const setupQueueEvents = (queue, queueName) => {
  queue.on('error', (error) => {
    console.error(`Queue ${queueName} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    console.log(`Job ${jobId} waiting in ${queueName}`);
  });

  queue.on('active', (job) => {
    console.log(`Job ${job.id} started in ${queueName}`);
  });

  queue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed in ${queueName}`);
  });

  queue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed in ${queueName}:`, error.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled in ${queueName}`);
  });
};

/**
 * Queue Service API
 */
const QueueService = {
  /**
   * Add a job to a queue
   */
  async addJob(queueName, jobType, data, options = {}) {
    const queue = getQueue(queueName);

    const job = await queue.add(jobType, data, {
      ...QUEUE_CONFIG.defaultJobOptions,
      ...options,
    });

    console.log(`Added job ${job.id} to ${queueName}: ${jobType}`);
    return job;
  },

  /**
   * Add multiple jobs to a queue
   */
  async addBulkJobs(queueName, jobs) {
    const queue = getQueue(queueName);

    const bulkJobs = jobs.map(({ jobType, data, options = {} }) => ({
      name: jobType,
      data,
      opts: { ...QUEUE_CONFIG.defaultJobOptions, ...options },
    }));

    return queue.addBulk(bulkJobs);
  },

  /**
   * Schedule a job for later
   */
  async scheduleJob(queueName, jobType, data, delay) {
    return this.addJob(queueName, jobType, data, { delay });
  },

  /**
   * Add a repeatable job (cron)
   */
  async addRepeatableJob(queueName, jobType, data, repeatOptions) {
    const queue = getQueue(queueName);

    return queue.add(jobType, data, {
      repeat: repeatOptions,
      ...QUEUE_CONFIG.defaultJobOptions,
    });
  },

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id,
      state,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  },

  /**
   * Remove a job
   */
  async removeJob(queueName, jobId) {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (job) {
      await job.remove();
      return true;
    }

    return false;
  },

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName) {
    const queue = getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  },

  /**
   * Pause a queue
   */
  async pauseQueue(queueName) {
    const queue = getQueue(queueName);
    await queue.pause();
  },

  /**
   * Resume a queue
   */
  async resumeQueue(queueName) {
    const queue = getQueue(queueName);
    await queue.resume();
  },

  /**
   * Clean old jobs
   */
  async cleanQueue(queueName, grace = 3600000, status = 'completed') {
    const queue = getQueue(queueName);
    return queue.clean(grace, status);
  },

  /**
   * Close all queues
   */
  async closeAll() {
    const closePromises = Object.values(queues).map((queue) => queue.close());
    await Promise.all(closePromises);
    console.log('All queues closed');
  },

  // Convenience methods for common jobs

  /**
   * Queue a push notification
   */
  async sendPushNotification(userId, title, body, data = {}) {
    return this.addJob(QUEUES.PUSH_NOTIFICATIONS, JOB_TYPES.SEND_PUSH_NOTIFICATION, {
      userId,
      title,
      body,
      data,
    });
  },

  /**
   * Queue match processing
   */
  async processMatch(swiperId, swipedId, matchId) {
    return this.addJob(QUEUES.MATCHES, JOB_TYPES.PROCESS_MATCH, {
      swiperId,
      swipedId,
      matchId,
    });
  },

  /**
   * Queue email
   */
  async sendEmail(to, template, data) {
    return this.addJob(QUEUES.EMAILS, JOB_TYPES.SEND_EMAIL, {
      to,
      template,
      data,
    });
  },

  /**
   * Queue image moderation
   */
  async moderateImage(userId, imageUrl, photoId) {
    return this.addJob(
      QUEUES.MODERATION,
      JOB_TYPES.MODERATE_IMAGE,
      {
        userId,
        imageUrl,
        photoId,
      },
      { priority: 2 }
    );
  },

  /**
   * Queue analytics event
   */
  async trackEvent(userId, eventType, eventData) {
    return this.addJob(
      QUEUES.ANALYTICS,
      JOB_TYPES.TRACK_EVENT,
      {
        userId,
        eventType,
        eventData,
        timestamp: new Date(),
      },
      { priority: 10 }
    ); // Lower priority
  },

  // Expose constants
  QUEUES,
  JOB_TYPES,
};

module.exports = QueueService;

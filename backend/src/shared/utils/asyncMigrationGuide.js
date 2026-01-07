/**
 * Async/Await Migration Guide
 * TD-004: Guidelines and examples for migrating callback-based code to async/await
 *
 * This document provides patterns and examples for converting older callback-style
 * code to modern async/await syntax for improved readability and error handling.
 *
 * NOTE: This is a documentation file with example code patterns.
 * The models/services referenced are placeholders to demonstrate patterns.
 */

// ============================================================
// PLACEHOLDER DECLARATIONS (for example code to work)
// These represent the actual models/services in the codebase
// ============================================================

/* eslint-disable no-unused-vars */
/** @type {any} */ let db;
/** @type {any} */ let User;
/** @type {any} */ let Match;
/** @type {any} */ let Notification;
/** @type {any} */ let Stats;
/** @type {any} */ let NotificationService;
/** @type {any} */ let mongoose;
/** @type {any} */ let processUser;
/* eslint-enable no-unused-vars */

// ============================================================
// SECTION 1: CALLBACK TO PROMISE PATTERNS
// ============================================================

/**
 * PATTERN 1: Converting callback-based functions to Promises
 *
 * Before (callback style):
 * ```javascript
 * function getUserById(id, callback) {
 *   db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
 *     if (err) return callback(err);
 *     callback(null, results[0]);
 *   });
 * }
 * ```
 *
 * After (Promise-based):
 */
const getUserByIdPromise = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

/**
 * Even better - use util.promisify for Node.js core callbacks
 */
const util = require('util');
// const readFile = util.promisify(fs.readFile);
// const query = util.promisify(db.query.bind(db));

// ============================================================
// SECTION 2: CONTROLLER MIGRATION PATTERNS
// ============================================================

/**
 * PATTERN 2: Migrating Express controllers
 *
 * Before (callback style with nested callbacks):
 * ```javascript
 * exports.getUser = function(req, res) {
 *   User.findById(req.params.id, function(err, user) {
 *     if (err) {
 *       return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
 *     }
 *     if (!user) {
 *       return res.status(404).json({ message: 'User not found' });
 *     }
 *     user.getMatches(function(err, matches) {
 *       if (err) {
 *         return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
 *       }
 *       res.json({ user, matches });
 *     });
 *   });
 * };
 * ```
 *
 * After (async/await):
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const matches = await user.getMatches();

    res.json({
      success: true,
      data: { user, matches },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

// ============================================================
// SECTION 3: ERROR HANDLING PATTERNS
// ============================================================

/**
 * PATTERN 3: Centralized error handling with async wrapper
 *
 * Create a utility to wrap async controllers for consistent error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage example:
// router.get('/users/:id', asyncHandler(async (req, res) => {
//   const user = await User.findById(req.params.id);
//   if (!user) throw new NotFoundError('User not found');
//   res.json({ success: true, data: user });
// }));

/**
 * PATTERN 4: Custom error classes for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

// ============================================================
// SECTION 4: PARALLEL OPERATIONS
// ============================================================

/**
 * PATTERN 5: Sequential vs Parallel async operations
 *
 * Before (sequential - slow):
 * ```javascript
 * const user = await User.findById(userId);
 * const matches = await Match.find({ userId });
 * const notifications = await Notification.find({ userId });
 * ```
 *
 * After (parallel - fast):
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Run independent queries in parallel
    const [user, matches, notifications, stats] = await Promise.all([
      User.findById(userId),
      Match.find({ userId }).limit(10),
      Notification.find({ userId, read: false }).limit(20),
      Stats.getForUser(userId),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
        matches,
        notifications,
        stats,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard',
    });
  }
};

/**
 * PATTERN 6: Promise.allSettled for operations that can partially fail
 */
exports.sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, message } = req.body;

    const results = await Promise.allSettled(
      userIds.map((userId) => NotificationService.send(userId, message))
    );

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
      failures: results
        .filter((r) => r.status === 'rejected')
        .map((r, i) => ({ userId: userIds[i], error: r.reason?.message })),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
    });
  }
};

// ============================================================
// SECTION 5: DATABASE TRANSACTION PATTERNS
// ============================================================

/**
 * PATTERN 7: MongoDB transactions with async/await
 */
exports.createMatchWithNotification = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { userId, targetUserId } = req.body;

    // Create the match
    const match = await Match.create(
      [
        {
          users: [userId, targetUserId],
          createdAt: new Date(),
        },
      ],
      { session }
    );

    // Create notifications for both users
    await Notification.create(
      [
        { userId, type: 'match', matchId: match[0]._id },
        { userId: targetUserId, type: 'match', matchId: match[0]._id },
      ],
      { session }
    );

    // Update user stats
    await User.updateMany(
      { _id: { $in: [userId, targetUserId] } },
      { $inc: { matchCount: 1 } },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      data: { match: match[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Match creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating match',
    });
  } finally {
    session.endSession();
  }
};

// ============================================================
// SECTION 6: RETRY PATTERNS
// ============================================================

/**
 * PATTERN 8: Retry with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage:
// const result = await retryWithBackoff(() => externalApiCall(), 3, 1000);

// ============================================================
// SECTION 7: STREAM/BATCH PROCESSING
// ============================================================

/**
 * PATTERN 9: Processing large datasets with async iteration
 */
exports.processAllUsers = async (req, res) => {
  try {
    const cursor = User.find({}).cursor();
    let processed = 0;
    let errors = 0;

    for await (const user of cursor) {
      try {
        await processUser(user);
        processed++;
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
        errors++;
      }
    }

    res.json({
      success: true,
      data: { processed, errors },
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in batch processing',
    });
  }
};

/**
 * PATTERN 10: Chunked batch processing
 */
const processBatch = async (items, batchSize, processor) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
};

// ============================================================
// SECTION 8: MIGRATION CHECKLIST
// ============================================================

/**
 * MIGRATION CHECKLIST:
 *
 * □ Replace function() with arrow functions or async functions
 * □ Replace callback parameters with await
 * □ Wrap await calls in try/catch blocks
 * □ Use Promise.all() for independent parallel operations
 * □ Use Promise.allSettled() when partial failures are acceptable
 * □ Add proper error logging with context
 * □ Return consistent response format: { success, data/message }
 * □ Add TypeScript types for better IDE support (optional)
 * □ Test error paths explicitly
 * □ Consider adding retry logic for external API calls
 * □ Use transactions for multi-document operations
 */

// ============================================================
// EXPORTS FOR USE AS UTILITIES
// ============================================================

module.exports = {
  asyncHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  retryWithBackoff,
  processBatch,
};

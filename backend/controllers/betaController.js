const BetaEnrollment = require('../models/BetaEnrollment');
const BetaFeedback = require('../models/BetaFeedback');
const BetaBug = require('../models/BetaBug');
const BetaSession = require('../models/BetaSession');
const User = require('../models/User');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Enroll user in beta program
 * POST /api/beta/enroll
 */
exports.enroll = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email, name, features, tier, deviceInfo, consent } = req.body;

    // Check if already enrolled
    const existing = await BetaEnrollment.findOne({ userId });
    if (existing) {
      return res.json({
        success: true,
        message: 'User already enrolled in beta program',
        data: { enrollment: existing },
      });
    }

    // Create enrollment
    const enrollment = new BetaEnrollment({
      userId,
      email: email || req.user.email,
      name: name || req.user.name,
      features: features || ['all'],
      tier: tier || 'standard',
      deviceInfo: deviceInfo || {},
      consent: {
        dataCollection: consent?.dataCollection !== false,
        crashReporting: consent?.crashReporting !== false,
        analytics: consent?.analytics !== false,
        screenshots: consent?.screenshots || false,
      },
      status: 'active',
    });

    await enrollment.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in beta program',
      data: { enrollment },
    });
  } catch (error) {
    console.error('Beta enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in beta program',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get beta status
 * GET /api/beta/status
 */
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollment = await BetaEnrollment.findOne({ userId, status: 'active' });

    if (!enrollment) {
      return res.json({
        success: true,
        data: {
          isBetaTester: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isBetaTester: true,
        tier: enrollment.tier,
        enrolledAt: enrollment.createdAt,
        features: enrollment.features,
      },
    });
  } catch (error) {
    console.error('Get beta status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching beta status',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Submit feedback
 * POST /api/beta/feedback
 */
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      category,
      title,
      description,
      rating,
      screenshot,
      screenName,
      deviceInfo,
      appVersion,
      tags,
    } = req.body;

    // Validate required fields
    if (!type || !category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, category, title, description',
      });
    }

    // Validate type
    if (!['general', 'feature', 'bug', 'suggestion'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be one of: general, feature, bug, suggestion',
      });
    }

    // Create feedback
    const feedback = new BetaFeedback({
      userId,
      type,
      category,
      title,
      description,
      rating,
      screenshot,
      screenName,
      deviceInfo: deviceInfo || {},
      appVersion,
      tags: tags || [],
      status: 'new',
    });

    await feedback.save();

    // If it's a bug, also create a bug report
    if (type === 'bug') {
      const bug = new BetaBug({
        userId,
        title,
        description,
        severity: req.body.severity || 'medium',
        reproducibility: req.body.reproducibility || 'sometimes',
        stepsToReproduce: req.body.stepsToReproduce || [],
        expectedBehavior: req.body.expectedBehavior,
        actualBehavior: req.body.actualBehavior,
        screenshot,
        screenRecording: req.body.screenRecording,
        logs: req.body.logs || [],
        deviceInfo: deviceInfo || {},
        appVersion,
        osVersion: req.body.osVersion,
        status: 'new',
      });

      await bug.save();
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedback._id,
      },
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get user's feedback
 * GET /api/beta/feedback
 */
exports.getFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, status, fromDate, limit = 50, skip = 0 } = req.query;

    // Build query
    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (fromDate) {
      query.createdAt = { $gte: new Date(fromDate) };
    }

    // Get feedback
    const feedback = await BetaFeedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await BetaFeedback.countDocuments(query);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + feedback.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Record session analytics
 * POST /api/beta/session
 */
exports.recordSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      startTime,
      endTime,
      duration,
      screens,
      actions,
      errors,
      performance,
      featuresUsed,
      deviceInfo,
      appVersion,
    } = req.body;

    const session = new BetaSession({
      userId,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      duration: duration || 0,
      screens: screens || [],
      actions: actions || [],
      errors: errors || [],
      performance: performance || {
        loadTimes: {},
        crashes: 0,
        networkErrors: 0,
      },
      featuresUsed: featuresUsed || [],
      device: deviceInfo || {},
      appVersion,
    });

    await session.save();

    res.json({
      success: true,
      message: 'Session recorded successfully',
      data: {
        sessionId: session._id,
      },
    });
  } catch (error) {
    console.error('Record session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording session',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get beta analytics (admin only)
 * GET /api/beta/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalBetaUsers,
      activeUsers,
      totalSessions,
      feedbackStats,
      bugStats,
    ] = await Promise.all([
      BetaEnrollment.countDocuments(),
      BetaEnrollment.countDocuments({ status: 'active' }),
      BetaSession.countDocuments(),
      getFeedbackStats(),
      getBugStats(),
    ]);

    // Calculate average session duration
    const sessions = await BetaSession.find({ duration: { $gt: 0 } })
      .select('duration')
      .limit(1000)
      .lean();
    const avgSessionDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
        : 0;

    // Get feature usage
    const allSessions = await BetaSession.find({})
      .select('featuresUsed')
      .limit(1000)
      .lean();
    const featureUsage = {};
    allSessions.forEach((session) => {
      (session.featuresUsed || []).forEach((feature) => {
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });
    });

    res.json({
      success: true,
      data: {
        totalBetaUsers,
        activeUsers,
        totalSessions,
        averageSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // minutes
        feedbackStats,
        bugStats,
        featureUsage,
      },
    });
  } catch (error) {
    console.error('Get beta analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching beta analytics',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update feedback status (admin only)
 * PUT /api/beta/feedback/:id
 */
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignee, notes } = req.body;

    const feedback = await BetaFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    if (status) {
      feedback.status = status;
    }
    if (priority) {
      feedback.priority = priority;
    }
    if (assignee) {
      feedback.assignee = assignee;
    }
    if (notes !== undefined) {
      feedback.notes = notes;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated',
      data: { feedback },
    });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback status',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Helper: Get feedback statistics
 */
async function getFeedbackStats() {
  const total = await BetaFeedback.countDocuments();
  const byType = await BetaFeedback.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);
  const byStatus = await BetaFeedback.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const ratings = await BetaFeedback.find({ rating: { $exists: true } })
    .select('rating')
    .lean();
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, f) => sum + (f.rating || 0), 0) / ratings.length
      : 0;

  return {
    total,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    averageRating: parseFloat(avgRating.toFixed(2)),
    bugCount: await BetaBug.countDocuments(),
    featureRequestCount: await BetaFeedback.countDocuments({ type: 'feature' }),
  };
}

/**
 * Helper: Get bug statistics
 */
async function getBugStats() {
  const total = await BetaBug.countDocuments();
  const bySeverity = await BetaBug.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
      },
    },
  ]);
  const byStatus = await BetaBug.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    critical: (bySeverity.find((s) => s._id === 'critical')?.count || 0),
    high: (bySeverity.find((s) => s._id === 'high')?.count || 0),
  };
}

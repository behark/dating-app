const User = require('../../core/domain/User');
const { logger } = require('../../infrastructure/external/LoggingService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');

// @route   POST /api/activity/update-online-status
// @desc    Update user's online status
// @access  Private
exports.updateOnlineStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return sendValidationError(res, [
        {
          field: 'isOnline',
          message: 'isOnline must be a boolean',
          value: isOnline,
        },
      ]);
    }

    const updateData = {
      isOnline,
      lastActive: new Date(),
    };

    if (isOnline) {
      updateData.lastOnlineAt = new Date();
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
      'isOnline lastActive lastOnlineAt'
    );

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, 200, {
      message: 'Online status updated',
      data: {
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        lastOnlineAt: user.lastOnlineAt,
      },
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Update online status error:', errorMessage);
    return sendError(res, 500, {
      message: 'Error updating online status',
      error: 'INTERNAL_ERROR',
      details: { detail: errorMessage },
    });
  }
};

// @route   GET /api/activity/online-status/:userId
// @desc    Get user's online status
// @access  Public
exports.getOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // TD-004: Added .lean() for read-only query optimization
    const user = await User.findById(userId).select('isOnline lastActive lastOnlineAt').lean();

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Determine activity status
    let activityStatus = 'offline';
    if (user.isOnline) {
      activityStatus = 'online';
    } else if (user.lastActive) {
      const lastActiveDate =
        user.lastActive instanceof Date ? user.lastActive : new Date(user.lastActive);
      const minutesAgo = Math.floor(
        (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 60)
      );
      if (minutesAgo < 5) {
        activityStatus = 'active_now';
      } else if (minutesAgo < 60) {
        activityStatus = `active_${minutesAgo}m_ago`;
      } else {
        activityStatus = `active_${Math.floor(minutesAgo / 60)}h_ago`;
      }
    }

    return sendSuccess(res, 200, {
      data: {
        isOnline: user.isOnline,
        activityStatus,
        lastActive: user.lastActive,
        lastOnlineAt: user.lastOnlineAt,
      },
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Get online status error:', errorMessage);
    return sendError(res, 500, {
      message: 'Error fetching online status',
      error: 'INTERNAL_ERROR',
      details: { detail: errorMessage },
    });
  }
};

// @route   POST /api/activity/view-profile/:userId
// @desc    Record a profile view
// @access  Private
exports.viewProfile = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { userId } = req.params;

    if (viewerId.toString() === userId) {
      return sendError(res, 400, { message: 'Cannot view your own profile' });
    }

    // Check if already viewed in last 24 hours
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const profileViews = (user.profileViewedBy || []).filter((view) => view && view.userId);
    user.profileViewedBy = profileViews;

    const existingView = profileViews.find(
      (view) => view.userId.toString() === viewerId.toString()
    );

    if (existingView) {
      const viewedAtDate =
        existingView.viewedAt instanceof Date
          ? existingView.viewedAt
          : new Date(existingView.viewedAt);
      const hoursSince = (new Date().getTime() - viewedAtDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        // Update timestamp of existing view
        existingView.viewedAt = new Date();
      } else {
        // Add as new view
        user.profileViewedBy.push({ userId: viewerId, viewedAt: new Date() });
        user.profileViewCount = user.profileViewedBy.length;
      }
    } else {
      // Add new view
      user.profileViewedBy.push({ userId: viewerId, viewedAt: new Date() });
      user.profileViewCount = user.profileViewedBy.length;
    }

    await user.save();

    return sendSuccess(res, 200, {
      message: 'Profile view recorded',
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('View profile error:', errorMessage);
    return sendError(res, 500, {
      message: 'Error recording profile view',
      error: 'INTERNAL_ERROR',
      details: { detail: errorMessage },
    });
  }
};

// @route   GET /api/activity/profile-views
// @desc    Get profile view count and who viewed profile (premium)
// @access  Private
exports.getProfileViews = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('profileViewCount profileViewedBy isPremium')
      .populate('profileViewedBy.userId', 'name photos.url');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // If not premium, only return count
    if (!user.isPremium) {
      return sendSuccess(res, 200, {
        data: {
          profileViewCount: user.profileViewCount,
          message: 'Upgrade to Premium to see who viewed your profile',
        },
      });
    }

    // Return views with user details (premium only)
    const viewers = (user.profileViewedBy || [])
      .filter((view) => view && view.userId)
      .sort((a, b) => {
        const dateA = a.viewedAt instanceof Date ? a.viewedAt : new Date(a.viewedAt);
        const dateB = b.viewedAt instanceof Date ? b.viewedAt : new Date(b.viewedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50)
      .map((view) => {
        /** @type {any} */
        const userDoc = view.userId;
        return {
          userId: userDoc._id,
          name: userDoc.name,
          photoUrl: Array.isArray(userDoc.photos) ? userDoc.photos[0]?.url : undefined,
          viewedAt: view.viewedAt,
        };
      })
      .filter(Boolean);

    return sendSuccess(res, 200, {
      data: {
        profileViewCount: user.profileViewCount,
        viewers,
      },
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Get profile views error:', errorMessage);
    return sendError(res, 500, {
      message: 'Error fetching profile views',
      error: 'INTERNAL_ERROR',
      details: { detail: errorMessage },
    });
  }
};

// @route   GET /api/activity/status
// @desc    Get activity status for multiple users
// @access  Private - SECURITY: Only returns status for matched users
exports.getMultipleStatus = async (req, res) => {
  try {
    const { userIds } = req.body;
    const requestingUserId = req.user._id;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return sendError(res, 400, { message: 'userIds must be a non-empty array' });
    }

    // SECURITY: Only return status for users who are matched with the requesting user
    const Match = require('../../core/domain/Match');

    const matches = await Match.find({
      users: requestingUserId,
      status: 'active',
    }).select('users');

    // Get the IDs of users this person is matched with
    const matchedUserIds = new Set();
    matches.forEach((match) => {
      match.users.forEach((userId) => {
        if (userId.toString() !== requestingUserId.toString()) {
          matchedUserIds.add(userId.toString());
        }
      });
    });

    // Filter requested userIds to only include matched users
    const allowedUserIds = userIds.filter((id) => matchedUserIds.has(id.toString()));

    if (allowedUserIds.length === 0) {
      return res.json({
        success: true,
        data: {
          statusMap: {},
        },
      });
    }

    const users = await User.find({ _id: { $in: allowedUserIds } }).select('isOnline lastActive');

    const statusMap = {};
    users.forEach((user) => {
      let activityStatus = 'offline';
      if (user.isOnline) {
        activityStatus = 'online';
      } else if (user.lastActive) {
        const lastActiveDate = new Date(user.lastActive);
        const minutesAgo = Math.floor(
          (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 60)
        );
        if (minutesAgo < 5) {
          activityStatus = 'active_now';
        }
      }
      statusMap[user._id.toString()] = activityStatus;
    });

    res.json({
      success: true,
      data: {
        statusMap,
      },
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Get multiple status error:', errorMessage);
    sendError(res, 500, { message: 'Error fetching status', error: errorMessage });
  }
};

// @route   POST /api/activity/heartbeat
// @desc    Update last active timestamp (keep alive)
// @access  Private
exports.heartbeat = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { lastActive: new Date() });

    res.json({
      success: true,
      message: 'Heartbeat recorded',
    });
  } catch (/** @type {any} */ error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Heartbeat error:', errorMessage);
    sendError(res, 500, { message: 'Error recording heartbeat', error: errorMessage });
  }
};

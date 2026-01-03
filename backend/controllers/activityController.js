const User = require('../models/User');

// @route   POST /api/activity/update-online-status
// @desc    Update user's online status
// @access  Private
exports.updateOnlineStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnline must be a boolean'
      });
    }

    const updateData = {
      isOnline,
      lastActive: new Date()
    };

    if (isOnline) {
      updateData.lastOnlineAt = new Date();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('isOnline lastActive lastOnlineAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Online status updated',
      data: {
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        lastOnlineAt: user.lastOnlineAt
      }
    });
  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating online status',
      error: error.message
    });
  }
};

// @route   GET /api/activity/online-status/:userId
// @desc    Get user's online status
// @access  Public
exports.getOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      'isOnline lastActive lastOnlineAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine activity status
    let activityStatus = 'offline';
    if (user.isOnline) {
      activityStatus = 'online';
    } else if (user.lastActive) {
      const minutesAgo = Math.floor(
        (new Date() - user.lastActive) / (1000 * 60)
      );
      if (minutesAgo < 5) {
        activityStatus = 'active_now';
      } else if (minutesAgo < 60) {
        activityStatus = `active_${minutesAgo}m_ago`;
      } else {
        activityStatus = `active_${Math.floor(minutesAgo / 60)}h_ago`;
      }
    }

    res.json({
      success: true,
      data: {
        isOnline: user.isOnline,
        activityStatus,
        lastActive: user.lastActive,
        lastOnlineAt: user.lastOnlineAt
      }
    });
  } catch (error) {
    console.error('Get online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online status',
      error: error.message
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
      return res.status(400).json({
        success: false,
        message: 'Cannot view your own profile'
      });
    }

    // Check if already viewed in last 24 hours
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingView = user.profileViewedBy.find(
      view => view.userId.toString() === viewerId.toString()
    );

    if (existingView) {
      const hoursSince = (new Date() - existingView.viewedAt) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        // Update timestamp of existing view
        existingView.viewedAt = new Date();
      } else {
        // Add as new view
        user.profileViewedBy.push({ userId: viewerId });
        user.profileViewCount = user.profileViewedBy.length;
      }
    } else {
      // Add new view
      user.profileViewedBy.push({ userId: viewerId });
      user.profileViewCount = user.profileViewedBy.length;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile view recorded'
    });
  } catch (error) {
    console.error('View profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording profile view',
      error: error.message
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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If not premium, only return count
    if (!user.isPremium) {
      return res.json({
        success: true,
        data: {
          profileViewCount: user.profileViewCount,
          message: 'Upgrade to Premium to see who viewed your profile'
        }
      });
    }

    // Return views with user details (premium only)
    const viewers = user.profileViewedBy
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 50) // Last 50 views
      .map(view => ({
        userId: view.userId._id,
        name: view.userId.name,
        photo: view.userId.photos?.[0]?.url,
        viewedAt: view.viewedAt
      }));

    res.json({
      success: true,
      data: {
        profileViewCount: user.profileViewCount,
        viewers
      }
    });
  } catch (error) {
    console.error('Get profile views error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile views',
      error: error.message
    });
  }
};

// @route   GET /api/activity/status
// @desc    Get activity status for multiple users
// @access  Public
exports.getMultipleStatus = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array'
      });
    }

    const users = await User.find({ _id: { $in: userIds } }).select(
      'isOnline lastActive'
    );

    const statusMap = {};
    users.forEach(user => {
      let activityStatus = 'offline';
      if (user.isOnline) {
        activityStatus = 'online';
      } else if (user.lastActive) {
        const minutesAgo = Math.floor(
          (new Date() - user.lastActive) / (1000 * 60)
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
        statusMap
      }
    });
  } catch (error) {
    console.error('Get multiple status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching status',
      error: error.message
    });
  }
};

// @route   POST /api/activity/heartbeat
// @desc    Update last active timestamp (keep alive)
// @access  Private
exports.heartbeat = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
      userId,
      { lastActive: new Date() }
    );

    res.json({
      success: true,
      message: 'Heartbeat recorded'
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording heartbeat',
      error: error.message
    });
  }
};

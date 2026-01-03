const User = require('../models/User');
const Report = require('../models/Report');
const Block = require('../models/Block');

// Report a user for abuse
exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, category, description, evidence } = req.body;
    const reporterId = req.user.id;

    // Validate input
    if (!reportedUserId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reportedUserId, category, description',
      });
    }

    if (reporterId === reportedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report yourself',
      });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create report
    const report = new Report({
      reporterId,
      reportedUserId,
      category,
      description,
      evidence: evidence || [],
      status: 'pending',
    });

    await report.save();

    // Increment report count
    await User.findByIdAndUpdate(reportedUserId, {
      $inc: { reportCount: 1 },
    });

    // Check if user should be auto-suspended (3+ reports)
    const updatedUser = await User.findById(reportedUserId);
    if (updatedUser.reportCount >= 3 && !updatedUser.suspended) {
      await User.findByIdAndUpdate(reportedUserId, {
        suspended: true,
        suspendedAt: new Date(),
        suspendReason: 'Multiple user reports',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report._id,
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message,
    });
  }
};

// Get reports (admin)
exports.getReports = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.reportedUserId = userId;

    const reports = await Report.find(filter)
      .populate('reporterId', 'username email')
      .populate('reportedUserId', 'username email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reports',
      error: error.message,
    });
  }
};

// Review report (admin)
exports.reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action, actionReason } = req.body;

    if (!['reviewed', 'dismissed', 'action_taken'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: reviewed, dismissed, or action_taken',
      });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        reviewedAt: new Date(),
        adminNotes: actionReason,
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Take action if specified
    if (action === 'suspend') {
      await User.findByIdAndUpdate(report.reportedUserId, {
        suspended: true,
        suspendedAt: new Date(),
        suspendReason: actionReason || 'Violation of community guidelines',
      });
    } else if (action === 'warn') {
      // Send warning to user
      // Implementation depends on notification system
    }

    res.json({
      success: true,
      message: 'Report reviewed successfully',
      report,
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing report',
      error: error.message,
    });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;
    const userId = req.user.id;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: 'blockedUserId is required',
      });
    }

    if (userId === blockedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself',
      });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: blockedUserId },
    });

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: error.message,
    });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.params;
    const userId = req.user.id;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: 'blockedUserId is required',
      });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: blockedUserId },
    });

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: error.message,
    });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('blockedUsers', 'username profilePhoto');

    res.json({
      success: true,
      blockedUsers: user.blockedUsers || [],
      count: user.blockedUsers?.length || 0,
    });
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving blocked users',
      error: error.message,
    });
  }
};

// Check if user is blocked
exports.checkIfBlocked = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const isBlocked = user.blockedUsers?.includes(otherUserId);

    const otherUser = await User.findById(otherUserId);
    const blockedByOther = otherUser?.blockedUsers?.includes(userId);

    res.json({
      success: true,
      userHasBlocked: isBlocked,
      blockedByOther: blockedByOther,
      canInteract: !isBlocked && !blockedByOther,
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking block status',
      error: error.message,
    });
  }
};

// Flag content (photo, message, etc.)
exports.flagContent = async (req, res) => {
  try {
    const { contentType, contentId, reason, description } = req.body;
    const userId = req.user.id;

    if (!contentType || !contentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: contentType, contentId, reason',
      });
    }

    // Valid content types: 'message', 'profile_photo', 'bio', 'profile'
    const validTypes = ['message', 'profile_photo', 'bio', 'profile'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid contentType. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Create flag record (would use a Flag model in production)
    const flag = {
      userId,
      contentType,
      contentId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    // Save flag to database
    // const flagRecord = await Flag.create(flag);

    res.status(201).json({
      success: true,
      message: 'Content flagged successfully',
      flag,
    });
  } catch (error) {
    console.error('Error flagging content:', error);
    res.status(500).json({
      success: false,
      message: 'Error flagging content',
      error: error.message,
    });
  }
};

// Get safety score (admin)
exports.getSafetyScore = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let score = 100;

    // Deduct points for various risk factors
    if (user.suspended) score -= 100;
    if (user.reportCount > 0) score -= Math.min(10 * user.reportCount, 50);
    if (!user.emailVerified) score -= 10;
    if (!user.phoneVerified) score -= 5;
    if (user.blockedCount > 0) score -= Math.min(5 * user.blockedCount, 20);

    const finalScore = Math.max(0, Math.min(100, score));

    res.json({
      success: true,
      userId,
      safetyScore: finalScore,
      riskFactors: {
        suspended: user.suspended,
        reportCount: user.reportCount || 0,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        blockedCount: user.blockedCount || 0,
      },
    });
  } catch (error) {
    console.error('Error calculating safety score:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating safety score',
      error: error.message,
    });
  }
};

// Get safety tips
exports.getSafetyTips = async (req, res) => {
  try {
    const tips = [
      {
        id: 1,
        title: 'Protect Your Personal Information',
        category: 'privacy',
        tips: [
          "Don't share your home address or phone number in your profile",
          'Avoid mentioning your workplace or routine schedule',
          'Never send money or financial information to someone you just met',
          'Be cautious about location-based personal details',
        ],
      },
      {
        id: 2,
        title: 'Verify Before Meeting',
        category: 'verification',
        tips: [
          'Video call before meeting in person for the first time',
          'Ask for and verify photo authenticity',
          'Check their social media profiles if available',
          'Ask clarifying questions about their background',
        ],
      },
      {
        id: 3,
        title: 'Safe First Meeting',
        category: 'meeting',
        tips: [
          'Always meet in a public place with good lighting',
          'Tell a friend where you are and who you are meeting',
          'Have an exit plan and means of transportation',
          'Keep your phone charged and accessible',
        ],
      },
      {
        id: 4,
        title: 'Online Interaction Safety',
        category: 'online',
        tips: [
          'Use the app for messaging - avoid giving phone numbers quickly',
          'Report suspicious behavior immediately',
          'Block users who make you uncomfortable',
          'Never share intimate photos with unverified users',
          'Be aware of romance scams and catfishing',
        ],
      },
      {
        id: 5,
        title: 'Red Flags to Watch For',
        category: 'warning',
        tips: [
          'Inconsistent stories or photos that look altered',
          'Pressure to move conversations off the app quickly',
          'Requests for money, gifts, or financial help',
          'Love bombing or moving too fast emotionally',
          'Resistance to video calls or meeting in person',
        ],
      },
      {
        id: 6,
        title: 'If Something Goes Wrong',
        category: 'emergency',
        tips: [
          'Report the user immediately through the app',
          'Block the user to prevent further contact',
          'Save evidence of inappropriate behavior',
          'Contact local authorities if threatened',
          'Reach out to trusted friends or family',
        ],
      },
    ];

    res.json({
      success: true,
      count: tips.length,
      data: tips,
    });
  } catch (error) {
    console.error('Error getting safety tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving safety tips',
      error: error.message,
    });
  }
};

// Suspend user (admin)
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspended: true,
        suspendedAt: new Date(),
        suspendReason: reason,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User suspended successfully',
      user,
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending user',
      error: error.message,
    });
  }
};

// Unsuspend user (admin)
exports.unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspended: false,
        suspendedAt: null,
        suspendReason: null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      user,
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsuspending user',
      error: error.message,
    });
  }
};

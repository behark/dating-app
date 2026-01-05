const { sendSuccess, sendError, sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendRateLimit, asyncHandler } = require("../utils/responseHelpers");
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

    // Check for existing pending report from the same reporter
    // This prevents spam-reporting and gaming the auto-suspension system
    const existingReport = await Report.findOne({
      reporterId,
      reportedUserId,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a report for this user that is pending review',
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

    // Count unique reporters (not total reports) to prevent abuse
    // This prevents one person from spam-reporting to get someone banned
    const uniqueReporterCount = await Report.distinct('reporterId', {
      reportedUserId,
      status: { $in: ['pending', 'reviewing'] }, // Only count unresolved reports
    }).then((reporters) => reporters.length);

    // Update report count with unique reporter count
    await User.findByIdAndUpdate(reportedUserId, {
      reportCount: uniqueReporterCount,
    });

    // Auto-suspend threshold: 5+ unique reporters with pending reports
    // This is more conservative to prevent false positives
    const AUTO_SUSPEND_THRESHOLD = 5;
    const updatedUser = await User.findById(reportedUserId);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'UpdatedUser not found',
      });
    }
    
    if (uniqueReporterCount >= AUTO_SUSPEND_THRESHOLD && !updatedUser.suspended) {
      await User.findByIdAndUpdate(reportedUserId, {
        suspended: true,
        suspendedAt: new Date(),
        suspendReason: `Auto-suspended: ${uniqueReporterCount} unique user reports pending review`,
        // Flag for priority review - user should be notified
        suspensionType: 'auto',
        needsReview: true,
      });
      
      // Log for admin review - these auto-suspensions should be reviewed quickly
      console.warn(`[SAFETY] Auto-suspended user ${reportedUserId} - ${uniqueReporterCount} unique reporters. Needs manual review.`);
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('blockedUsers', 'username profilePhoto');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

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
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Check if user is blocked
exports.checkIfBlocked = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Check current user's account status
 * This allows users to know if their account has been flagged or suspended
 * preventing "shadow-locking" where users don't know they've been restricted
 */
exports.getAccountStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'suspended suspendedAt suspendReason suspensionType reportCount isActive needsReview'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Determine visibility status
    let visibilityStatus = 'visible';
    let visibilityMessage = 'Your profile is visible to other users';

    if (user.suspended) {
      visibilityStatus = 'suspended';
      visibilityMessage = user.suspensionType === 'auto'
        ? 'Your account has been temporarily restricted due to user reports. Our team will review this shortly. If you believe this is a mistake, please contact support.'
        : 'Your account has been suspended. Please contact support for more information.';
    } else if (!user.isActive) {
      visibilityStatus = 'inactive';
      visibilityMessage = 'Your profile is currently hidden because your account is inactive';
    } else if (user.reportCount > 0) {
      visibilityStatus = 'under_review';
      visibilityMessage = `Your profile is visible, but you have ${user.reportCount} pending report(s) that are being reviewed`;
    }

    res.json({
      success: true,
      data: {
        visibilityStatus,
        visibilityMessage,
        suspended: user.suspended || false,
        suspendedAt: user.suspendedAt,
        suspensionType: user.suspensionType,
        reportCount: user.reportCount || 0,
        isActive: user.isActive,
        // Don't expose the full suspend reason for security, just a status
        canAppeal: user.suspended && user.suspensionType === 'auto',
      },
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking account status',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Appeal a suspension (for auto-suspended users)
 */
exports.appealSuspension = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason || reason.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed explanation (at least 20 characters)',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.suspended) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not suspended',
      });
    }

    if (user.suspensionType !== 'auto') {
      return res.status(400).json({
        success: false,
        message: 'Manual suspensions cannot be appealed through this system. Please contact support.',
      });
    }

    // Mark for priority review
    await User.findByIdAndUpdate(userId, {
      needsReview: true,
      appealReason: reason,
      appealedAt: new Date(),
    });

    // Log for admin review
    console.log(`[SAFETY] Suspension appeal submitted by user ${userId}: ${reason.substring(0, 100)}...`);

    res.json({
      success: true,
      message: 'Your appeal has been submitted. Our team will review it within 24-48 hours.',
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting appeal',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
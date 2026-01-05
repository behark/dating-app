const { sendSuccess, sendError, sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendRateLimit, asyncHandler } = require("../utils/responseHelpers");
const User = require('../models/User');

const TopPicks = require('../models/TopPicks');

const UserActivity = require('../models/UserActivity');

const Swipe = require('../models/Swipe');

const BoostProfile = require('../models/BoostProfile');

const { calculateDistance, stripPreciseLocation, getDistanceCategory } = require('../utils/geoUtils');

/**
 * Explore/Browse mode - flexible discovery with filters
 */
const exploreUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      lat,
      lng,
      radius = 50000, // in meters
      minAge = 18,
      maxAge = 100,
      gender = 'any',
      sortBy = 'recentActivity', // recentActivity, profileQuality, verified, boosted
      limit = 20,
      skip = 0,
    } = req.query;

    // Validate coordinates if provided
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude',
        });
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid longitude',
        });
      }
    }

    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get IDs of users already swiped on
    const swipedUserIds = await Swipe.getSwipedUserIds(userId);
    swipedUserIds.push(userId); // Exclude self

    // Build query
    const query = {
      _id: { $nin: swipedUserIds },
      isActive: true,
      // Exclude suspended users - prevents shadow-locking from hiding profiles
      suspended: { $ne: true },
      age: { $gte: minAge, $lte: maxAge },
    };

    if (gender !== 'any') {
      query.gender = gender;
    }

    // Location filter
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    // Build sort
    let sortQuery = {};

    switch (sortBy) {
      case 'recentActivity':
        sortQuery = { lastActivityAt: -1, profileCompleteness: -1 };
        break;
      case 'profileQuality':
        sortQuery = { profileCompleteness: -1, lastActivityAt: -1 };
        break;
      case 'verified':
        query.isProfileVerified = true;
        sortQuery = { lastActivityAt: -1 };
        break;
      case 'boosted':
        // This would be handled in post-processing
        sortQuery = { lastActivityAt: -1 };
        break;
      default:
        sortQuery = { lastActivityAt: -1 };
    }

    // Execute query
    const results = await User.find(query)
      .select(
        'name age gender bio photos interests location locationPrivacy profileCompleteness lastActivityAt isProfileVerified activityScore'
      )
      .sort(sortQuery)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    // Enhance results with additional data and SANITIZE LOCATION
    const enhancedResults = await Promise.all(
      results.map(async (user) => {
        // Check for active boost
        const activeBoost = await BoostProfile.findOne({
          userId: user._id,
          isActive: true,
          endsAt: { $gt: new Date() },
        }).select('visibilityMultiplier endsAt');

        // Calculate distance if coordinates provided (for internal use only)
        let distance = null;
        let distanceCategory = null;
        if (lat && lng && user.location?.coordinates) {
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lng);
          distance = calculateDistance(
            latitude,
            longitude,
            user.location.coordinates[1],
            user.location.coordinates[0]
          );
          distanceCategory = getDistanceCategory(distance);
        }

        // PRIVACY: Strip precise location data before returning
        // Only include: city, distance (rounded), NEVER coordinates
        const sanitizedUser = stripPreciseLocation(user, {
          viewerLat: lat ? parseFloat(lat) : null,
          viewerLng: lng ? parseFloat(lng) : null,
          includeDistance: true,
          includeCity: true,
        });

        return {
          ...sanitizedUser,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          distanceCategory,
          isBoosted: !!activeBoost,
          boostEndsAt: activeBoost?.endsAt,
          visibilityMultiplier: activeBoost?.visibilityMultiplier || 1,
        };
      })
    );

    // Sort by boosted if requested
    if (sortBy === 'boosted') {
      enhancedResults.sort((a, b) => {
        if (a.isBoosted === b.isBoosted) {
          return b.lastActivityAt - a.lastActivityAt;
        }
        return a.isBoosted ? -1 : 1;
      });
    }

    // Log activity
    await UserActivity.logActivity(userId, 'profile_view', {
      action: 'explore',
      filters: { minAge, maxAge, gender, sortBy },
    });

    return res.status(200).json({
      success: true,
      data: {
        users: enhancedResults,
        count: enhancedResults.length,
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error exploring users:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

/**
 * Get top picks for the user
 */
const getTopPicks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Check if top picks exist and are recent (within last 24 hours)
    const existingPicksCount = await TopPicks.countDocuments({
      forUserId: userId,
      isActive: true,
      calculatedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // If no recent picks, would trigger algorithm (in production)
    // For now, return what we have
    if (existingPicksCount === 0) {
      // In production, this would call a background job to calculate top picks
      console.log(`No recent top picks for user ${userId}, triggering calculation`);
    }

    // Get top picks
    const topPicks = await TopPicks.getTopPicksForUser(userId, parseInt(limit));

    // Mark as seen
    await Promise.all(
      topPicks.map((pick) =>
        TopPicks.updateOne({ _id: pick._id }, { isSeen: true, seenAt: new Date() })
      )
    );

    // Log activity
    await UserActivity.logActivity(userId, 'profile_view', {
      action: 'view_top_picks',
      count: topPicks.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        topPicks,
        count: topPicks.length,
        calculationTime: topPicks[0]?.calculatedAt || null,
      },
    });
  } catch (error) {
    console.error('Error getting top picks:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

/**
 * Get recently active users
 */
const getRecentlyActiveUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hoursBack = 24, limit = 20 } = req.query;

    // Get swiped users to exclude
    const swipedUserIds = await Swipe.getSwipedUserIds(userId);
    swipedUserIds.push(userId);

    // Get recently active users
    const recentlyActive = await UserActivity.getRecentlyActiveUsers(
      parseInt(hoursBack),
      parseInt(limit)
    );

    // Filter out already swiped users
    const filteredUsers = recentlyActive.filter(
      (activity) => !swipedUserIds.includes(activity._id.toString())
    );

    // Log activity
    await UserActivity.logActivity(userId, 'profile_view', {
      action: 'view_recently_active',
      count: filteredUsers.length,
      hoursBack: parseInt(hoursBack),
    });

    return res.status(200).json({
      success: true,
      data: {
        users: filteredUsers,
        count: filteredUsers.length,
        hoursBack: parseInt(hoursBack),
      },
    });
  } catch (error) {
    console.error('Error getting recently active users:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

/**
 * Get verified profiles
 */
const getVerifiedProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      minAge = 18,
      maxAge = 100,
      gender = 'any',
      limit = 20,
      skip = 0,
      lat,
      lng,
      radius = 50000,
    } = req.query;

    // Get swiped users to exclude
    const swipedUserIds = await Swipe.getSwipedUserIds(userId);
    swipedUserIds.push(userId);

    // Build query for verified users
    const query = {
      _id: { $nin: swipedUserIds },
      isActive: true,
      // Exclude suspended users - prevents shadow-locking
      suspended: { $ne: true },
      isProfileVerified: true,
      age: { $gte: minAge, $lte: maxAge },
    };

    if (gender !== 'any') {
      query.gender = gender;
    }

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    // Get verified profiles
    const verifiedProfiles = await User.find(query)
      .select(
        'name age gender bio photos interests location profileCompleteness lastActivityAt isProfileVerified verificationDate activityScore'
      )
      .sort({ lastActivityAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    // Enhance with boost info
    const enhancedProfiles = await Promise.all(
      verifiedProfiles.map(async (user) => {
        const activeBoost = await BoostProfile.findOne({
          userId: user._id,
          isActive: true,
          endsAt: { $gt: new Date() },
        }).select('visibilityMultiplier endsAt');

        return {
          ...user,
          isBoosted: !!activeBoost,
          boostEndsAt: activeBoost?.endsAt,
        };
      })
    );

    // Log activity
    await UserActivity.logActivity(userId, 'profile_view', {
      action: 'view_verified_profiles',
      count: verifiedProfiles.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        profiles: enhancedProfiles,
        count: verifiedProfiles.length,
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error getting verified profiles:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

/**
 * Verify user's profile (admin or user action)
 */
const verifyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { verificationMethod = 'photo' } = req.body;

    if (!['photo', 'video', 'id'].includes(verificationMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification method',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update verification status
    user.verificationStatus = 'pending';
    user.verificationMethod = verificationMethod;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Verification request submitted',
      data: {
        verificationStatus: 'pending',
        verificationMethod,
      },
    });
  } catch (error) {
    console.error('Error verifying profile:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

/**
 * Admin endpoint to approve profile verification
 */
const approveProfileVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isProfileVerified = true;
    user.verificationStatus = 'verified';
    user.verificationDate = new Date();
    await user.save();

    // Log activity
    await UserActivity.logActivity(userId, 'profile_update', {
      action: 'profile_verified',
    });

    return res.status(200).json({
      success: true,
      message: 'Profile verified successfully',
      data: {
        isProfileVerified: true,
        verificationStatus: 'verified',
        verificationDate: user.verificationDate,
      },
    });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({
      success: false,
      message: (error instanceof Error ? error.message : String(error)),
    });
  }
};

// Note: calculateDistance is now imported from ../utils/geoUtils

module.exports = {
  exploreUsers,
  getTopPicks,
  getRecentlyActiveUsers,
  getVerifiedProfiles,
  verifyProfile,
  approveProfileVerification,
};

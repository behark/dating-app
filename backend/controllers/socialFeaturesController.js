const SocialFeaturesService = require('../services/SocialFeaturesService');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');

class SocialFeaturesController {
  /**
   * Create a group date
   */
  static async createGroupDate(req, res) {
    try {
      const groupDate = await SocialFeaturesService.createGroupDate(req.body);

      res.status(201).json({
        success: true,
        groupDate,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create group date',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Join a group date
   */
  static async joinGroupDate(req, res) {
    try {
      const { groupDateId } = req.params;
      const { userId } = req.body;

      const groupDate = await SocialFeaturesService.joinGroupDate(groupDateId, userId);

      res.json({
        success: true,
        groupDate,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to join group date',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Leave a group date
   */
  static async leaveGroupDate(req, res) {
    try {
      const { groupDateId } = req.params;
      const { userId } = req.body;

      const groupDate = await SocialFeaturesService.leaveGroupDate(groupDateId, userId);

      res.json({
        success: true,
        groupDate,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to leave group date',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get nearby group dates
   */
  static async getNearbyGroupDates(req, res) {
    try {
      const { longitude, latitude, maxDistance = 5000 } = req.query;

      if (!longitude || !latitude) {
        return res.status(400).json({
          error: 'Longitude and latitude are required',
        });
      }

      const groupDates = await SocialFeaturesService.getNearbyGroupDates(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(maxDistance)
      );

      res.json({
        groupDates,
        count: groupDates.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get nearby group dates',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create a friend review
   */
  static async createFriendReview(req, res) {
    try {
      const review = await SocialFeaturesService.createFriendReview(req.body);

      res.status(201).json({
        success: true,
        review,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create review',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get user reviews
   */
  static async getUserReviews(req, res) {
    try {
      const { userId } = req.params;

      const reviews = await SocialFeaturesService.getUserReviews(userId);
      const stats = await SocialFeaturesService.getUserReviewStats(userId);

      res.json({
        reviews,
        stats,
        count: reviews.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get reviews',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create an event
   */
  static async createEvent(req, res) {
    try {
      const event = await SocialFeaturesService.createEvent(req.body);

      res.status(201).json({
        success: true,
        event,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create event',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Register for an event
   */
  static registerForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const result = await SocialFeaturesService.registerForEvent(eventId, userId.toString(), {
      emitSocketEvent: true,
    });

    return sendSuccess(res, 200, {
      message: 'Successfully registered for event',
      data: result,
    });
  });

  /**
   * Leave an event
   */
  static leaveEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const result = await SocialFeaturesService.leaveEvent(eventId, userId.toString(), {
      emitSocketEvent: true,
    });

    return sendSuccess(res, 200, {
      message: 'Successfully left event',
      data: result,
    });
  });

  /**
   * Get nearby events
   */
  static getNearbyEvents = asyncHandler(async (req, res) => {
    const { longitude, latitude, maxDistance = 10000, category, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id || req.user?._id;

    // Validate required parameters
    if (!longitude || !latitude) {
      return sendValidationError(res, [
        { field: 'longitude', message: 'Longitude is required' },
        { field: 'latitude', message: 'Latitude is required' },
      ]);
    }

    // Validate parameter types
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDist = parseInt(maxDistance);

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return sendValidationError(res, [
        { field: 'longitude', message: 'Longitude must be between -180 and 180' },
      ]);
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return sendValidationError(res, [
        { field: 'latitude', message: 'Latitude must be between -90 and 90' },
      ]);
    }

    if (isNaN(maxDist) || maxDist <= 0 || maxDist > 50000) {
      return sendValidationError(res, [
        { field: 'maxDistance', message: 'Max distance must be between 1 and 50000 meters' },
      ]);
    }

    // Use user's location if available, otherwise use query params
    let searchLng = lng;
    let searchLat = lat;

    if (userId && req.user?.location?.coordinates) {
      // Use authenticated user's location if available
      searchLng = req.user.location.coordinates[0];
      searchLat = req.user.location.coordinates[1];
    }

    const result = await SocialFeaturesService.getNearbyEvents(
      searchLng,
      searchLat,
      maxDist,
      category || null,
      userId ? userId.toString() : null,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return sendSuccess(res, 200, {
      message: 'Nearby events retrieved successfully',
      data: result.events,
      pagination: result.pagination,
    });
  });

  /**
   * Create a shareable profile link
   */
  static async createShareableProfileLink(req, res) {
    try {
      const { userId } = req.params;
      const { shareMethod = 'link', customMessage = '' } = req.body;

      const shareLink = await SocialFeaturesService.createShareableProfileLink(
        userId,
        shareMethod,
        customMessage
      );

      res.json({
        success: true,
        ...shareLink,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create share link',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Share profile with someone
   */
  static async shareProfileWith(req, res) {
    try {
      const { userId } = req.params;
      const { sharedByUserId, method = 'link' } = req.body;

      const shared = await SocialFeaturesService.shareProfileWith(userId, sharedByUserId, method);

      res.status(201).json({
        success: true,
        shared,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to share profile',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get shared profile by token
   */
  static async getSharedProfile(req, res) {
    try {
      const { shareToken } = req.params;

      const profileData = await SocialFeaturesService.getSharedProfile(shareToken);

      res.json(profileData);
    } catch (error) {
      res.status(404).json({
        error: 'Shared profile not found',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get all shared profile links for a user
   */
  static async getUserSharedProfiles(req, res) {
    try {
      const { userId } = req.params;

      const sharedProfiles = await SocialFeaturesService.getUserSharedProfiles(userId);

      res.json({
        sharedProfiles,
        count: sharedProfiles.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get shared profiles',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Deactivate a share link
   */
  static async deactivateShareLink(req, res) {
    try {
      const { shareToken } = req.params;

      const result = await SocialFeaturesService.deactivateShareLink(shareToken);

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to deactivate share link',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

module.exports = SocialFeaturesController;

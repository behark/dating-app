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
  static createGroupDate = asyncHandler(async (req, res) => {
    const groupDate = await SocialFeaturesService.createGroupDate(req.body);

    return sendSuccess(res, 201, {
      message: 'Group date created successfully',
      data: { groupDate },
    });
  });

  /**
   * Join a group date
   */
  static joinGroupDate = asyncHandler(async (req, res) => {
    const { groupDateId } = req.params;
    const { userId } = req.body;

    const groupDate = await SocialFeaturesService.joinGroupDate(groupDateId, userId);

    return sendSuccess(res, 200, {
      message: 'Successfully joined group date',
      data: { groupDate },
    });
  });

  /**
   * Leave a group date
   */
  static leaveGroupDate = asyncHandler(async (req, res) => {
    const { groupDateId } = req.params;
    const { userId } = req.body;

    const groupDate = await SocialFeaturesService.leaveGroupDate(groupDateId, userId);

    return sendSuccess(res, 200, {
      message: 'Successfully left group date',
      data: { groupDate },
    });
  });

  /**
   * Get nearby group dates
   */
  static getNearbyGroupDates = asyncHandler(async (req, res) => {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return sendValidationError(res, [
        { field: 'longitude', message: 'Longitude is required' },
        { field: 'latitude', message: 'Latitude is required' },
      ]);
    }

    const groupDates = await SocialFeaturesService.getNearbyGroupDates(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    return sendSuccess(res, 200, {
      message: 'Nearby group dates retrieved successfully',
      data: { groupDates, count: groupDates.length },
    });
  });

  /**
   * Create a friend review
   */
  static createFriendReview = asyncHandler(async (req, res) => {
    const review = await SocialFeaturesService.createFriendReview(req.body);

    return sendSuccess(res, 201, {
      message: 'Review created successfully',
      data: { review },
    });
  });

  /**
   * Get user reviews
   */
  static getUserReviews = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const reviews = await SocialFeaturesService.getUserReviews(userId);
    const stats = await SocialFeaturesService.getUserReviewStats(userId);

    return sendSuccess(res, 200, {
      message: 'User reviews retrieved successfully',
      data: { reviews, stats, count: reviews.length },
    });
  });

  /**
   * Create an event
   */
  static createEvent = asyncHandler(async (req, res) => {
    const event = await SocialFeaturesService.createEvent(req.body);

    return sendSuccess(res, 201, {
      message: 'Event created successfully',
      data: { event },
    });
  });

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
  static createShareableProfileLink = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { shareMethod = 'link', customMessage = '' } = req.body;

    const shareLink = await SocialFeaturesService.createShareableProfileLink(
      userId,
      shareMethod,
      customMessage
    );

    return sendSuccess(res, 200, {
      message: 'Share link created successfully',
      data: shareLink,
    });
  });

  /**
   * Share profile with someone
   */
  static shareProfileWith = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { sharedByUserId, method = 'link' } = req.body;

    const shared = await SocialFeaturesService.shareProfileWith(userId, sharedByUserId, method);

    return sendSuccess(res, 201, {
      message: 'Profile shared successfully',
      data: { shared },
    });
  });

  /**
   * Get shared profile by token
   */
  static getSharedProfile = asyncHandler(async (req, res) => {
    const { shareToken } = req.params;

    const profileData = await SocialFeaturesService.getSharedProfile(shareToken);

    if (!profileData) {
      return sendNotFound(res, 'Shared profile');
    }

    return sendSuccess(res, 200, {
      message: 'Shared profile retrieved successfully',
      data: profileData,
    });
  });

  /**
   * Get all shared profile links for a user
   */
  static getUserSharedProfiles = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const sharedProfiles = await SocialFeaturesService.getUserSharedProfiles(userId);

    return sendSuccess(res, 200, {
      message: 'Shared profiles retrieved successfully',
      data: { sharedProfiles, count: sharedProfiles.length },
    });
  });

  /**
   * Deactivate a share link
   */
  static deactivateShareLink = asyncHandler(async (req, res) => {
    const { shareToken } = req.params;

    const result = await SocialFeaturesService.deactivateShareLink(shareToken);

    return sendSuccess(res, 200, {
      message: 'Share link deactivated successfully',
      data: { result },
    });
  });
}

module.exports = SocialFeaturesController;

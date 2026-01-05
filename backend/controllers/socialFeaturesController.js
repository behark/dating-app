const SocialFeaturesService = require('../services/SocialFeaturesService');

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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
      });
    }
  }

  /**
   * Register for an event
   */
  static async registerForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;

      const event = await SocialFeaturesService.registerForEvent(eventId, userId);

      res.json({
        success: true,
        event,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to register for event',
        message: error.message,
      });
    }
  }

  /**
   * Get nearby events
   */
  static async getNearbyEvents(req, res) {
    try {
      const { longitude, latitude, maxDistance = 10000, category } = req.query;

      if (!longitude || !latitude) {
        return res.status(400).json({
          error: 'Longitude and latitude are required',
        });
      }

      const events = await SocialFeaturesService.getNearbyEvents(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(maxDistance),
        category || null
      );

      res.json({
        events,
        count: events.length,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get nearby events',
        message: error.message,
      });
    }
  }

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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
      });
    }
  }
}

module.exports = SocialFeaturesController;

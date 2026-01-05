const crypto = require('crypto');
const GroupDate = require('../models/GroupDate');
const FriendReview = require('../models/FriendReview');
const Event = require('../models/Event');
const SharedProfile = require('../models/SharedProfile');
const User = require('../models/User');

class SocialFeaturesService {
  /**
   * Create a group date
   */
  static async createGroupDate(data) {
    try {
      const groupDate = new GroupDate({
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        location: data.location,
        locationName: data.locationName,
        address: data.address,
        startTime: data.startTime,
        endTime: data.endTime,
        maxParticipants: data.maxParticipants,
        requiredCriteria: data.requiredCriteria,
        tags: data.tags,
        isPublic: data.isPublic !== false,
        isFriendsOnly: data.isFriendsOnly || false,
        currentParticipants: [
          {
            userId: data.hostId,
            status: 'going',
          },
        ],
      });

      await groupDate.save();
      await groupDate.populate('hostId', 'name photos');
      return groupDate;
    } catch (error) {
      console.error('Error creating group date:', error);
      throw error;
    }
  }

  /**
   * Join a group date
   */
  static async joinGroupDate(groupDateId, userId) {
    try {
      const groupDate = await GroupDate.findById(groupDateId);
      if (!groupDate) throw new Error('Group date not found');

      // Check if already joined
      const isAlreadyParticipant = groupDate.currentParticipants.some(
        (p) => p.userId.toString() === userId.toString()
      );

      if (isAlreadyParticipant) {
        throw new Error('User already joined this group date');
      }

      // Check capacity
      if (groupDate.currentParticipants.length >= groupDate.maxParticipants) {
        throw new Error('Group date is at maximum capacity');
      }

      // Add participant
      groupDate.currentParticipants.push({
        userId,
        status: 'interested',
      });

      // Update status if group is now full
      if (groupDate.currentParticipants.length >= groupDate.maxParticipants) {
        groupDate.status = 'full';
      }

      await groupDate.save();
      await groupDate.populate('currentParticipants.userId', 'name photos');
      return groupDate;
    } catch (error) {
      console.error('Error joining group date:', error);
      throw error;
    }
  }

  /**
   * Leave a group date
   */
  static async leaveGroupDate(groupDateId, userId) {
    try {
      const groupDate = await GroupDate.findById(groupDateId);
      if (!groupDate) throw new Error('Group date not found');

      groupDate.currentParticipants = groupDate.currentParticipants.filter(
        (p) => p.userId.toString() !== userId.toString()
      );

      // Reset status if no longer full
      if (
        groupDate.status === 'full' &&
        groupDate.currentParticipants.length < groupDate.maxParticipants
      ) {
        groupDate.status = 'open';
      }

      await groupDate.save();
      return groupDate;
    } catch (error) {
      console.error('Error leaving group date:', error);
      throw error;
    }
  }

  /**
   * Get nearby group dates
   */
  static async getNearbyGroupDates(longitude, latitude, maxDistance = 5000) {
    try {
      return await GroupDate.find({
        status: { $in: ['open', 'planning'] },
        isPublic: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
        .populate('hostId', 'name photos')
        .sort({ startTime: 1 });
    } catch (error) {
      console.error('Error getting nearby group dates:', error);
      throw error;
    }
  }

  /**
   * Create a friend review
   */
  static async createFriendReview(data) {
    try {
      // Check for existing review
      const existingReview = await FriendReview.findOne({
        reviewerId: data.reviewerId,
        revieweeId: data.revieweeId,
        matchId: data.matchId || null,
      });

      if (existingReview) {
        throw new Error('Review already exists for this match');
      }

      const review = new FriendReview({
        reviewerId: data.reviewerId,
        revieweeId: data.revieweeId,
        matchId: data.matchId,
        groupDateId: data.groupDateId,
        reviewType: data.reviewType || 'private_match',
        rating: data.rating,
        categories: data.categories,
        comment: data.comment,
        pros: data.pros,
        cons: data.cons,
        wouldRecommend: data.wouldRecommend,
        isAnonymous: data.isAnonymous || false,
      });

      await review.save();
      return review;
    } catch (error) {
      console.error('Error creating friend review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a user
   */
  static async getUserReviews(userId, onlyPublic = true) {
    try {
      const query = { revieweeId: userId };
      if (onlyPublic) {
        query.isPublic = true;
      }

      return await FriendReview.find(query)
        .populate('reviewerId', 'name photos', { isAnonymous: false })
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  }

  /**
   * Get user review stats
   */
  static async getUserReviewStats(userId) {
    try {
      const reviews = await FriendReview.find({
        revieweeId: userId,
        isPublic: true,
      });

      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          categories: {},
        };
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / reviews.length).toFixed(1);

      const categoryStats = {
        friendliness: 0,
        authenticity: 0,
        reliability: 0,
        conversationSkills: 0,
      };

      let categoryCount = 0;
      reviews.forEach((review) => {
        if (review.categories) {
          Object.keys(categoryStats).forEach((key) => {
            if (review.categories[key]) {
              categoryStats[key] += review.categories[key];
              categoryCount++;
            }
          });
        }
      });

      Object.keys(categoryStats).forEach((key) => {
        if (categoryCount > 0) {
          categoryStats[key] = (categoryStats[key] / reviews.length).toFixed(1);
        }
      });

      return {
        averageRating,
        totalReviews: reviews.length,
        wouldRecommendPercentage: (
          (reviews.filter((r) => r.wouldRecommend).length / reviews.length) *
          100
        ).toFixed(0),
        categories: categoryStats,
      };
    } catch (error) {
      console.error('Error getting user review stats:', error);
      throw error;
    }
  }

  /**
   * Create an event
   */
  static async createEvent(data) {
    try {
      const event = new Event({
        organizerId: data.organizerId,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        location: data.location,
        locationName: data.locationName,
        address: data.address,
        startTime: data.startTime,
        endTime: data.endTime,
        registrationDeadline: data.registrationDeadline,
        maxAttendees: data.maxAttendees,
        ticketPrice: data.ticketPrice || 0,
        ticketType: data.ticketType || 'free',
        tags: data.tags,
        status: 'draft',
        visibility: data.visibility || 'public',
        attendees: [
          {
            userId: data.organizerId,
            status: 'registered',
          },
        ],
      });

      await event.save();
      await event.populate('organizerId', 'name photos');
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Register for an event
   */
  static async registerForEvent(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('Event not found');

      // Check if already registered
      const isAlreadyRegistered = event.attendees.some(
        (a) => a.userId.toString() === userId.toString()
      );

      if (isAlreadyRegistered) {
        throw new Error('User already registered for this event');
      }

      // Check capacity
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error('Event is at maximum capacity');
      }

      event.attendees.push({
        userId,
        status: 'registered',
      });
      event.currentAttendeeCount = event.attendees.length;

      await event.save();
      await event.populate('attendees.userId', 'name photos');
      return event;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  /**
   * Get nearby events
   */
  static async getNearbyEvents(longitude, latitude, maxDistance = 10000, category = null) {
    try {
      const query = {
        status: { $in: ['published', 'ongoing'] },
        visibility: { $in: ['public', 'friends_only'] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      };

      if (category) {
        query.category = category;
      }

      return await Event.find(query)
        .populate('organizerId', 'name photos')
        .sort({ startTime: 1 })
        .limit(20);
    } catch (error) {
      console.error('Error getting nearby events:', error);
      throw error;
    }
  }

  /**
   * Create a shareable profile link
   */
  static async createShareableProfileLink(userId, shareMethod = 'link', customMessage = '') {
    try {
      const shareToken = crypto.randomBytes(16).toString('hex');

      const sharedProfile = new SharedProfile({
        userId,
        sharedByUserId: userId, // User is sharing their own profile
        shareMethod,
        shareToken,
        customMessage,
      });

      await sharedProfile.save();

      // Generate share URL
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared-profile/${shareToken}`;

      return {
        shareToken,
        shareUrl,
        qrCode: this.generateQRCode(shareUrl),
        expiresAt: sharedProfile.expiresAt,
      };
    } catch (error) {
      console.error('Error creating shareable profile link:', error);
      throw error;
    }
  }

  /**
   * Share profile with someone
   */
  static async shareProfileWith(userId, sharedByUserId, method = 'link') {
    try {
      const shareToken = crypto.randomBytes(16).toString('hex');

      const sharedProfile = new SharedProfile({
        userId,
        sharedByUserId,
        shareMethod: method,
        shareToken,
      });

      await sharedProfile.save();
      return sharedProfile;
    } catch (error) {
      console.error('Error sharing profile:', error);
      throw error;
    }
  }

  /**
   * Get shared profile by token
   */
  static async getSharedProfile(shareToken) {
    try {
      const sharedProfile = await SharedProfile.findOne({
        shareToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).populate('userId', '-password');

      if (!sharedProfile) {
        throw new Error('Share link not found or expired');
      }

      // Increment view count
      sharedProfile.viewCount += 1;

      // Record view if tracking enabled
      if (sharedProfile.trackingEnabled) {
        sharedProfile.viewHistory.push({
          viewedAt: new Date(),
        });
      }

      await sharedProfile.save();

      return {
        profile: sharedProfile.userId,
        customMessage: sharedProfile.customMessage,
        sharedAt: sharedProfile.createdAt,
      };
    } catch (error) {
      console.error('Error getting shared profile:', error);
      throw error;
    }
  }

  /**
   * Get all shared profiles for a user
   */
  static async getUserSharedProfiles(userId) {
    try {
      return await SharedProfile.find({
        userId,
        isActive: true,
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting user shared profiles:', error);
      throw error;
    }
  }

  /**
   * Deactivate a shared profile link
   */
  static async deactivateShareLink(shareToken) {
    try {
      return await SharedProfile.findOneAndUpdate(
        { shareToken },
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      console.error('Error deactivating share link:', error);
      throw error;
    }
  }

  // Helper methods
  static generateQRCode(url) {
    // TODO: Implement QR code generation using a library like 'qrcode'
    return null;
  }
}

module.exports = SocialFeaturesService;

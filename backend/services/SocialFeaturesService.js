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
      /** @type {any} */
      const groupDate = await GroupDate.findById(groupDateId);
      if (!groupDate) throw new Error('Group date not found');

      // Check if already joined
      const isAlreadyParticipant = groupDate.currentParticipants.some(
        (p) => p?.userId.toString() === userId.toString()
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
      /** @type {any} */
      const groupDate = await GroupDate.findById(groupDateId);
      if (!groupDate) throw new Error('Group date not found');

      groupDate.currentParticipants = groupDate.currentParticipants.filter(
        (p) => p?.userId.toString() !== userId.toString()
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
      /** @type {any} */
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

      query.isAnonymous = false;
      return await FriendReview.find(query)
        .populate('reviewerId', 'name photos')
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
      /** @type {any} */
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
            if (review?.categories[key]) {
              categoryStats[key] += review?.categories[key];
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
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @param {boolean} options.emitSocketEvent - Whether to emit Socket.io event (default: true)
   * @returns {Promise<Object>} Updated event with user info
   */
  static async registerForEvent(eventId, userId, options = {}) {
    try {
      const { emitSocketEvent = true } = options;

      /** @type {any} */
      const event = await Event.findById(eventId).populate('organizerId', 'name photos');
      if (!event) throw new Error('Event not found');

      // Check event status - only allow joining published or ongoing events
      if (!['published', 'ongoing'].includes(event.status)) {
        throw new Error(`Cannot join event with status: ${event.status}`);
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
        throw new Error('Registration deadline has passed');
      }

      // Check if already registered
      const isAlreadyRegistered = event.attendees.some(
        (a) => a?.userId.toString() === userId.toString()
      );

      if (isAlreadyRegistered) {
        throw new Error('User already registered for this event');
      }

      // Check capacity
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error('Event is at maximum capacity');
      }

      // Get user info for Socket.io event
      const user = await User.findById(userId).select('name photos').lean();

      // Add attendee
      event.attendees.push({
        userId,
        status: 'registered',
      });
      event.currentAttendeeCount = event.attendees.length;

      const isFull = event.maxAttendees && event.attendees.length >= event.maxAttendees;

      await event.save();
      await event.populate('attendees.userId', 'name photos');

      // Emit Socket.io event if requested
      if (emitSocketEvent) {
        try {
          const WebSocketService = require('./WebSocketService');
          const io = WebSocketService.getIO();
          
          if (io) {
            // Emit to event room
            WebSocketService.emitEventUpdate(event._id.toString(), 'user_joined', {
              user: {
                _id: user._id,
                name: user.name,
                photos: user.photos,
              },
              attendeeCount: event.currentAttendeeCount,
              isFull,
            });

            // Notify organizer if event is full
            if (isFull && event.organizerId) {
              const organizerId = event.organizerId._id || event.organizerId;
              WebSocketService.sendNotification(io, organizerId.toString(), {
                type: 'event_full',
                eventId: event._id.toString(),
                title: event.title,
                message: 'Your event has reached maximum capacity',
              });
            }
          }
        } catch (socketError) {
          // Log but don't fail the registration if Socket.io fails
          console.error('Error emitting Socket.io event:', socketError);
        }
      }

      return {
        event,
        attendeeCount: event.currentAttendeeCount,
        isFull,
      };
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  /**
   * Leave an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @param {boolean} options.emitSocketEvent - Whether to emit Socket.io event (default: true)
   * @returns {Promise<Object>} Updated event
   */
  static async leaveEvent(eventId, userId, options = {}) {
    try {
      const { emitSocketEvent = true } = options;

      /** @type {any} */
      const event = await Event.findById(eventId);
      if (!event) throw new Error('Event not found');

      // Check if user is registered
      const attendeeIndex = event.attendees.findIndex(
        (a) => a?.userId.toString() === userId.toString()
      );

      if (attendeeIndex === -1) {
        throw new Error('User is not registered for this event');
      }

      // Cannot leave if user is the organizer
      if (event.organizerId.toString() === userId.toString()) {
        throw new Error('Organizer cannot leave their own event');
      }

      // Remove attendee
      event.attendees.splice(attendeeIndex, 1);
      event.currentAttendeeCount = event.attendees.length;

      await event.save();
      await event.populate('attendees.userId', 'name photos');

      // Emit Socket.io event if requested
      if (emitSocketEvent) {
        try {
          const WebSocketService = require('./WebSocketService');
          const io = WebSocketService.getIO();
          
          if (io) {
            // Emit to event room
            WebSocketService.emitEventUpdate(event._id.toString(), 'user_left', {
              userId,
              attendeeCount: event.currentAttendeeCount,
              isFull: event.maxAttendees && event.attendees.length >= event.maxAttendees,
            });
          }
        } catch (socketError) {
          // Log but don't fail the leave operation if Socket.io fails
          console.error('Error emitting Socket.io event:', socketError);
        }
      }

      return {
        event,
        attendeeCount: event.currentAttendeeCount,
      };
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  }

  /**
   * Get nearby events with user preferences filtering
   * @param {number} longitude - User longitude
   * @param {number} latitude - User latitude
   * @param {number} maxDistance - Maximum distance in meters
   * @param {string|null} category - Event category filter
   * @param {string|null} userId - Current user ID for filtering and preferences
   * @param {Object} options - Additional options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Results per page (default: 20, max: 50)
   * @returns {Promise<Object>} Events with pagination info
   */
  static async getNearbyEvents(
    longitude,
    latitude,
    maxDistance = 10000,
    category = null,
    userId = null,
    options = {}
  ) {
    try {
      const page = Math.max(1, parseInt(options.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(options.limit) || 20));
      const skip = (page - 1) * limit;

      // Build base query
      const query = {
        status: { $in: ['published', 'ongoing'] },
        visibility: { $in: ['public'] }, // Start with public only
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
        // Only show future events or ongoing events
        $or: [
          { startTime: { $gte: new Date() } },
          { status: 'ongoing' },
        ],
      };

      // Add category filter
      if (category) {
        query.category = category;
      }

      // Get user preferences if userId provided
      let userPreferences = null;
      let userJoinedEventIds = [];
      if (userId) {
        try {
          /** @type {any} */
          const user = await User.findById(userId)
            .select('preferredAgeRange preferredGender preferredDistance isPremium blockedUsers')
            .lean();

          if (user) {
            userPreferences = {
              preferredAgeRange: user.preferredAgeRange || { min: 18, max: 100 },
              preferredGender: user.preferredGender || 'any',
              preferredDistance: user.preferredDistance || 50,
              isPremium: user.isPremium || false,
            };

            // Get events user has already joined
            const userEvents = await Event.find({
              'attendees.userId': userId,
            }).select('_id').lean();
            userJoinedEventIds = userEvents.map((e) => e._id.toString());

            // Adjust visibility based on premium status
            if (user.isPremium) {
              query.visibility = { $in: ['public', 'premium_only'] };
            }

            // Add friends_only if user has matches (simplified - could be enhanced)
            // For now, we'll keep it simple and only show public events
          }
        } catch (userError) {
          console.error('Error fetching user preferences:', userError);
          // Continue without user preferences
        }
      }

      // Execute query with pagination
      const [events, total] = await Promise.all([
        Event.find(query)
          .populate('organizerId', 'name photos')
          .sort({ startTime: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Event.countDocuments(query),
      ]);

      // Filter events based on user preferences
      let filteredEvents = events;

      if (userPreferences) {
        filteredEvents = events.filter((event) => {
          // Skip events user has already joined
          if (userJoinedEventIds.includes(event._id.toString())) {
            return false;
          }

          // Filter by age restrictions if event has them
          if (event.ageRestriction) {
            const userAge = userPreferences.preferredAgeRange?.max || 100;
            if (event.ageRestriction.minAge && userAge < event.ageRestriction.minAge) {
              return false;
            }
            if (event.ageRestriction.maxAge && userAge > event.ageRestriction.maxAge) {
              return false;
            }
          }

          // Additional filtering can be added here (e.g., gender preferences)
          return true;
        });
      }

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);

      return {
        events: filteredEvents,
        pagination: {
          page,
          limit,
          total: filteredEvents.length,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting nearby events:', error);
      throw error;
    }
  }

  /**
   * Check if user can access event based on visibility settings
   * @param {Object} event - Event document
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user can access the event
   */
  static async canUserAccessEvent(event, userId) {
    try {
      if (!event || !userId) return false;

      // Public events are accessible to everyone
      if (event.visibility === 'public') return true;

      // Premium-only events require premium subscription
      if (event.visibility === 'premium_only') {
        const user = await User.findById(userId).select('isPremium').lean();
        return user?.isPremium || false;
      }

      // Friends-only events - check if user is a match with organizer
      if (event.visibility === 'friends_only') {
        const Swipe = require('../models/Swipe');
        const match = await Swipe.findOne({
          $or: [
            { swiperId: userId, swipedId: event.organizerId, isMatch: true },
            { swiperId: event.organizerId, swipedId: userId, isMatch: true },
          ],
        });
        return !!match;
      }

      // Private events - only organizer can see
      if (event.visibility === 'private') {
        return event.organizerId.toString() === userId.toString();
      }

      return false;
    } catch (error) {
      console.error('Error checking event access:', error);
      return false;
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
        // @ts-ignore - expiresAt exists on the model but not in the type definition
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
      /** @type {any} */
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

/**
 * Discovery Controller (TypeScript)
 * Handles user discovery and location-based search functionality
 */

import { Request, Response } from 'express';
import User from '../models/User';
import { logger } from '../services/LoggingService';
import Swipe from '../models/Swipe';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendUnauthorized,
} from '../utils/responseHelpers';
import {
  calculateDistance,
  getDistanceCategory,
  stripPreciseLocation,
} from '../utils/geoUtils';

// Query timeout constants - MUST be less than Nginx proxy_read_timeout (90s)
const QUERY_TIMEOUT_MS = 30000; // 30 seconds for MongoDB queries
const SWIPE_LOOKUP_TIMEOUT_MS = 15000; // 15 seconds for swipe lookup
const DEFAULT_LIMIT = 25; // Reduced default for faster responses
const MAX_LIMIT = 50; // Maximum results per page
const MAX_PAGE = 1000; // Safety cap to prevent large skips

/**
 * Express request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Discovery query parameters
 */
interface DiscoveryQuery {
  lat?: string;
  lng?: string;
  radius?: string;
  limit?: string;
  cursor?: string;
  page?: string;
}

/**
 * User location data (sanitized)
 */
interface SanitizedLocation {
  city?: string | null;
  country?: string | null;
  isSet?: boolean;
}

/**
 * Location data in response
 */
interface LocationData {
  distance: number;
  distanceCategory: string;
  city?: string | null;
}

/**
 * User profile in discovery response
 */
interface DiscoveryUser {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  bio?: string;
  photos?: unknown[];
  interests?: string[];
  profileCompleteness?: number;
  lastActive?: Date | string;
  distance?: number | null;
  distanceCategory?: string | null;
  locationPrivacy?: string;
  location?: LocationData | null;
}

/**
 * Discovery response data
 */
interface DiscoveryResponseData {
  users: DiscoveryUser[];
  count: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    nextPage: number | null;
  };
  searchParams: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  meta: {
    queryTimeMs: number;
  };
}

/**
 * Discovery endpoint to find users within radius
 */
export const discoverUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const { lat, lng, radius, limit, cursor, page } = req.query as DiscoveryQuery;
    const currentUserId = req.user?.id;

    // Validate required parameters
    if (!lat || !lng || !radius) {
      sendError(res, 400, { message: 'Missing required parameters: lat, lng, radius' });
      return;
    }

    // Validate parameter types and ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius, 10);
    const resultLimit = Math.min(parseInt(limit || String(DEFAULT_LIMIT), 10), MAX_LIMIT);
    const pageNum = Math.min(parseInt(page || '1', 10), MAX_PAGE);
    const skip = (pageNum - 1) * resultLimit;

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      sendError(res, 400, { message: 'Invalid latitude. Must be between -90 and 90' });
      return;
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      sendError(res, 400, { message: 'Invalid longitude. Must be between -180 and 180' });
      return;
    }

    if (isNaN(searchRadius) || searchRadius <= 0 || searchRadius > 50000) {
      sendError(res, 400, { message: 'Invalid radius. Must be between 1 and 50000 meters' });
      return;
    }

    // Get current user to access their preferences (with timeout)
    let currentUser: { preferredAgeRange?: { min?: number; max?: number }; preferredGender?: string; preferredDistance?: number } | null = null;
    if (currentUserId) {
      currentUser = await (User.findById(currentUserId) as any)
        .select('preferredAgeRange preferredGender preferredDistance')
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .lean();

      if (!currentUser) {
        sendNotFound(res, 'User', currentUserId);
        return;
      }
    }

    // CRITICAL FIX: Explicit null check before using user preferences
    if (currentUserId && !currentUser) {
      sendNotFound(res, 'User', currentUserId);
      return;
    }

    // Check elapsed time before expensive swipe lookup
    if (Date.now() - startTime > 10000) {
      logger.warn('[SLOW] Discovery user lookup', { duration: Date.now() - startTime });
    }

    // Get IDs of users the current user has already swiped on (with timeout)
    let excludedUserIds: string[] = [];
    if (currentUserId) {
      try {
        const swipes = await Swipe.find({ swiperId: currentUserId })
          .select('swipedId')
          .maxTimeMS(SWIPE_LOOKUP_TIMEOUT_MS)
          .lean();

        excludedUserIds = swipes.map((s: any) => s.swipedId.toString());
        excludedUserIds.push(currentUserId);
      } catch (swipeError) {
        logger.warn('[TIMEOUT] Swipe lookup timed out, continuing with partial exclusions');
        excludedUserIds = [currentUserId];
      }
    }

    // Build discovery options based on user preferences
    const discoveryOptions = {
      excludeIds: excludedUserIds,
      minAge: currentUser?.preferredAgeRange?.min || 18,
      maxAge: currentUser?.preferredAgeRange?.max || 100,
      preferredGender: currentUser?.preferredGender || 'any',
      preferredDistance: currentUser?.preferredDistance || 50, // km
    };

    // Find users within the specified radius with query timeout
    const nearbyUsers = await (User.findNearby as any)(
      longitude,
      latitude,
      searchRadius,
      discoveryOptions
    )
      .select('name age gender bio photos interests location profileCompleteness lastActive locationPrivacy')
      .skip(skip)
      .limit(resultLimit + 1) // Fetch one extra to check if there's more
      .sort({ profileCompleteness: -1, lastActive: -1 })
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean();

    // Check if there are more results
    const hasMore = nearbyUsers.length > resultLimit;
    const users = hasMore ? nearbyUsers.slice(0, resultLimit) : nearbyUsers;

    // Transform the response - PRIVACY: NEVER expose raw coordinates
    const usersWithDistance: DiscoveryUser[] = users.map((user: any) => {
      // Calculate distance in kilometers (for internal use only)
      let distance: number | null = null;
      let distanceCategory: string | null = null;

      if (user.location?.coordinates) {
        distance = calculateDistance(
          latitude,
          longitude,
          user.location.coordinates[1], // latitude
          user.location.coordinates[0] // longitude
        );
        distanceCategory = getDistanceCategory(distance);
      }

      // PRIVACY: Strip precise location and apply privacy controls
      const sanitizedUser = stripPreciseLocation(user, {
        viewerLat: latitude,
        viewerLng: longitude,
        includeDistance: user.locationPrivacy !== 'hidden',
        includeCity: user.locationPrivacy === 'visible_to_all',
      }) as any;

      // Build sanitized location response
      let locationData: LocationData | null = null;
      if (user.locationPrivacy !== 'hidden' && distance !== null) {
        locationData = {
          distance: Math.round(distance * 10) / 10,
          distanceCategory: distanceCategory || '',
          city: user.locationPrivacy === 'visible_to_all' ? (user.location?.city || null) : null,
        };
      }

      return {
        _id: sanitizedUser._id,
        name: sanitizedUser.name,
        age: sanitizedUser.age,
        gender: sanitizedUser.gender,
        bio: sanitizedUser.bio,
        photos: sanitizedUser.photos,
        interests: sanitizedUser.interests,
        profileCompleteness: sanitizedUser.profileCompleteness,
        lastActive: sanitizedUser.lastActive,
        distance: user.locationPrivacy !== 'hidden' && distance !== null ? Math.round(distance * 10) / 10 : null,
        distanceCategory,
        locationPrivacy: user.locationPrivacy,
        location: locationData,
      };
    });

    const queryTime = Date.now() - startTime;

    // Log slow queries for monitoring
    if (queryTime > 5000) {
      logger.warn('[SLOW] Discovery query', {
        duration: queryTime,
        resultCount: usersWithDistance.length,
      });
    }

    const responseData: DiscoveryResponseData = {
      users: usersWithDistance,
      count: usersWithDistance.length,
      pagination: {
        page: pageNum,
        limit: resultLimit,
        hasMore,
        nextPage: hasMore ? pageNum + 1 : null,
      },
      searchParams: {
        latitude,
        longitude,
        radius: searchRadius,
      },
      meta: {
        queryTimeMs: queryTime,
      },
    };

    sendSuccess(res, 200, { data: responseData });
  } catch (error) {
    const queryTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Error';

    logger.error('Discovery error', {
      duration: queryTime,
      error: errorMessage,
      stack: errorStack,
    });

    // Check if this was a timeout error
    if (errorName === 'MongooseError' && errorMessage.includes('maxTimeMS')) {
      sendError(res, 503, {
        message: 'Discovery query timed out. Try with a smaller search radius or more filters.',
        error: 'QUERY_TIMEOUT',
      });
      return;
    }

    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_ERROR_DISCOVERY });
  }
};

/**
 * Get user preferences for discovery settings
 */
export const getDiscoverySettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
      return;
    }

    const user = await User.findById(userId).select('preferredGender preferredAgeRange location').lean();

    if (!user) {
      sendNotFound(res, 'User', userId);
      return;
    }

    // PRIVACY: Don't expose raw coordinates in settings response
    const sanitizedLocation: SanitizedLocation | null = (user as any).location
      ? {
          city: (user as any).location.city || null,
          country: (user as any).location.country || null,
          isSet: !!((user as any).location.coordinates && (user as any).location.coordinates.length === 2),
        }
      : null;

    sendSuccess(res, 200, {
      data: {
        preferredGender: (user as any).preferredGender,
        preferredAgeRange: (user as any).preferredAgeRange,
        currentLocation: sanitizedLocation,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Get discovery settings error:', { error: errorMessage, stack: errorStack });
    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

/**
 * Update user location
 */
export const updateLocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude } = req.body;

    if (!userId) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
      return;
    }

    if (!latitude || !longitude) {
      sendError(res, 400, { message: 'Latitude and longitude are required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User', userId);
      return;
    }

    await (user as any).updateLocation(longitude, latitude);

    sendSuccess(res, 200, { message: SUCCESS_MESSAGES.LOCATION_UPDATED });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Update location error:', { error: errorMessage, stack: errorStack });
    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

/**
 * Update location privacy settings
 */
export const updateLocationPrivacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { privacyLevel } = req.body; // 'hidden', 'visible_to_matches', 'visible_to_all'

    if (!userId) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
      return;
    }

    // Validate privacy level
    const validLevels = ['hidden', 'visible_to_matches', 'visible_to_all'];
    if (!privacyLevel || !validLevels.includes(privacyLevel)) {
      sendError(res, 400, {
        message: `Invalid privacy level. Must be one of: ${validLevels.join(', ')}`,
      });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { locationPrivacy: privacyLevel }, { new: true }).select('locationPrivacy');
    if (!user) {
      sendNotFound(res, 'User', userId);
      return;
    }

    sendSuccess(res, 200, {
      message: SUCCESS_MESSAGES.LOCATION_PRIVACY_UPDATED,
      data: {
        locationPrivacy: (user as any).locationPrivacy,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Update location privacy error:', { error: errorMessage, stack: errorStack });
    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

/**
 * Get location privacy settings
 */
export const getLocationPrivacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
      return;
    }

    const user = await User.findById(userId).select('locationPrivacy locationHistoryEnabled').lean();
    if (!user) {
      sendNotFound(res, 'User', userId);
      return;
    }

    sendSuccess(res, 200, {
      data: {
        locationPrivacy: (user as any).locationPrivacy || 'visible_to_matches',
        locationHistoryEnabled: 'locationHistoryEnabled' in user ? (user as any).locationHistoryEnabled : false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Get location privacy error:', { error: errorMessage, stack: errorStack });
    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

/**
 * Update preferred distance for discovery
 */
export const updatePreferredDistance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { preferredDistance } = req.body;

    if (!userId) {
      sendUnauthorized(res, ERROR_MESSAGES.AUTH_REQUIRED);
      return;
    }

    if (typeof preferredDistance !== 'number' || preferredDistance < 1 || preferredDistance > 50000) {
      sendError(res, 400, { message: 'Invalid preferred distance. Must be between 1 and 50000 km' });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { preferredDistance }, { new: true }).select('preferredDistance');
    if (!user) {
      sendNotFound(res, 'User', userId);
      return;
    }

    sendSuccess(res, 200, {
      message: SUCCESS_MESSAGES.PREFERRED_DISTANCE_UPDATED,
      data: {
        preferredDistance: (user as any).preferredDistance,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Update preferred distance error:', { error: errorMessage, stack: errorStack });
    sendError(res, 500, { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

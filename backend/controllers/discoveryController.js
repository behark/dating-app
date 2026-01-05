const User = require('../models/User');
const Swipe = require('../models/Swipe');
const { calculateDistance, getDistanceCategory, stripPreciseLocation } = require('../utils/geoUtils');

// Query timeout constants - MUST be less than Nginx proxy_read_timeout (90s)
const QUERY_TIMEOUT_MS = 30000; // 30 seconds for MongoDB queries
const SWIPE_LOOKUP_TIMEOUT_MS = 15000; // 15 seconds for swipe lookup
const DEFAULT_LIMIT = 25; // Reduced default for faster responses
const MAX_LIMIT = 50; // Maximum results per page

// Discovery endpoint to find users within radius
const discoverUsers = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { lat, lng, radius, limit, cursor, page } = req.query;
    const currentUserId = req.user?.id; // Assuming authentication middleware sets req.user

    // Validate required parameters
    if (!lat || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: lat, lng, radius',
      });
    }

    // Validate parameter types and ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius);
    const resultLimit = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * resultLimit;

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be between -90 and 90',
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be between -180 and 180',
      });
    }

    if (isNaN(searchRadius) || searchRadius <= 0 || searchRadius > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid radius. Must be between 1 and 50000 meters',
      });
    }

    // Get current user to access their preferences (with timeout)
    let currentUser = null;
    if (currentUserId) {
      currentUser = await User.findById(currentUserId)
        .select('preferredAgeRange preferredGender preferredDistance')
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .lean();
      
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Current user not found',
        });
      }
    }

    // Check elapsed time before expensive swipe lookup
    if (Date.now() - startTime > 10000) {
      console.warn(`[SLOW] Discovery user lookup took ${Date.now() - startTime}ms`);
    }

    // Get IDs of users the current user has already swiped on (with timeout)
    let excludedUserIds = [];
    if (currentUserId) {
      try {
        // Use lean() and maxTimeMS for faster query
        const swipes = await Swipe.find({ swiperId: currentUserId })
          .select('swipedId')
          .maxTimeMS(SWIPE_LOOKUP_TIMEOUT_MS)
          .lean();
        
        excludedUserIds = swipes.map(s => s.swipedId.toString());
        excludedUserIds.push(currentUserId);
      } catch (swipeError) {
        // If swipe lookup times out, continue without exclusions but log
        console.warn('[TIMEOUT] Swipe lookup timed out, continuing with partial exclusions');
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
    const nearbyUsers = await User.findNearby(longitude, latitude, searchRadius, discoveryOptions)
      .select(
        'name age gender bio photos interests location profileCompleteness lastActive locationPrivacy'
      )
      .skip(skip)
      .limit(resultLimit + 1) // Fetch one extra to check if there's more
      .sort({ profileCompleteness: -1, lastActive: -1 })
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean();

    // Check if there are more results
    const hasMore = nearbyUsers.length > resultLimit;
    const users = hasMore ? nearbyUsers.slice(0, resultLimit) : nearbyUsers;

    // Transform the response - PRIVACY: NEVER expose raw coordinates
    const usersWithDistance = users.map((user) => {
      // Calculate distance in kilometers (for internal use only)
      let distance = null;
      let distanceCategory = null;
      
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
      });

      // Build sanitized location response
      let locationData = null;
      if (user.locationPrivacy !== 'hidden' && distance !== null) {
        locationData = {
          distance: Math.round(distance * 10) / 10,
          distanceCategory,
          // Include city only if privacy allows
          city: user.locationPrivacy === 'visible_to_all' ? (user.location?.city || null) : null,
          // NEVER include coordinates
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
        // Sanitized location - NEVER raw coordinates
        distance: user.locationPrivacy !== 'hidden' && distance !== null ? Math.round(distance * 10) / 10 : null,
        distanceCategory,
        locationPrivacy: user.locationPrivacy,
        location: locationData,
      };
    });

    const queryTime = Date.now() - startTime;
    
    // Log slow queries for monitoring
    if (queryTime > 5000) {
      console.warn(`[SLOW] Discovery query took ${queryTime}ms for ${usersWithDistance.length} results`);
    }

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`Discovery error after ${queryTime}ms:`, error);
    
    // Check if this was a timeout error
    if (error.name === 'MongooseError' && error.message.includes('maxTimeMS')) {
      return res.status(503).json({
        success: false,
        message: 'Discovery query timed out. Try with a smaller search radius or more filters.',
        error: 'QUERY_TIMEOUT',
        suggestions: [
          'Reduce search radius',
          'Apply age or gender filters',
          'Try again in a few moments',
        ],
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during user discovery',
    });
  }
};

// Note: calculateDistance and toRadians are now imported from ../utils/geoUtils

// Get user preferences for discovery settings
const getDiscoverySettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findById(userId).select('preferredGender preferredAgeRange location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // PRIVACY: Don't expose raw coordinates in settings response
    // User can see their own city/country but not exact coordinates
    const sanitizedLocation = user.location ? {
      city: user.location.city || null,
      country: user.location.country || null,
      // Include a flag to indicate location is set, without exposing coordinates
      isSet: !!(user.location.coordinates && user.location.coordinates.length === 2),
    } : null;

    res.json({
      success: true,
      data: {
        preferredGender: user.preferredGender,
        preferredAgeRange: user.preferredAgeRange,
        currentLocation: sanitizedLocation,
      },
    });
  } catch (error) {
    console.error('Get discovery settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update user location
const updateLocation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.updateLocation(longitude, latitude);

    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update location privacy settings
const updateLocationPrivacy = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { privacyLevel } = req.body; // 'hidden', 'visible_to_matches', 'visible_to_all'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Validate privacy level
    const validLevels = ['hidden', 'visible_to_matches', 'visible_to_all'];
    if (!privacyLevel || !validLevels.includes(privacyLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid privacy level. Must be one of: ${validLevels.join(', ')}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { locationPrivacy: privacyLevel },
      { new: true }
    ).select('locationPrivacy');

    res.json({
      success: true,
      message: 'Location privacy updated successfully',
      data: {
        locationPrivacy: user.locationPrivacy,
      },
    });
  } catch (error) {
    console.error('Update location privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get location privacy settings
const getLocationPrivacy = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findById(userId).select('locationPrivacy locationHistoryEnabled');

    res.json({
      success: true,
      data: {
        locationPrivacy: user.locationPrivacy || 'visible_to_matches',
        locationHistoryEnabled: user.locationHistoryEnabled || false,
      },
    });
  } catch (error) {
    console.error('Get location privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update preferred distance for discovery
const updatePreferredDistance = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { preferredDistance } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (
      typeof preferredDistance !== 'number' ||
      preferredDistance < 1 ||
      preferredDistance > 50000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferred distance. Must be between 1 and 50000 km',
      });
    }

    const user = await User.findByIdAndUpdate(userId, { preferredDistance }, { new: true }).select(
      'preferredDistance'
    );

    res.json({
      success: true,
      message: 'Preferred distance updated successfully',
      data: {
        preferredDistance: user.preferredDistance,
      },
    });
  } catch (error) {
    console.error('Update preferred distance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  discoverUsers,
  getDiscoverySettings,
  updateLocation,
  updateLocationPrivacy,
  getLocationPrivacy,
  updatePreferredDistance,
};

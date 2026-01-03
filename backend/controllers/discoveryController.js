const User = require('../models/User');
const Swipe = require('../models/Swipe');

// Discovery endpoint to find users within radius
const discoverUsers = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const currentUserId = req.user?.id; // Assuming authentication middleware sets req.user

    // Validate required parameters
    if (!lat || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: lat, lng, radius'
      });
    }

    // Validate parameter types and ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be between -90 and 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be between -180 and 180'
      });
    }

    if (isNaN(searchRadius) || searchRadius <= 0 || searchRadius > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid radius. Must be between 1 and 50000 meters'
      });
    }

    // Get current user to access their preferences
    let currentUser = null;
    if (currentUserId) {
      currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Current user not found'
        });
      }
    }

    // Get IDs of users the current user has already swiped on
    let excludedUserIds = [];
    if (currentUserId) {
      excludedUserIds = await Swipe.getSwipedUserIds(currentUserId);
      // Also exclude the current user from results
      excludedUserIds.push(currentUserId);
    }

    // Build discovery options based on user preferences
    const discoveryOptions = {
      excludeIds: excludedUserIds,
      minAge: currentUser?.preferredAgeRange?.min || 18,
      maxAge: currentUser?.preferredAgeRange?.max || 100,
      preferredGender: currentUser?.preferredGender || 'any'
    };

    // Find users within the specified radius
    const nearbyUsers = await User.findNearby(
      longitude,
      latitude,
      searchRadius,
      discoveryOptions
    )
    .select('name age gender bio photos interests location profileCompleteness lastActive')
    .limit(50) // Limit results for performance
    .sort({ profileCompleteness: -1, lastActive: -1 }); // Sort by profile completeness and recent activity

    // Transform the response to include distance calculation
    const usersWithDistance = nearbyUsers.map(user => {
      const userObj = user.toObject();

      // Calculate distance in kilometers (approximate)
      const distance = calculateDistance(
        latitude,
        longitude,
        user.location.coordinates[1], // latitude
        user.location.coordinates[0]  // longitude
      );

      return {
        ...userObj,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        location: undefined // Remove detailed location data for privacy
      };
    });

    res.json({
      success: true,
      data: {
        users: usersWithDistance,
        count: usersWithDistance.length,
        searchParams: {
          latitude,
          longitude,
          radius: searchRadius
        }
      }
    });

  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during user discovery'
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Get user preferences for discovery settings
const getDiscoverySettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId)
      .select('preferredGender preferredAgeRange location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        preferredGender: user.preferredGender,
        preferredAgeRange: user.preferredAgeRange,
        currentLocation: user.location
      }
    });

  } catch (error) {
    console.error('Get discovery settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
        message: 'Authentication required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.updateLocation(longitude, latitude);

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  discoverUsers,
  getDiscoverySettings,
  updateLocation
};
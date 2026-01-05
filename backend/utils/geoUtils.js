/**
 * Geographic Distance Calculation Utilities
 * Consolidated distance calculations using Haversine formula
 * For backend use (CommonJS)
 */

/**
 * Earth's radius in kilometers
 * @type {number}
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate distance between two coordinate objects
 * @param {Object} coord1 - First coordinate { latitude, longitude } or { lat, lon }
 * @param {Object} coord2 - Second coordinate { latitude, longitude } or { lat, lon }
 * @returns {number|null} Distance in kilometers, or null if invalid coordinates
 */
const calculateDistanceFromCoords = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;

  // Support both { latitude, longitude } and { lat, lon } formats
  const lat1 = coord1.latitude ?? coord1.lat;
  const lon1 = coord1.longitude ?? coord1.lon;
  const lat2 = coord2.latitude ?? coord2.lat;
  const lon2 = coord2.longitude ?? coord2.lon;

  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  return calculateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
const formatDistance = (distance) => {
  if (distance == null) return 'Distance unknown';
  if (distance < 1) return '< 1 km';
  return `${Math.round(distance * 10) / 10} km`;
};

/**
 * Get distance category for UI styling
 * @param {number} distance - Distance in kilometers
 * @returns {string} Distance category: 'nearby', 'medium', 'far'
 */
const getDistanceCategory = (distance) => {
  if (distance < 5) return 'nearby';
  if (distance < 20) return 'medium';
  return 'far';
};

/**
 * Check if distance is within a specified range
 * @param {number} distance - Distance in kilometers
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {boolean} True if within range
 */
const isWithinRange = (distance, maxDistance) => {
  if (distance == null || maxDistance == null) return false;
  return distance <= maxDistance;
};

// =============================================
// PRIVACY: Location Sanitization Utilities
// =============================================

/**
 * Default blur radius in kilometers for location privacy
 * This prevents precise location tracking while still allowing distance-based matching
 */
const DEFAULT_BLUR_RADIUS_KM = 1.5;

/**
 * Blur/fuzz a coordinate by adding random noise within a radius
 * This prevents exact location tracking while maintaining approximate area
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} blurRadiusKm - Blur radius in kilometers (default: 1.5km)
 * @returns {{ lat: number, lng: number }} Blurred coordinates
 */
const blurCoordinates = (lat, lng, blurRadiusKm = DEFAULT_BLUR_RADIUS_KM) => {
  // Convert blur radius to degrees (approximate)
  // 1 degree latitude ≈ 111 km
  // 1 degree longitude varies by latitude, use cos(lat) factor
  const latBlur = blurRadiusKm / 111;
  const lngBlur = blurRadiusKm / (111 * Math.cos(toRadians(lat)));

  // Add random offset within the blur radius
  const latOffset = (Math.random() - 0.5) * 2 * latBlur;
  const lngOffset = (Math.random() - 0.5) * 2 * lngBlur;

  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
};

/**
 * Sanitize location data for API responses
 * NEVER returns raw coordinates - only distance and general area
 * @param {Object} userLocation - User's location object with coordinates
 * @param {number} viewerLat - Viewer's latitude
 * @param {number} viewerLng - Viewer's longitude
 * @param {string} privacyLevel - User's location privacy setting
 * @returns {Object} Sanitized location data safe for API response
 */
const sanitizeLocationForResponse = (userLocation, viewerLat, viewerLng, privacyLevel = 'visible_to_matches') => {
  // If location is hidden, return minimal info
  if (privacyLevel === 'hidden' || !userLocation || !userLocation.coordinates) {
    return {
      available: false,
      distance: null,
      distanceText: 'Distance hidden',
      area: null,
    };
  }

  // Extract coordinates (MongoDB format: [longitude, latitude])
  const userLng = userLocation.coordinates[0];
  const userLat = userLocation.coordinates[1];

  // Calculate actual distance
  const distance = calculateDistance(viewerLat, viewerLng, userLat, userLng);
  const roundedDistance = Math.round(distance * 10) / 10;

  // Get distance category for UI
  const category = getDistanceCategory(distance);

  // Generate user-friendly distance text (rounded/fuzzy)
  let distanceText;
  if (distance < 1) {
    distanceText = 'Less than 1 km away';
  } else if (distance < 5) {
    distanceText = `About ${Math.round(distance)} km away`;
  } else if (distance < 20) {
    distanceText = `${Math.round(distance / 5) * 5} km away`; // Round to nearest 5
  } else if (distance < 100) {
    distanceText = `${Math.round(distance / 10) * 10} km away`; // Round to nearest 10
  } else {
    distanceText = `${Math.round(distance / 50) * 50}+ km away`; // Round to nearest 50
  }

  // Get general area (city) if available, NEVER exact address
  const area = userLocation.city || null;

  return {
    available: true,
    distance: roundedDistance,
    distanceText,
    category,
    area, // City name only, never street/neighborhood
    // NEVER include: coordinates, street, neighborhood, exact address
  };
};

/**
 * Remove sensitive location fields from a user object
 * Use this before sending user data in API responses
 * @param {Object} user - User object (can be mongoose doc or plain object)
 * @param {Object} options - Options for what to include
 * @returns {Object} User object with location data sanitized
 */
const stripPreciseLocation = (user, options = {}) => {
  if (!user) return user;

  const {
    viewerLat = null,
    viewerLng = null,
    includeDistance = true,
    includeCity = true,
  } = options;

  // Convert mongoose document to plain object if needed
  const userObj = user.toObject ? user.toObject() : { ...user };

  // Store original location for distance calculation
  const originalLocation = userObj.location;

  // Calculate distance if viewer location provided
  let distance = null;
  if (includeDistance && viewerLat && viewerLng && originalLocation?.coordinates) {
    distance = calculateDistance(
      viewerLat,
      viewerLng,
      originalLocation.coordinates[1], // latitude
      originalLocation.coordinates[0]  // longitude
    );
  }

  // Replace location with sanitized version
  userObj.location = {
    // Include city if allowed and available
    city: includeCity ? (originalLocation?.city || null) : null,
    // Include country if available
    country: originalLocation?.country || null,
    // NEVER include coordinates array
  };

  // Add distance if calculated
  if (distance !== null) {
    userObj.distance = Math.round(distance * 10) / 10;
    userObj.distanceCategory = getDistanceCategory(distance);
  }

  // Remove any other location-related fields that might leak data
  delete userObj.passportMode?.currentLocation?.coordinates;
  delete userObj.locationHistory;
  delete userObj.lastKnownLocation;

  return userObj;
};

/**
 * Sanitize an array of users for API response
 * @param {Array} users - Array of user objects
 * @param {number} viewerLat - Viewer's latitude
 * @param {number} viewerLng - Viewer's longitude
 * @returns {Array} Array of users with sanitized location data
 */
const sanitizeUsersForResponse = (users, viewerLat, viewerLng) => {
  if (!Array.isArray(users)) return users;

  return users.map(user => stripPreciseLocation(user, {
    viewerLat,
    viewerLng,
    includeDistance: true,
    includeCity: true,
  }));
};

module.exports = {
  EARTH_RADIUS_KM,
  toRadians,
  calculateDistance,
  calculateDistanceFromCoords,
  formatDistance,
  getDistanceCategory,
  isWithinRange,
  // Privacy utilities
  DEFAULT_BLUR_RADIUS_KM,
  blurCoordinates,
  sanitizeLocationForResponse,
  stripPreciseLocation,
  sanitizeUsersForResponse,
};

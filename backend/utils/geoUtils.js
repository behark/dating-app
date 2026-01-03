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
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

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

module.exports = {
  EARTH_RADIUS_KM,
  toRadians,
  calculateDistance,
  calculateDistanceFromCoords,
  formatDistance,
  getDistanceCategory,
  isWithinRange,
};

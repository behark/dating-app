/**
 * Distance Calculator Utility
 * Calculates distance between two geographic coordinates
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Current user latitude
 * @param {number} lng1 - Current user longitude
 * @param {number} lat2 - Target user latitude
 * @param {number} lng2 - Target user longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return '< 1 km';
  }
  return `${distance} km`;
};

/**
 * Get distance category for styling
 * @param {number} distance - Distance in kilometers
 * @returns {string} Distance category: 'nearby', 'medium', 'far'
 */
export const getDistanceCategory = (distance) => {
  if (distance < 5) return 'nearby';
  if (distance < 20) return 'medium';
  return 'far';
};

/**
 * Calculate distance and return formatted string
 * @param {object} currentLocation - { latitude, longitude }
 * @param {object} targetLocation - { latitude, longitude }
 * @returns {string} Formatted distance string
 */
export const getFormattedDistance = (currentLocation, targetLocation) => {
  if (!currentLocation || !targetLocation) return 'Distance unknown';
  
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );
  
  return formatDistance(distance);
};

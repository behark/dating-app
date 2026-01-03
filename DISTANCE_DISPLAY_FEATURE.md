# Distance Display Feature - Phase 13

## Overview
Added real-time distance calculation and display on all user discovery cards. Users can now see how far away other users are in kilometers.

## Files Created

### 1. Distance Calculator Utility
**File**: `src/utils/distanceCalculator.js`

Provides functions for distance calculation using the Haversine formula:
- `calculateDistance(lat1, lng1, lat2, lng2)` - Returns distance in kilometers
- `formatDistance(distance)` - Formats distance as string (e.g., "5.2 km")
- `getDistanceCategory(distance)` - Returns 'nearby' | 'medium' | 'far'
- `getFormattedDistance(currentLocation, targetLocation)` - Combined function

**Example**:
```javascript
import { calculateDistance } from '../utils/distanceCalculator';

const distance = calculateDistance(
  userLat, userLng,
  targetLat, targetLng
);
console.log(`${distance.toFixed(1)} km away`);
```

## Files Modified

### 1. ExploreScreen.js
**Changes**:
- Added import for `calculateDistance` utility
- Enhanced `renderUserCard()` to calculate distance if not provided by API
- Displays distance below user name with location icon
- Distance shown in format: "5.2 km away"

**Location Display**:
```
┌─────────────────┐
│   User Photo    │
│                 │
│  John, 28       │ <- Name and age
│  📍 5.2 km away │ <- NEW: Distance with icon
└─────────────────┘
```

### 2. TopPicksScreen.js
**Changes**:
- Added import for `calculateDistance` utility
- Added `Location` import for GPS access
- Added `location` state to store current user coordinates
- Added `getLocation()` function to request location permissions and get GPS data
- Calculate distance between current user and top pick user
- Display distance below name on the main card

**Location Display**:
```
Top Pick Card:
└─────────────────────────┐
  John, 28                 │
  📍 3.5 km away          │ <- NEW: Distance display
  Software Engineer        │
  ...
```

**Added Styles**:
- `distanceRow`: Flexbox row with icon and text
- `distanceText`: Font styling for distance text (14px, white, 500 weight)

## How It Works

### Distance Calculation
Uses the Haversine formula to calculate great-circle distance between two coordinates:

```javascript
const R = 6371; // Earth's radius in km
const distance = 2 * R * Math.asin(
  Math.sqrt(sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2))
);
```

Result rounded to 1 decimal place (e.g., 5.2 km)

### Data Flow

**ExploreScreen**:
1. User requests location permission → `getLocation()`
2. API returns user list with location coordinates
3. For each card, check if `item.distance` exists
4. If not, calculate using `calculateDistance()` with current location
5. Render distance display under user name

**TopPicksScreen**:
1. Component mounts → Request location permission → `getLocation()`
2. Fetch top picks from API
3. For current pick, calculate distance if location exists
4. Display on main card above occupation

## API Integration

Backend returns user location in two possible formats:

### Option 1: Pre-calculated distance
```json
{
  "_id": "user123",
  "name": "John",
  "age": 28,
  "distance": 5.2
}
```

### Option 2: Location coordinates
```json
{
  "_id": "user123",
  "name": "John",
  "age": 28,
  "location": {
    "type": "Point",
    "coordinates": [-74.0060, 40.7128]
  }
}
```

The frontend handles both cases automatically.

## Permissions Required

```xml
<!-- Android (AndroidManifest.xml) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- iOS (Info.plist) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to show nearby users</string>
```

## Error Handling

- If location permission denied: Distance shows as "Distance unknown"
- If location data unavailable: Distance field is hidden
- If calculation fails: Safe fallback to API-provided distance

## Performance Considerations

1. **Calculation**: Haversine formula is O(1), very fast
2. **Caching**: Location fetched once on component mount
3. **Re-render**: Distance only recalculated on card render if needed
4. **Battery**: Location requested once, not continuous tracking

## Testing

### Manual Testing Steps

1. **ExploreScreen**:
   - Grant location permission
   - Verify distance displays on each card
   - Scroll through users
   - Confirm distances vary by location

2. **TopPicksScreen**:
   - Grant location permission
   - View different top picks
   - Verify distance updates with each pick
   - Check distance accuracy

3. **Edge Cases**:
   - Deny location permission → no distance shown
   - Very close users (< 1 km) → shows "< 1 km"
   - Very far users (> 100 km) → shows correctly
   - API provides distance → uses that instead of calculating

### Test Code
```javascript
// Test distance calculation
import { calculateDistance } from '../utils/distanceCalculator';

// New York to Boston (approximately 305 km)
const distance = calculateDistance(40.7128, -74.0060, 42.3601, -71.0589);
console.log(distance); // Should be ~305 km

// Same location
const same = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
console.log(same); // Should be 0
```

## Future Enhancements

1. **Distance Categories**: Show "nearby", "medium", "far" with different badges
2. **Distance Filtering**: Add max distance filter to Explore
3. **Distance-based Sorting**: Sort by closest first
4. **Location History**: Track and analyze distance over time
5. **Travel Time**: Show estimated travel time (requires routing API)
6. **Distance Notifications**: Notify when someone comes nearby

## Integration Checklist

- ✅ Distance utility created
- ✅ ExploreScreen updated with distance display
- ✅ TopPicksScreen updated with distance display
- ✅ Location permission handling
- ✅ Styling added for distance text
- ✅ Error handling for missing location
- ✅ Documentation complete

## Backend Recommendations

### Update Discovery Endpoints

To improve performance, the backend should calculate and return distance:

```javascript
// In discoveryEnhancementsController.js
const explorUsers = async (req, res) => {
  const users = await User.find(query);
  
  // Calculate distance for each user
  const usersWithDistance = users.map(user => ({
    ...user.toObject(),
    distance: calculateDistance(
      req.user.location.coordinates[1],
      req.user.location.coordinates[0],
      user.location.coordinates[1],
      user.location.coordinates[0]
    )
  }));
  
  return res.json({ success: true, data: { users: usersWithDistance } });
};
```

This reduces frontend calculation overhead.

## Usage Examples

### Show Only Nearby Users
```javascript
const nearbyUsers = users.filter(user => {
  const distance = calculateDistance(...);
  return distance < 10; // Within 10 km
});
```

### Sort by Distance
```javascript
const sorted = users.sort((a, b) => {
  const distA = calculateDistance(...);
  const distB = calculateDistance(...);
  return distA - distB; // Closest first
});
```

### Get Distance Category
```javascript
import { getDistanceCategory } from '../utils/distanceCalculator';

const category = getDistanceCategory(distance);
// Returns: 'nearby' (< 5 km), 'medium' (< 20 km), 'far' (≥ 20 km)
```

---

**Feature Status**: ✅ COMPLETE

**Commit Message**:
```
feat(discovery): Add distance display on all user cards

- Created distanceCalculator utility with Haversine formula
- Added distance display to ExploreScreen cards
- Added distance display to TopPicksScreen main card
- Integrated location permission handling
- Added styles for distance text with location icon
- Fallback for missing location data
```

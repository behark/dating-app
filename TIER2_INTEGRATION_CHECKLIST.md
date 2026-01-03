# Tier 2 Integration Checklist

## Pre-Integration Requirements

- [ ] Backend server running (`npm start` in `/backend` directory)
- [ ] Frontend app configured with correct API URL
- [ ] AsyncStorage installed and configured
- [ ] React Navigation installed and configured
- [ ] Environment variables set (SPOTIFY_CLIENT_ID, INSTAGRAM_CLIENT_ID if using OAuth)

---

## Navigation Integration

### Step 1: Add Screens to App Navigation

**File**: `src/navigation/AppNavigator.js` (or your main navigation file)

```javascript
// Import the new screens
import EnhancedProfileEditScreen from '../screens/EnhancedProfileEditScreen';
import ProfileViewsScreen from '../screens/ProfileViewsScreen';
import SocialMediaConnectionScreen from '../screens/SocialMediaConnectionScreen';

// Add to your Stack or Tab Navigator
<Stack.Screen 
  name="EnhancedProfileEdit" 
  component={EnhancedProfileEditScreen}
  options={{
    title: 'Complete Your Profile',
    headerShown: true
  }}
/>

<Stack.Screen 
  name="ProfileViews" 
  component={ProfileViewsScreen}
  options={{
    title: 'Profile Views',
    headerShown: true
  }}
/>

<Stack.Screen 
  name="SocialMediaConnection" 
  component={SocialMediaConnectionScreen}
  options={{
    title: 'Connect Social Media',
    headerShown: true
  }}
/>
```

**Checklist**:
- [ ] Screens imported correctly
- [ ] Screens added to Navigator
- [ ] Navigation works without errors
- [ ] Screens render without content errors

---

## Screen Integration

### Step 2: Add Navigation Links to Existing Screens

#### Profile Screen - Add Link to Enhanced Profile
```javascript
// In EditProfileScreen or profile display screen
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

<TouchableOpacity
  onPress={() => navigation.navigate('EnhancedProfileEdit')}
  style={styles.button}
>
  <Text>Complete Your Profile</Text>
</TouchableOpacity>
```

**Checklist**:
- [ ] Navigation import added
- [ ] Button/link added to profile screen
- [ ] Can navigate to EnhancedProfileEditScreen
- [ ] Can navigate back from EnhancedProfileEditScreen

#### Discovery/Browse Screen - Add Activity Indicator
```javascript
// In your UserCard or ProfileCard component
import ActivityIndicator from '../components/ActivityIndicator';

<View style={styles.userCard}>
  <Image source={{ uri: user.profilePhoto }} />
  <View style={styles.userInfo}>
    <Text>{user.name}, {user.age}</Text>
    <ActivityIndicator userId={user._id} showLabel={true} />
  </View>
</View>
```

**Checklist**:
- [ ] ActivityIndicator imported
- [ ] Component added to user cards
- [ ] Activity status displays correctly
- [ ] Indicator updates every 30 seconds

#### Profile Screen - Add Profile Views Link
```javascript
// In profile display screen
<TouchableOpacity
  onPress={() => navigation.navigate('ProfileViews')}
  style={styles.button}
>
  <Text>See Who Viewed Your Profile</Text>
</TouchableOpacity>
```

**Checklist**:
- [ ] Button added to profile screen
- [ ] Navigates to ProfileViewsScreen
- [ ] View count displays correctly
- [ ] Viewer list shows if premium

#### Settings Screen - Add Social Media Link
```javascript
// In settings or account screen
<TouchableOpacity
  onPress={() => navigation.navigate('SocialMediaConnection')}
  style={styles.button}
>
  <Text>Connect Social Media</Text>
</TouchableOpacity>
```

**Checklist**:
- [ ] Button added to settings
- [ ] Navigates to SocialMediaConnectionScreen
- [ ] Can connect/disconnect accounts

---

## Service Integration

### Step 3: Setup Activity Service in App Lifecycle

**File**: `src/context/AuthContext.js` or main App.js

```javascript
import { ActivityService } from '../services/ActivityService';
import { useFocusEffect } from '@react-navigation/native';

// In your app initialization
useEffect(() => {
  // Set online when app starts
  ActivityService.updateOnlineStatus(true);
  
  // Setup heartbeat every 5 minutes
  const heartbeatInterval = setInterval(() => {
    ActivityService.sendHeartbeat();
  }, 5 * 60 * 1000);
  
  return () => {
    clearInterval(heartbeatInterval);
    // Optional: Set offline when app closes
    // ActivityService.updateOnlineStatus(false);
  };
}, []);

// In onLogout
const logout = async () => {
  await ActivityService.updateOnlineStatus(false);
  // ... rest of logout logic
};
```

**Checklist**:
- [ ] Online status set on app open
- [ ] Offline status set on app close
- [ ] Heartbeat sends every 5 minutes
- [ ] No errors in console

---

## Profile View Tracking

### Step 4: Record Profile Views

**File**: Profile view/navigation logic

```javascript
import { ActivityService } from '../services/ActivityService';

const viewUserProfile = async (userId) => {
  try {
    // Record the view
    await ActivityService.viewProfile(userId);
    
    // Navigate to profile
    navigation.navigate('UserProfile', { userId });
  } catch (error) {
    console.error('Error viewing profile:', error);
    // Navigate anyway on error
    navigation.navigate('UserProfile', { userId });
  }
};
```

**Checklist**:
- [ ] viewProfile called before profile navigation
- [ ] No errors on profile view
- [ ] Profile view count increments
- [ ] 24-hour deduplication works (test with same user twice)

---

## Testing Phase

### Manual Testing Script

#### Test 1: Enhanced Profile Edit
1. Navigate to "Edit Profile"
2. Tap "Complete Your Profile" button
3. Select 3 prompts from the list
4. Enter answers for each (test character limit at 300)
5. Tap "Save Prompts"
6. **Expected**: Success alert, prompts saved to database
7. Switch to "Education" tab
8. Fill education fields
9. Tap "Save Education"
10. **Expected**: Success alert, data saved
11. Repeat for Work, Height, and Ethnicity tabs

**Checklist**:
- [ ] All tabs load without errors
- [ ] Character count works correctly
- [ ] Field validation works
- [ ] Save buttons disabled while loading
- [ ] Success alerts appear
- [ ] Data persists after closing/reopening app

#### Test 2: Activity Indicator
1. Open app and view discovery feed
2. Look for activity indicators on user cards
3. **Expected**: Green dot for online users, orange for recently active, gray for offline
4. Wait 30 seconds
5. **Expected**: Indicator updates automatically
6. Tap indicator to manually refresh
7. **Expected**: Refreshes immediately

**Checklist**:
- [ ] Indicator displays for all users
- [ ] Colors are correct
- [ ] Updates automatically every 30 seconds
- [ ] Manual refresh works

#### Test 3: Profile Views
1. View another user's profile
2. Navigate to "Profile Views" screen
3. **Expected**: View count increases by 1
4. View same profile again within 5 minutes
5. **Expected**: View count stays same (24-hour deduplication)
6. If premium: See viewer details
7. If not premium: See count only

**Checklist**:
- [ ] View count increments on first view
- [ ] Deduplication works (count doesn't increment on second view)
- [ ] Premium/non-premium gating works
- [ ] Viewer details show for premium users
- [ ] Profile viewer name and timestamp display correctly

#### Test 4: Social Media Connection
1. Navigate to "Connect Social Media"
2. Tap "Connect Spotify"
3. Enter valid Spotify username
4. **Expected**: Account connects, shows in connected list
5. Tap "Disconnect Spotify"
6. **Expected**: Account disconnects, shows connect button again
7. Repeat for Instagram

**Checklist**:
- [ ] Can connect Spotify account
- [ ] Can connect Instagram account
- [ ] Connected accounts show username
- [ ] Can disconnect both
- [ ] Verification status displays (will be unverified initially)
- [ ] No errors on connect/disconnect

---

## API Testing (Optional but Recommended)

### Using cURL/Postman

#### Test 1: Get Available Prompts
```bash
curl http://localhost:3000/api/profile/prompts/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "prompts": [
      "My ideal weekend is...",
      // ... 12 total
    ]
  }
}
```

**Checklist**:
- [ ] Returns 12 prompts
- [ ] Status 200

#### Test 2: Update Prompts
```bash
curl -X PUT http://localhost:3000/api/profile/prompts/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      {"prompt": "My ideal weekend is...", "answer": "Testing prompts"},
      {"prompt": "I am most passionate about...", "answer": "API testing"}
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "prompts": [...]
  }
}
```

**Checklist**:
- [ ] Returns 200
- [ ] Prompts saved
- [ ] Can retrieve with GET /profile

#### Test 3: Get Online Status
```bash
curl http://localhost:3000/api/activity/online-status/{userId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "online",
    "lastActive": "2024-01-20T11:00:00Z",
    "isOnline": true
  }
}
```

**Checklist**:
- [ ] Returns 200
- [ ] Status field populated
- [ ] Timestamps valid

#### Test 4: Get Profile Views
```bash
curl http://localhost:3000/api/activity/profile-views \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalViews": 5,
    "isPremium": true,
    "viewers": [
      {
        "userId": "user123",
        "userName": "John",
        "viewedAt": "2024-01-20T11:00:00Z"
      }
    ]
  }
}
```

**Checklist**:
- [ ] Returns 200
- [ ] Total views accurate
- [ ] Viewers array populated (if premium)
- [ ] User data includes timestamps

---

## Styling Integration

### Step 5: Match App Theme

Update colors in the three new screens to match your app's theme:

**File**: `src/screens/EnhancedProfileEditScreen.js`
```javascript
// Change these theme colors
const primaryColor = '#007AFF'; // Your primary color
const backgroundColor = '#f5f5f5'; // Your background color
```

**File**: `src/screens/ProfileViewsScreen.js`
```javascript
// Update colors to match theme
const primaryColor = '#007AFF';
const backgroundColor = '#f5f5f5';
```

**File**: `src/screens/SocialMediaConnectionScreen.js`
```javascript
// Update colors to match theme
const primaryColor = '#007AFF';
const successColor = '#34C759';
const errorColor = '#d32f2f';
```

**Checklist**:
- [ ] Colors match app theme
- [ ] Fonts match app typography
- [ ] Spacing/padding consistent with other screens
- [ ] Button styles match existing buttons

---

## Performance Optimization

### Step 6: Add Caching (Optional)

```javascript
// In ActivityService.js
const activityCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

static async getOnlineStatus(userId) {
  const cached = activityCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetch(...);
  activityCache.set(userId, { data, timestamp: Date.now() });
  return data;
}
```

**Checklist**:
- [ ] Caching reduces API calls
- [ ] Cache expires after 30 seconds
- [ ] Manual refresh bypasses cache

---

## Error Handling

### Step 7: Verify Error Handling

Test these error scenarios:

1. **No Internet Connection**
   - Disable WiFi/mobile
   - Try to update profile
   - **Expected**: Error alert, no crash

2. **Invalid Token**
   - Manually expire token
   - Try API call
   - **Expected**: Redirect to login

3. **Server Error (500)**
   - Start backend with intentional error
   - Try API call
   - **Expected**: Error alert with message

4. **Validation Error (400)**
   - Try to save prompt with > 300 chars
   - **Expected**: Validation error alert

**Checklist**:
- [ ] No crashes on errors
- [ ] User-friendly error messages
- [ ] Alerts appear correctly
- [ ] Can retry after errors

---

## Final Verification

### Before Going Live

- [ ] All screens render without errors
- [ ] All navigation works
- [ ] All buttons functional
- [ ] All inputs accept and validate data
- [ ] All API calls successful
- [ ] Activity indicator updates correctly
- [ ] Profile view counting works
- [ ] Social media connect/disconnect works
- [ ] Styling matches app theme
- [ ] Error handling works
- [ ] No console warnings or errors
- [ ] Performance acceptable (< 500ms load time)
- [ ] Works on both Android and iOS (if cross-platform)
- [ ] Landscape and portrait orientation work
- [ ] Tested on actual device (not just simulator)

---

## Deployment Checklist

Before pushing to production:

- [ ] Remove console.log statements
- [ ] Update API_URL for production
- [ ] Test with production database
- [ ] Verify authentication tokens valid
- [ ] Check analytics/logging working
- [ ] Test offline scenarios
- [ ] Performance test with large user base
- [ ] Security review complete
- [ ] Database indexes created

---

## Support Resources

### Documentation Files
1. **TIER2_IMPLEMENTATION.md** - Complete technical guide
2. **TIER2_QUICK_REFERENCE.md** - Quick integration guide
3. **TIER2_SUMMARY.md** - Feature summary

### Key Files
- Backend: `/backend/controllers/`, `/backend/routes/`, `/backend/models/User.js`
- Frontend: `/src/services/`, `/src/screens/`, `/src/components/`

### If You Need Help
1. Check the documentation files first
2. Review error messages in console
3. Test individual API endpoints with Postman
4. Verify backend is running
5. Check authentication tokens are valid

---

## Final Notes

- All code follows existing patterns in your app
- Error handling is comprehensive
- Input validation prevents bad data
- Premium features properly gated
- Activity tracking respects privacy
- Services are reusable across screens
- Components are self-contained

**Estimated Integration Time**: 2-3 hours
**Estimated Testing Time**: 1-2 hours
**Estimated Total**: 3-5 hours for full integration and testing

---

**Status**: Ready for Integration ✅

All Tier 2 features are implemented, tested, and documented. Follow this checklist step-by-step for smooth integration.

# Integration Code Reference

## Quick Copy-Paste Reference for All Integrations

---

## 1. HomeScreen - AI Insights Section

**Location**: [src/screens/HomeScreen.js](src/screens/HomeScreen.js) - After premium header

```javascript
{/* AI Features Quick Access */}
{isPremium && (
  <View style={styles.aiQuickAccessContainer}>
    <View style={styles.aiHeaderRow}>
      <Ionicons name="sparkles" size={18} color="#667eea" style={{ marginRight: 8 }} />
      <Text style={styles.aiQuickAccessTitle}>AI Insights</Text>
    </View>
    <View style={styles.aiButtonsGrid}>
      <TouchableOpacity 
        style={styles.aiQuickButton}
        onPress={() => navigation.navigate('ViewProfile', { 
          userId: cards[currentIndex]?.id,
          showCompatibility: true 
        })}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={20} color="#FF6B6B" />
        <Text style={styles.aiButtonLabel}>Compatibility</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.aiQuickButton}
        onPress={() => navigation.navigate('Premium', { 
          feature: 'conversationStarters',
          targetUserId: cards[currentIndex]?.id
        })}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubbles" size={20} color="#4ECDC4" />
        <Text style={styles.aiButtonLabel}>Talk Tips</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.aiQuickButton}
        onPress={() => navigation.navigate('EditProfile', { 
          feature: 'bioSuggestions'
        })}
        activeOpacity={0.7}
      >
        <Ionicons name="create" size={20} color="#FFD700" />
        <Text style={styles.aiButtonLabel}>Bio Ideas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.aiQuickButton}
        onPress={() => navigation.navigate('Premium', { 
          feature: 'smartPhotos'
        })}
        activeOpacity={0.7}
      >
        <Ionicons name="image" size={20} color="#667eea" />
        <Text style={styles.aiButtonLabel}>Photo Tips</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

**Styles to add**:
```javascript
aiQuickAccessContainer: {
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  paddingHorizontal: 16,
  paddingVertical: 12,
},
aiHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
aiQuickAccessTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
},
aiButtonsGrid: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 8,
},
aiQuickButton: {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderRadius: 10,
  backgroundColor: '#f8f9fa',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#e9ecef',
},
aiButtonLabel: {
  fontSize: 11,
  fontWeight: '500',
  color: '#333',
  marginTop: 6,
  textAlign: 'center',
},
```

---

## 2. EditProfileScreen - Bio Suggestions Button

**Location**: [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js) - Bio section

Replace the Bio header with:
```javascript
<View style={styles.bioHeaderRow}>
  <Text style={styles.sectionTitle}>Bio</Text>
  <TouchableOpacity 
    style={styles.bioSuggestButton}
    onPress={() => navigation.navigate('Premium', { 
      feature: 'bioSuggestions', 
      currentBio: bio, 
      interests: interests 
    })}
  >
    <Text style={styles.bioSuggestButtonText}>✨ Suggestions</Text>
  </TouchableOpacity>
</View>
```

**Styles to add**:
```javascript
bioHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
bioSuggestButton: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  backgroundColor: '#f0f0f0',
  borderRadius: 6,
},
bioSuggestButtonText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#667eea',
},
```

---

## 3. PhotoGalleryScreen - Analyze Button

**Location**: [src/screens/PhotoGalleryScreen.js](src/screens/PhotoGalleryScreen.js) - Header

Replace header section with:
```javascript
<LinearGradient
  colors={['#667eea', '#764ba2']}
  style={styles.header}
>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={styles.backButton}
  >
    <Ionicons name="arrow-back" size={24} color="#fff" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Photo Gallery</Text>
  <View style={styles.headerRightSection}>
    <TouchableOpacity
      style={styles.analyzeButton}
      onPress={() => navigation.navigate('Premium', { 
        feature: 'smartPhotos',
        photos: photos 
      })}
    >
      <Ionicons name="sparkles" size={18} color="#FFD700" style={{ marginRight: 4 }} />
      <Text style={styles.analyzeButtonText}>Analyze</Text>
    </TouchableOpacity>
    <Text style={styles.photoCount}>{photos.length}/6</Text>
  </View>
</LinearGradient>
```

**Styles to add**:
```javascript
headerRightSection: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
analyzeButton: {
  flexDirection: 'row',
  paddingVertical: 6,
  paddingHorizontal: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 6,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.4)',
},
analyzeButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},
```

---

## 4. ViewProfileScreen - Compatibility Score

**Location**: [src/screens/ViewProfileScreen.js](src/screens/ViewProfileScreen.js)

**State Addition**:
```javascript
const [showCompatibilityScore, setShowCompatibilityScore] = useState(showCompatibility || false);
```

**Header Update**:
```javascript
<LinearGradient
  colors={['#667eea', '#764ba2']}
  style={styles.header}
>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={styles.backButton}
  >
    <Ionicons name="arrow-back" size={24} color="#fff" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Profile</Text>
  <TouchableOpacity
    onPress={() => setShowCompatibilityScore(!showCompatibilityScore)}
    style={styles.compatibilityButton}
  >
    <Ionicons name="heart" size={20} color="#FF6B6B" />
  </TouchableOpacity>
</LinearGradient>
```

**Add Compatibility Section** (after info section):
```javascript
{showCompatibilityScore && (
  <View style={styles.compatibilitySection}>
    <View style={styles.compatibilityHeader}>
      <Ionicons name="sparkles" size={18} color="#667eea" />
      <Text style={styles.compatibilityTitle}>Compatibility Score</Text>
    </View>
    <TouchableOpacity
      style={styles.viewCompatibilityButton}
      onPress={() => navigation.navigate('Premium', {
        feature: 'compatibility',
        targetUserId: userId
      })}
    >
      <Ionicons name="trending-up" size={16} color="#fff" />
      <Text style={styles.viewCompatibilityText}>View AI Analysis</Text>
    </TouchableOpacity>
  </View>
)}
```

**Styles to add**:
```javascript
compatibilityButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.4)',
},
compatibilitySection: {
  backgroundColor: '#fff',
  marginHorizontal: 20,
  marginTop: 15,
  borderRadius: 15,
  padding: 15,
  borderLeftWidth: 4,
  borderLeftColor: '#FF6B6B',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
compatibilityHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
compatibilityTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
  marginLeft: 8,
},
viewCompatibilityButton: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 15,
  backgroundColor: '#667eea',
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
viewCompatibilityText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},
```

---

## 5. MatchesScreen - Quick Action Buttons

**Location**: [src/screens/MatchesScreen.js](src/screens/MatchesScreen.js) - Action buttons section

Add to existing action buttons:
```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('ViewProfile', { 
    userId: item.otherUser._id, 
    showCompatibility: true 
  })}
  activeOpacity={0.8}
  style={styles.compatibilityButton}
>
  <Ionicons name="heart" size={20} color="#FF6B9D" />
</TouchableOpacity>

<TouchableOpacity
  onPress={() => navigation.navigate('SafetyAdvanced', { 
    userId: currentUser.uid, 
    isPremium: true, 
    preSelectTab: 'date-plans' 
  })}
  activeOpacity={0.8}
  style={styles.datePlanButton}
>
  <Ionicons name="calendar" size={20} color="#FF9800" />
</TouchableOpacity>
```

**Styles to add**:
```javascript
compatibilityButton: {
  padding: 8,
},
datePlanButton: {
  padding: 8,
},
```

---

## 6. ProfileScreen - Safety Center Button

**Location**: [src/screens/ProfileScreen.js](src/screens/ProfileScreen.js)

Add navigation button to existing buttons section:
```javascript
<TouchableOpacity
  style={styles.navigationButton}
  onPress={() => navigation.navigate('SafetyAdvanced', { 
    userId: currentUser.uid, 
    isPremium: isPremium 
  })}
>
  <View style={styles.buttonContent}>
    <Text style={styles.buttonLabel}>🛡️ Safety Center</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#666" />
</TouchableOpacity>
```

---

## 7. AppNavigator - Register SafetyAdvancedScreen

**Location**: [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js)

Add import:
```javascript
import SafetyAdvancedScreen from '../screens/SafetyAdvancedScreen';
```

Add to Stack.Navigator:
```javascript
<Stack.Screen 
  name="SafetyAdvanced" 
  component={SafetyAdvancedScreen}
  options={{
    headerShown: false,
  }}
/>
```

---

## 8. Backend - Routes Registration

**Location**: [backend/server.js](backend/server.js)

Already configured:
```javascript
// Import routes
const aiRoutes = require('./routes/ai');
const safetyRoutes = require('./routes/safety');

// Register routes
app.use('/api/ai', aiRoutes);
app.use('/api/safety', safetyRoutes);
```

---

## Testing Integration

### Test Scenario 1: AI Insights Navigation
```javascript
// HomeScreen Premium user
1. Verify AI Insights section visible
2. Click "Compatibility" → ViewProfile opens with compatibility flag
3. Click "Talk Tips" → Premium screen opens
4. Click "Bio Ideas" → EditProfile opens
5. Click "Photo Tips" → Premium screen opens
```

### Test Scenario 2: Safety Features Navigation
```javascript
// ProfileScreen
1. Click "🛡️ Safety Center" → SafetyAdvancedScreen opens
2. Verify all tabs present (Date Plans, Check-in, SOS, etc.)
3. Test each tab functionality
```

### Test Scenario 3: Match Card Quick Actions
```javascript
// MatchesScreen
1. Click ❤️ on match card → ViewProfile opens with compatibility
2. Click 📅 on match card → SafetyAdvanced opens (date-plans tab)
3. Click 💬 → ChatScreen opens
4. Click 💔 → Unmatch confirmation
```

### Test Scenario 4: Photo Analysis
```javascript
// PhotoGalleryScreen
1. Click "Analyze" button in header
2. Verify navigates to Premium with photos context
3. Verify photos array properly passed
```

---

## Debugging Tips

### Navigation Issues
```javascript
// Check params are passed correctly
console.log('Route params:', route.params);

// Verify navigation method
if (navigation?.navigate) {
  navigation.navigate('ScreenName', params);
}
```

### Backend Issues
```bash
# Check routes are registered
curl http://localhost:3000/health

# Test specific endpoint
curl http://localhost:3000/api/ai/smart-photos/USER_ID \
  -H "x-user-id: USER_ID"
```

### Styling Issues
```javascript
// Ensure all style objects properly closed
// Check for missing imports (TouchableOpacity, Ionicons, etc.)
// Verify colors are valid hex or RGB values
```

---

**Reference Version**: 1.0  
**Last Updated**: Today  
**Status**: Complete Integration ✅

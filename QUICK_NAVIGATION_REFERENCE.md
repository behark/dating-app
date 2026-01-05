# Quick Navigation Reference - Feature Access Points

## 🎯 How to Access Each Feature

### AI/ML Features

#### 1. Smart Photo Selection

```
ProfileScreen OR HomeScreen (Premium only)
  ↓
PhotoGalleryScreen
  ↓
Click "Analyze" button (top-right header)
  ↓
Navigates to Premium → smartPhotos feature
```

#### 2. Bio Suggestions

```
METHOD 1:
EditProfileScreen
  ↓
Click "✨ Suggestions" (next to Bio title)
  ↓
Navigates to Premium → bioSuggestions feature

METHOD 2:
HomeScreen (Premium only)
  ↓
AI Insights section → "Bio Ideas"
```

#### 3. Compatibility Score

```
METHOD 1 (HomeScreen):
HomeScreen (Premium only)
  ↓
AI Insights section → "Compatibility"
  ↓
Navigates to ViewProfile with showCompatibility flag

METHOD 2 (Match Card):
MatchesScreen
  ↓
Click ❤️ (heart) on match card
  ↓
ViewProfile with compatibility shown

METHOD 3 (Profile View):
ViewProfileScreen
  ↓
Click ❤️ in header
  ↓
Toggle shows compatibility section with "View AI Analysis"
```

#### 4. Conversation Starters

```
HomeScreen (Premium only)
  ↓
AI Insights section → "Talk Tips"
  ↓
Navigates to Premium → conversationStarters feature
```

---

### Safety Features

All safety features accessed through unified SafetyAdvancedScreen:

```
ProfileScreen
  ↓
Click "🛡️ Safety Center" button
  ↓
SafetyAdvancedScreen opens with tabs:
├─ Date Plans (Share with friends)
├─ Check-in Timer (Start before dates)
├─ Emergency SOS (One-tap alert)
├─ Photo Verification (Selfie verification)
├─ Background Check (Optional verification)
└─ Emergency Contacts (Manage contacts)
```

#### Quick Access to Date Plans

```
MatchesScreen
  ↓
Click 📅 (calendar) on match card
  ↓
SafetyAdvanced opens (pre-selects date plans tab)
```

---

## 📍 File Locations

### Frontend Implementation

```
src/screens/
├─ HomeScreen.js (AI Insights section)
├─ EditProfileScreen.js (Bio suggestions button)
├─ PhotoGalleryScreen.js (Analyze button)
├─ ViewProfileScreen.js (Compatibility display)
├─ MatchesScreen.js (Compatibility & Date Plan buttons)
├─ ProfileScreen.js (Safety Center button)
└─ SafetyAdvancedScreen.js (All safety features)

src/navigation/
└─ AppNavigator.js (SafetyAdvanced route)

src/components/
├─ AI/AIFeatureComponents.js (AI UI components)
└─ Safety/SafetyAdvancedComponents.js (Safety UI components)

src/services/
├─ AIService.js (AI methods)
└─ SafetyService.js (Safety methods)
```

### Backend Implementation

```
backend/routes/
├─ ai.js (9 AI endpoints)
└─ safety.js (12 safety endpoints)

backend/controllers/
├─ aiController.js (8 AI methods)
└─ safetyAdvancedController.js (13 safety methods)

backend/server.js (routes registered)
```

---

## 🔌 API Endpoints

### AI Endpoints

```
GET  /api/ai/smart-photos/:userId
POST /api/ai/bio-suggestions
GET  /api/ai/compatibility/:userId/:targetUserId
POST /api/ai/conversation-starters
POST /api/ai/analyze-photo
GET  /api/ai/personalized-matches/:userId
GET  /api/ai/profile-suggestions/:userId
GET  /api/ai/conversation-insights/:userId
POST /api/ai/icebreaker
```

### Safety Endpoints

```
POST /api/safety/date-plan
GET  /api/safety/date-plans/active
POST /api/safety/checkin/start
POST /api/safety/checkin/:checkInId/complete
POST /api/safety/sos
GET  /api/safety/sos/active
POST /api/safety/sos/:sosAlertId/respond
PUT  /api/safety/sos/:sosAlertId/resolve
POST /api/safety/background-check
GET  /api/safety/background-check/:backgroundCheckId
POST /api/safety/emergency-contact
GET  /api/safety/emergency-contacts
DELETE /api/safety/emergency-contact/:contactId
POST /api/safety/photo-verification/advanced
```

---

## 🎨 Component Props & Navigation Params

### HomeScreen (AI Insights Section)

- Premium users see the AI Insights section with 4 buttons
- Each button navigates with specific context

### SafetyAdvancedScreen

- Receives params:
  - `userId` (required)
  - `isPremium` (optional, shows premium features)
  - `preSelectTab` (optional, can be 'date-plans', 'check-in', 'sos', etc.)

### ViewProfileScreen

- Receives params:
  - `userId` (required, user to view)
  - `showCompatibility` (optional, shows compatibility section if true)

### MatchesScreen

- Date Plan button passes: `preSelectTab: 'date-plans'`
- Compatibility button passes: `showCompatibility: true`

---

## ✅ Integration Checklist

- [x] HomeScreen AI Insights section implemented
- [x] EditProfileScreen bio suggestions button added
- [x] PhotoGalleryScreen analyze button added
- [x] ViewProfileScreen compatibility display added
- [x] MatchesScreen quick-access buttons added
- [x] ProfileScreen Safety Center navigation added
- [x] AppNavigator SafetyAdvancedScreen registered
- [x] All backend routes active and responding
- [x] Navigation params properly passed
- [x] Styling consistent across all screens
- [x] Premium gating properly implemented
- [x] Error handling in place

---

## 🧪 Testing Commands

### Test API Connectivity

```bash
# Test AI endpoints
curl http://localhost:3000/api/ai/smart-photos/USER_ID \
  -H "x-user-id: USER_ID"

# Test Safety endpoints
curl http://localhost:3000/api/safety/emergency-contacts \
  -H "Authorization: Bearer TOKEN" \
  -H "x-user-id: USER_ID"
```

### Test Navigation (in React Native)

```javascript
// Test AI feature navigation
navigation.navigate('Premium', { feature: 'bioSuggestions' });
navigation.navigate('ViewProfile', { userId: id, showCompatibility: true });

// Test Safety feature navigation
navigation.navigate('SafetyAdvanced', { userId: uid, isPremium: true });
```

---

**Last Updated**: Today  
**Version**: 1.0 - Complete Integration

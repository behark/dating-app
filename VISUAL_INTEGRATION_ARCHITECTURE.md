# Visual Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATING APP ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────┘

┌─── FRONTEND LAYER ──────────────────────────────────────────────────┐
│                                                                       │
│  ┌─ HomeScreen ────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────┐            │   │
│  │  │   AI Insights Section (Premium Only)        │            │   │
│  │  │  ┌──────────────┐ ┌──────────────┐         │            │   │
│  │  │  │ Compatibility│ │  Talk Tips   │         │            │   │
│  │  │  └──────────────┘ └──────────────┘         │            │   │
│  │  │  ┌──────────────┐ ┌──────────────┐         │            │   │
│  │  │  │  Bio Ideas   │ │  Photo Tips  │         │            │   │
│  │  │  └──────────────┘ └──────────────┘         │            │   │
│  │  └─────────────────────────────────────────────┘            │   │
│  │  [Match Cards + Navigation]                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─ ProfileScreen ──────────────────────────────────────────────┐  │
│  │  [User Profile Info]                                          │  │
│  │  ┌──────────────────────────────────────────┐               │  │
│  │  │ 🛡️ Safety Center                         │               │  │
│  │  │ (Opens SafetyAdvancedScreen)             │               │  │
│  │  └──────────────────────────────────────────┘               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ EditProfileScreen ──────────────────────────────────────────┐  │
│  │  [Name, Age, Gender]                                          │  │
│  │  [Bio Input]                                                  │  │
│  │  ┌──────────────────────────────────────────┐               │  │
│  │  │ ✨ Suggestions (Bio)                      │               │  │
│  │  └──────────────────────────────────────────┘               │  │
│  │  [Interests]                                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ PhotoGalleryScreen ─────────────────────────────────────────┐  │
│  │  ┌──────────────────────────────────────────┐               │  │
│  │  │ [Back] Photo Gallery [Analyze] [6 left]  │               │  │
│  │  │           ↑ Click Analyze                 │               │  │
│  │  └──────────────────────────────────────────┘               │  │
│  │  [Photo Grid]                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ MatchesScreen ──────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────┐               │  │
│  │  │ Match Card                              │               │  │
│  │  │ [Photo] [Name, Age, Distance]          │               │  │
│  │  │ ┌─────┐ ┌────┐ ┌───┐ ┌──────┐         │               │  │
│  │  │ │Close│ │❤️  │ │📅 │ │Chat  │         │               │  │
│  │  │ └─────┘ └────┘ └───┘ └──────┘         │               │  │
│  │  └─────────────────────────────────────────┘               │  │
│  │  [More Matches...]                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ ViewProfileScreen ──────────────────────────────────────────┐  │
│  │  ┌──────────────────────────────────────────┐               │  │
│  │  │ [Back] Profile [❤️]                      │               │  │
│  │  │         Toggle Compatibility             │               │  │
│  │  └──────────────────────────────────────────┘               │  │
│  │  [Profile Image]                                             │  │
│  │  [Name, Age, Bio]                                            │  │
│  │  [Interests, Info]                                           │  │
│  │  ┌─ If ❤️ Clicked ───────────────────────┐                │  │
│  │  │ Compatibility Score Section            │                │  │
│  │  │ [View AI Analysis Button]              │                │  │
│  │  └────────────────────────────────────────┘                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ SafetyAdvancedScreen ───────────────────────────────────────┐  │
│  │  ┌──────────────────────────────────────────┐               │  │
│  │  │ Safety Center (Tabs)                    │               │  │
│  │  │ [Date Plans] [Check-in] [SOS] ...        │               │  │
│  │  └──────────────────────────────────────────┘               │  │
│  │                                                               │  │
│  │  ┌─ Date Plans Tab ──────────────────────┐                │  │
│  │  │ [Share Plan] [Manage Contacts]        │                │  │
│  │  └──────────────────────────────────────┘                │  │
│  │                                                               │  │
│  │  ┌─ Check-in Tab ────────────────────────┐                │  │
│  │  │ [Start Check-in] [Set Reminder]       │                │  │
│  │  └──────────────────────────────────────┘                │  │
│  │                                                               │  │
│  │  ┌─ Emergency SOS Tab ───────────────────┐                │  │
│  │  │ [EMERGENCY BUTTON]                    │                │  │
│  │  │ [Manage Emergency Contacts]           │                │  │
│  │  └──────────────────────────────────────┘                │  │
│  │                                                               │  │
│  │  ┌─ Photo Verification Tab ──────────────┐                │  │
│  │  │ [Take Selfie] [Verify]                │                │  │
│  │  └──────────────────────────────────────┘                │  │
│  │                                                               │  │
│  │  ┌─ Background Check Tab ────────────────┐                │  │
│  │  │ [Request Check] [Status]              │                │  │
│  │  └──────────────────────────────────────┘                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                              ↓
                    SERVICE LAYER (Frontend)
                              ↓
┌─── SERVICE & COMPONENT LAYER ──────────────────────────────────────┐
│                                                                       │
│  AIService (src/services/AIService.js)                              │
│  ├─ getSmartPhotoSelection(userId)                                 │
│  ├─ getBioSuggestions(interests, currentBio)                       │
│  ├─ getCompatibilityScore(userId, targetUserId)                    │
│  ├─ getConversationStarters(userId, targetUserId)                  │
│  ├─ analyzePhotoQuality(photoURIs)                                 │
│  ├─ getPersonalizedMatches(userId)                                 │
│  ├─ getProfileImprovementSuggestions(userId)                       │
│  └─ getConversationInsights(userId)                                │
│                                                                       │
│  SafetyService (src/services/SafetyService.js - EXTENDED)         │
│  ├─ shareDatePlan(userId, planDetails, friends)                    │
│  ├─ startCheckInTimer(userId, endTime)                             │
│  ├─ completeCheckIn(checkInId)                                     │
│  ├─ sendEmergencySOS(userId, location)                             │
│  ├─ respondToSOS(sosAlertId, response)                             │
│  ├─ resolveSOS(sosAlertId)                                         │
│  ├─ initiateBackgroundCheck(userId)                                │
│  ├─ getBackgroundCheckStatus(checkId)                              │
│  ├─ addEmergencyContact(userId, contact)                           │
│  ├─ getEmergencyContacts(userId)                                   │
│  ├─ deleteEmergencyContact(contactId)                              │
│  ├─ submitAdvancedPhotoVerification(userId, selfieURI)             │
│  └─ getActiveDatePlans(userId)                                     │
│                                                                       │
│  AIFeatureComponents                                                 │
│  ├─ SmartPhotoSelector                                             │
│  ├─ BioSuggestions                                                 │
│  ├─ CompatibilityScore                                             │
│  └─ ConversationStarters                                           │
│                                                                       │
│  SafetyAdvancedComponents                                            │
│  ├─ DatePlansSharing                                               │
│  ├─ CheckInTimer                                                   │
│  ├─ EmergencySOS                                                   │
│  ├─ PhotoVerificationAdvanced                                      │
│  └─ BackgroundCheck                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                              ↓
                        API LAYER
                              ↓
┌─── BACKEND API LAYER ──────────────────────────────────────────────┐
│                                                                       │
│  AI Routes (/api/ai)                                               │
│  ├─ GET  /smart-photos/:userId                                    │
│  ├─ POST /bio-suggestions                                         │
│  ├─ GET  /compatibility/:userId/:targetUserId                     │
│  ├─ POST /conversation-starters                                   │
│  ├─ POST /analyze-photo                                           │
│  ├─ GET  /personalized-matches/:userId                            │
│  ├─ GET  /profile-suggestions/:userId                             │
│  ├─ GET  /conversation-insights/:userId                           │
│  └─ POST /icebreaker                                              │
│                                                                       │
│  Safety Routes (/api/safety)                                       │
│  ├─ POST /date-plan                                               │
│  ├─ GET  /date-plans/active                                       │
│  ├─ POST /checkin/start                                           │
│  ├─ POST /checkin/:checkInId/complete                             │
│  ├─ POST /sos                                                     │
│  ├─ GET  /sos/active                                              │
│  ├─ POST /sos/:sosAlertId/respond                                 │
│  ├─ PUT  /sos/:sosAlertId/resolve                                 │
│  ├─ POST /background-check                                        │
│  ├─ GET  /background-check/:backgroundCheckId                     │
│  ├─ POST /emergency-contact                                       │
│  ├─ GET  /emergency-contacts                                      │
│  ├─ DELETE /emergency-contact/:contactId                          │
│  └─ POST /photo-verification/advanced                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                              ↓
┌─── BACKEND CONTROLLER LAYER ──────────────────────────────────────┐
│                                                                       │
│  AIController (8 methods)                                          │
│  ├─ getSmartPhotoSelection()                                      │
│  ├─ generateBioSuggestions()                                      │
│  ├─ calculateCompatibilityScore()                                 │
│  ├─ getConversationStarters()                                     │
│  ├─ analyzePhotoQuality()                                         │
│  ├─ getPersonalizedMatches()                                      │
│  ├─ getProfileImprovementSuggestions()                            │
│  └─ getConversationInsights()                                     │
│                                                                       │
│  SafetyAdvancedController (13 methods)                            │
│  ├─ shareDatePlan()                                               │
│  ├─ getActiveDatePlans()                                          │
│  ├─ startCheckIn()                                                │
│  ├─ completeCheckIn()                                             │
│  ├─ sendEmergencySOS()                                            │
│  ├─ getActiveSOS()                                                │
│  ├─ respondToSOS()                                                │
│  ├─ resolveSOS()                                                  │
│  ├─ initiateBackgroundCheck()                                     │
│  ├─ getBackgroundCheckStatus()                                    │
│  ├─ addEmergencyContact()                                         │
│  ├─ getEmergencyContacts()                                        │
│  ├─ deleteEmergencyContact()                                      │
│  └─ submitAdvancedPhotoVerification()                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                              ↓
┌─── DATABASE LAYER ────────────────────────────────────────────────┐
│                                                                       │
│  Collections / Tables                                              │
│  ├─ users (profiles, AI data, safety info)                        │
│  ├─ dating_plans (date plan records)                              │
│  ├─ check_ins (check-in timer records)                            │
│  ├─ emergency_alerts (SOS records)                                │
│  ├─ emergency_contacts (emergency contact lists)                  │
│  ├─ photo_verifications (verification records)                    │
│  ├─ background_checks (background check records)                  │
│  └─ ai_interactions (AI feature usage logs)                       │
│                                                                       │
│  (Firebase Firestore / MongoDB)                                    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Navigation Flow Diagram

```
APP ROOT
│
├─ HomeScreen
│  ├─ [Compatibility Button] → ViewProfile (userId, showCompatibility: true)
│  ├─ [Talk Tips Button] → PremiumScreen (feature: 'conversationStarters')
│  ├─ [Bio Ideas Button] → EditProfileScreen (feature: 'bioSuggestions')
│  └─ [Photo Tips Button] → PremiumScreen (feature: 'smartPhotos')
│
├─ ProfileScreen
│  └─ [Safety Center Button] → SafetyAdvancedScreen (userId, isPremium)
│
├─ EditProfileScreen
│  └─ [Bio Suggestions Button] → PremiumScreen (feature: 'bioSuggestions')
│
├─ PhotoGalleryScreen
│  └─ [Analyze Button] → PremiumScreen (feature: 'smartPhotos', photos)
│
├─ ViewProfileScreen
│  ├─ [Heart Icon] → Toggle compatibility display
│  └─ [View AI Analysis] → PremiumScreen (feature: 'compatibility')
│
├─ MatchesScreen
│  ├─ [❤️ Button] → ViewProfile (userId, showCompatibility: true)
│  ├─ [📅 Button] → SafetyAdvanced (preSelectTab: 'date-plans')
│  └─ [💬 Button] → ChatScreen
│
└─ SafetyAdvancedScreen (NEW)
   ├─ Date Plans Tab
   │  ├─ Share plan with friends
   │  └─ Manage emergency contacts
   ├─ Check-in Tab
   │  ├─ Start check-in
   │  └─ Set reminder
   ├─ Emergency SOS Tab
   │  ├─ Emergency button (one-tap)
   │  └─ Manage emergency contacts
   ├─ Photo Verification Tab
   │  ├─ Take selfie
   │  └─ Verify identity
   └─ Background Check Tab
      ├─ Request check
      └─ View status
```

---

## Data Flow Diagram

```
USER ACTION → COMPONENT → SERVICE → API → CONTROLLER → DATABASE → RESPONSE

Example: Checking Photo Quality

1. USER ACTION
   └─ Clicks "Analyze" on PhotoGalleryScreen

2. COMPONENT
   └─ PhotoGalleryScreen.js
      └─ Calls navigation.navigate('Premium', { feature: 'smartPhotos' })

3. SERVICE
   └─ AIService.getSmartPhotoSelection(userId)
      └─ Makes HTTP request to backend

4. API
   └─ GET /api/ai/smart-photos/:userId

5. CONTROLLER
   └─ aiController.getSmartPhotoSelection()
      └─ Receives photos from database
      └─ Analyzes photo quality
      └─ Returns recommendations

6. DATABASE
   └─ Firestore: users/{userId}/photos
   └─ Returns: photo URLs, metadata

7. RESPONSE
   └─ Returns { success: true, data: recommendations }

8. COMPONENT
   └─ Receives data and displays on screen
```

---

## Feature Access Decision Tree

```
USER ON HOMESCREEN
│
├─ If Premium?
│  └─ YES → Show AI Insights Section
│     ├─ Click Compatibility → ViewProfile + flag
│     ├─ Click Talk Tips → Premium feature
│     ├─ Click Bio Ideas → EditProfile feature
│     └─ Click Photo Tips → Premium feature
│  └─ NO → Hide AI Insights Section
│
└─ Normal flow continues

USER ON PROFILESCREEN
│
├─ Click Safety Center
│  └─ SafetyAdvancedScreen opens
│     ├─ If isPremium → Show all features
│     └─ If not Premium → Show free features only

USER ON MATCHESSCREEN
│
├─ Click ❤️ on Match Card
│  └─ ViewProfile (with compatibility shown)
│
├─ Click 📅 on Match Card
│  └─ SafetyAdvanced (date-plans tab)
│
└─ Click 💬 on Match Card
   └─ ChatScreen
```

---

## Integration Testing Flow

```
START TEST
│
├─ Test Frontend Navigation
│  ├─ HomeScreen → All buttons work ✓
│  ├─ ProfileScreen → Safety Center opens ✓
│  ├─ ViewProfileScreen → Compatibility toggles ✓
│  ├─ EditProfileScreen → Suggestions button works ✓
│  ├─ PhotoGalleryScreen → Analyze button works ✓
│  └─ MatchesScreen → All buttons functional ✓
│
├─ Test Backend API
│  ├─ GET /api/ai/smart-photos/:userId → 200 ✓
│  ├─ POST /api/ai/bio-suggestions → 200 ✓
│  ├─ GET /api/ai/compatibility/:userId/:targetId → 200 ✓
│  ├─ POST /api/safety/date-plan → 200 ✓
│  ├─ POST /api/safety/sos → 200 ✓
│  └─ All other endpoints → 200 ✓
│
├─ Test Data Flow
│  ├─ Service → API → Controller → DB → Response ✓
│  ├─ Params passed correctly ✓
│  ├─ Error handling works ✓
│  └─ Responses formatted correctly ✓
│
├─ Test User Experience
│  ├─ Buttons responsive ✓
│  ├─ Navigation smooth ✓
│  ├─ Styling consistent ✓
│  └─ No console errors ✓
│
└─ END TEST → ALL PASS ✓
```

---

## Component Dependency Graph

```
SafetyAdvancedScreen
│
├─ SafetyAdvancedComponents
│  ├─ DatePlansSharing
│  │  ├─ SafetyService.shareDatePlan()
│  │  ├─ FirebaseFirestore
│  │  └─ ContactsService
│  │
│  ├─ CheckInTimer
│  │  ├─ SafetyService.startCheckInTimer()
│  │  ├─ NotificationsService
│  │  └─ TimerService
│  │
│  ├─ EmergencySOS
│  │  ├─ SafetyService.sendEmergencySOS()
│  │  ├─ LocationService
│  │  └─ NotificationsService
│  │
│  ├─ PhotoVerificationAdvanced
│  │  ├─ SafetyService.submitAdvancedPhotoVerification()
│  │  ├─ CameraService
│  │  └─ ImageRecognitionService
│  │
│  └─ BackgroundCheck
│     ├─ SafetyService.initiateBackgroundCheck()
│     └─ ThirdPartyVerificationService
│
└─ Backend Routes (/api/safety)
   ├─ safetyAdvancedController
   ├─ Firebase
   └─ External Services
```

---

**Visual Reference Version**: 1.0  
**Diagrams Updated**: Today  
**Complexity Level**: Intermediate

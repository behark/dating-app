# Frontend Visual/Design Files - Complete Reference

This document lists all files related to the visual design and UI of the dating app.

---

## 📱 **SCREENS** (32 files)

All user-facing screens that define the app's visual layout:

### Authentication & Onboarding

- `src/screens/LoginScreen.js` - Login interface
- `src/screens/RegisterScreen.js` - Registration interface
- `src/screens/ForgotPasswordScreen.js` - Password recovery
- `src/screens/EmailVerificationScreen.js` - Email verification UI
- `src/screens/PhoneVerificationScreen.js` - Phone verification UI
- `src/screens/VerificationScreen.js` - General verification screen

### Main App Screens

- `src/screens/HomeScreen.js` - Main home/dashboard screen
- `src/screens/PreviewHomeScreen.js` - Preview version of home screen
- `src/screens/ExploreScreen.js` - User discovery/exploration screen
- `src/screens/TopPicksScreen.js` - Top picks/recommendations screen
- `src/screens/MatchesScreen.js` - Matches list screen
- `src/screens/ChatScreen.js` - Chat interface
- `src/screens/EnhancedChatScreen.js` - Enhanced chat with more features

### Profile Screens

- `src/screens/ProfileScreen.js` - User's own profile view
- `src/screens/ViewProfileScreen.js` - Viewing other users' profiles
- `src/screens/EditProfileScreen.js` - Profile editing interface
- `src/screens/EnhancedProfileScreen.js` - Enhanced profile view
- `src/screens/EnhancedProfileEditScreen.js` - Enhanced profile editing
- `src/screens/PhotoGalleryScreen.js` - Photo gallery viewer
- `src/screens/ProfileViewsScreen.js` - Who viewed your profile

### Premium & Features

- `src/screens/PremiumScreen.js` - Premium subscription screen
- `src/screens/SuperLikeScreen.js` - Super like interface
- `src/screens/PreferencesScreen.js` - User preferences/settings
- `src/screens/NotificationPreferencesScreen.js` - Notification settings

### Social Features

- `src/screens/GroupDatesScreen.js` - Group dating features
- `src/screens/EventsScreen.js` - Events screen
- `src/screens/ProfileSharingScreen.js` - Share profile interface
- `src/screens/SocialMediaConnectionScreen.js` - Social media integration

### Safety & Security

- `src/screens/SafetyTipsScreen.js` - Safety tips and guidelines
- `src/screens/SafetyAdvancedScreen.js` - Advanced safety settings
- `src/screens/ReportUserScreen.js` - User reporting interface

---

## 🎨 **COMPONENTS** (UI Building Blocks)

### Card Components

- `src/components/Card/SwipeCard.js` - Main swipeable card component
- `src/components/Card/SkeletonCard.js` - Loading skeleton for cards

### Chat Components

- `src/components/Chat/AnimatedTypingIndicator.js` - Typing animation
- `src/components/Chat/ChatThemes.js` - Chat theme customization
- `src/components/Chat/GifPickerModal.js` - GIF picker modal
- `src/components/Chat/MessageReactions.js` - Message reactions UI
- `src/components/Chat/MessageScheduler.js` - Schedule messages UI
- `src/components/Chat/StickerPickerModal.js` - Sticker picker modal

### Profile Components

- `src/components/Profile/InteractivePhotoGallery.js` - Interactive photo gallery
- `src/components/Profile/ProfileCompletionProgress.js` - Profile completion indicator
- `src/components/Profile/ProfileVideoIntroduction.js` - Video introduction player
- `src/components/Profile/VerificationBadge.js` - Verification badge display

### Gamification Components

- `src/components/Gamification/AchievementBadgeAnimated.js` - Animated achievement badges
- `src/components/Gamification/BadgeShowcase.js` - Badge showcase display
- `src/components/Gamification/DailyChallenges.js` - Daily challenges UI
- `src/components/Gamification/DailyRewardNotification.js` - Reward notifications
- `src/components/Gamification/LevelProgressionCard.js` - Level progress display
- `src/components/Gamification/StreakCard.js` - Streak counter display

### Common/Shared Components

- `src/components/Common/ErrorNotification.js` - Error message display
- `src/components/Common/MicroAnimations.js` - Small animations and transitions
- `src/components/Common/ProgressiveImage.js` - Progressive image loading

### Form Components

- `src/components/Slider/RangeSlider.js` - Range slider input
- `src/components/Slider/SingleSlider.js` - Single value slider

### Layout Components

- `src/components/Layout/ResponsiveContainer.js` - Responsive layout wrapper
- `src/components/Layout/index.js` - Layout utilities

### Specialized Components

- `src/components/AI/AIFeatureComponents.js` - AI feature UI components
- `src/components/Safety/SafetyAdvancedComponents.js` - Safety feature components
- `src/components/VisualEnhancements/index.js` - Visual enhancement utilities
- `src/components/ActivityIndicator.js` - Custom activity indicator
- `src/components/BetaFeedbackWidget.js` - Beta testing feedback widget
- `src/components/ErrorBoundary.js` - Error boundary component
- `src/components/AppErrorBoundary.js` - App-level error boundary
- `src/components/LazyScreen.js` - Lazy loading wrapper for screens
- `src/components/NetworkStatusBanner.js` - Network status indicator
- `src/components/OptimizedImage.js` - Optimized image component
- `src/components/OptimizedList.js` - Optimized list component

---

## 🎨 **THEME & STYLING**

### Theme Configuration

- `src/context/ThemeContext.js` - Theme context provider (light/dark mode)
- `src/constants/colors.js` - Color palette and theme colors

### App Configuration

- `app.config.js` - Expo app configuration (icons, splash screens, themes)
- `App.js` - Main app entry point with theme providers

---

## 🖼️ **ASSETS** (Images & Icons)

### App Icons

- `assets/icon.png` - Main app icon
- `assets/adaptive-icon.png` - Android adaptive icon
- `assets/favicon.png` - Web favicon
- `assets/splash-icon.png` - Splash screen icon

---

## 🧭 **NAVIGATION**

- `src/navigation/AppNavigator.js` - Main navigation structure and routing

---

## 📐 **STYLING PATTERNS**

### Inline Styles

Most components use React Native's `StyleSheet.create()` for styling. Look for:

- `const styles = StyleSheet.create({...})` in component files
- Style props passed to components: `style={styles.container}`

### Theme Usage

Components access theme via:

- `useTheme()` hook from `ThemeContext`
- `theme.colors`, `theme.interactive`, etc.

### Color Constants

Colors are defined in:

- `src/constants/colors.js` - Centralized color definitions

---

## 🔍 **HOW TO FIND STYLING IN FILES**

### Search Patterns:

1. **StyleSheet usage:**

   ```bash
   grep -r "StyleSheet.create" src/
   ```

2. **Style references:**

   ```bash
   grep -r "styles\." src/
   ```

3. **Theme usage:**

   ```bash
   grep -r "useTheme\|theme\." src/
   ```

4. **Color usage:**
   ```bash
   grep -r "colors\." src/
   ```

---

## 📊 **FILE ORGANIZATION SUMMARY**

```
src/
├── screens/          (32 files) - All user-facing screens
├── components/       (30+ files) - Reusable UI components
│   ├── Card/         - Card components
│   ├── Chat/         - Chat UI components
│   ├── Common/        - Shared components
│   ├── Gamification/ - Game elements
│   ├── Layout/       - Layout components
│   ├── Profile/      - Profile UI
│   └── Slider/       - Form inputs
├── constants/
│   └── colors.js     - Color definitions
├── context/
│   └── ThemeContext.js - Theme management
├── navigation/
│   └── AppNavigator.js - Navigation structure
└── assets/           - Images and icons
```

---

## 🎯 **QUICK REFERENCE**

### To modify the app's visual appearance:

1. **Change colors:** Edit `src/constants/colors.js`
2. **Change theme behavior:** Edit `src/context/ThemeContext.js`
3. **Modify a screen:** Edit files in `src/screens/`
4. **Modify a component:** Edit files in `src/components/`
5. **Change app icon:** Replace files in `assets/`
6. **Change navigation:** Edit `src/navigation/AppNavigator.js`

### To add new visual features:

1. **New screen:** Create file in `src/screens/`
2. **New component:** Create file in `src/components/` (appropriate subfolder)
3. **New color:** Add to `src/constants/colors.js`
4. **New theme variant:** Extend `src/context/ThemeContext.js`

---

## 📝 **NOTES**

- All screens are React Native components using `StyleSheet` for styling
- Theme support is implemented via `ThemeContext` for light/dark mode
- Components follow a modular structure for reusability
- Images use optimized loading via `ProgressiveImage` and `OptimizedImage`
- Responsive design handled via `ResponsiveContainer` component

---

_Last updated: 2026-01-05_

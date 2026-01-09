# Refactoring Recommendations & Future Improvements

## Current Session Summary

### Files Refactored (Phase 2)
| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `HomeScreen.js` | 2,231 lines | 981 lines | **56%** |
| `DiscoveryScreen.js` | 2,231 lines | 985 lines | **56%** |
| `ExploreScreen.js` | 1,354 lines | 551 lines | **59%** |

### Files Created
- `src/features/discovery/screens/HomeScreen.styles.js` - Extracted styles
- `src/features/discovery/data/demoProfiles.js` - Shared demo profiles
- `src/services/index.js` - Services barrel export

### Duplicate Files Removed
- `src/components/Chat/AnimatedTypingIndicator.js` (duplicate of features version)
- `src/components/Chat/ChatThemes.js` (duplicate of features version)
- `src/components/Auth/AuthModal.js` (duplicate of features version)

---

## Recommended Refactoring (Priority Order)

### 1. HIGH PRIORITY - Large Files to Split

| File | Size | Recommendation |
|------|------|----------------|
| `AuthProvider.js` | 32KB | Extract auth logic into `useAuth` hook |
| `SafetyService.js` | 30KB | Split into `SafetyReportService`, `EmergencyContactService` |
| `ErrorBoundary.js` | 28KB | Extract error handling utilities |
| `EnhancedChatScreen.js` | 26KB | Extract chat logic into `useChat` hook |
| `MatchesScreen.js` | 22KB | Extract matching logic into `useMatches` hook |

### 2. MEDIUM PRIORITY - Service Consolidation

**AI Services** - Consider consolidating:
- `AIService.js` (5.8KB)
- `AIGatewayService.js` (5.1KB)
→ Merge into single `AIService.js` with gateway as internal implementation

**Profile Services** - Consider consolidating:
- `ProfileService.js` (8.8KB)
- `EnhancedProfileService.js` (2.7KB)
→ Merge into unified `ProfileService.js`

**Social Services** - Consider consolidating:
- `SocialFeaturesService.js` (5.8KB)
- `SocialMediaService.js` (2.0KB)
→ Merge into single `SocialService.js`

### 3. LOW PRIORITY - Code Quality

**Console.log Cleanup** (83 occurrences)
- Most are in utility files (logger.js, sentry.js) - acceptable
- Review `AnalyticsService.js` and `IAPService.js` for production logs

**Unused Exports**
- Run `npx depcheck` to identify unused dependencies
- Run `npx unimported` to find dead code

---

## Recommended New Features/Functions

### 1. Error Handling Improvements
```javascript
// Create: src/utils/errorBoundary.js
export const withErrorBoundary = (Component, fallback) => { ... }
export const useErrorHandler = () => { ... }
```

### 2. Loading State Management
```javascript
// Create: src/hooks/useAsyncState.js
export const useAsyncState = (asyncFn, deps) => {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  // ...unified loading/error/data handling
}
```

### 3. Form Validation Hook
```javascript
// Create: src/hooks/useFormValidation.js
export const useFormValidation = (schema) => {
  // Centralized form validation with Yup/Zod
}
```

### 4. Analytics Wrapper
```javascript
// Create: src/hooks/useAnalytics.js
export const useAnalytics = () => ({
  trackScreen: (name) => AnalyticsService.logScreenView(name),
  trackEvent: (name, params) => AnalyticsService.logEvent(name, params),
  trackError: (error) => AnalyticsService.logError(error),
});
```

### 5. Optimistic Updates Hook
```javascript
// Create: src/hooks/useOptimisticUpdate.js
export const useOptimisticUpdate = (mutationFn, rollbackFn) => {
  // Handle optimistic UI updates with automatic rollback
}
```

### 6. Cache Management
```javascript
// Create: src/services/CacheService.js
export const CacheService = {
  get: async (key) => { ... },
  set: async (key, value, ttl) => { ... },
  invalidate: async (pattern) => { ... },
  preload: async (keys) => { ... },
}
```

---

## Project Structure Improvements

### Current Structure (Improved)
```
src/
├── app/
│   ├── navigation/     ✓ Clean imports
│   ├── providers/      
│   └── screens/        ✓ Barrel exports
├── components/         → Consider moving to features/
├── features/
│   ├── auth/
│   ├── chat/
│   ├── discovery/      ✓ Refactored
│   ├── matching/
│   ├── premium/
│   ├── profile/
│   ├── safety/
│   └── settings/
├── hooks/              ✓ Barrel export exists
├── services/           ✓ Barrel export created
└── utils/              → Add barrel export
```

### Recommended Actions
1. **Create utils barrel export** - `src/utils/index.js`
2. **Move shared components** - `src/components/common/` → feature folders
3. **Add path aliases** - Configure `@/` imports in babel.config.js
4. **Standardize exports** - All files use named exports + default

---

## Testing Recommendations

### Current Coverage Gaps
1. Add integration tests for swipe flow
2. Add E2E tests for auth flow
3. Add unit tests for new hooks

### Suggested Test Files
- `src/__tests__/hooks/useSwipeActions.test.js`
- `src/__tests__/hooks/useDiscovery.test.js`
- `src/__tests__/integration/matchFlow.test.js`

---

## Performance Recommendations

1. **Lazy Load Screens** - Use React.lazy for non-critical screens
2. **Memoize Expensive Computations** - Add useMemo to filter/sort operations
3. **Image Optimization** - Ensure all images use FastImage or expo-image
4. **Bundle Analysis** - Run `npx react-native-bundle-visualizer`

---

## Next Steps (In Order)

1. ✅ Split `AuthProvider.js` - Extracted to `useAuthState` hook (`src/hooks/useAuthState.js`)
2. ✅ Split `SafetyService.js` - Modularized into `src/services/safety/`:
   - `BlockService.js` - Block/unblock users
   - `ReportService.js` - Report users and content
   - `EmergencyService.js` - SOS, contacts, check-ins
   - `DatePlanService.js` - Date plan management
3. ✅ Create `src/utils/index.js` barrel export - Updated with all utilities
4. ✅ Add path aliases to `babel.config.js` and `tsconfig.json`
5. ☐ Run `depcheck` and remove unused dependencies (ran - see output)
6. ☐ Add missing unit tests for hooks

---

## Session 3 Changes Summary

### New Files Created
| File | Purpose |
|------|---------|
| `src/hooks/useAuthState.js` | Core auth state management hook |
| `src/services/safety/BlockService.js` | Block/unblock user operations |
| `src/services/safety/ReportService.js` | Report user/content operations |
| `src/services/safety/EmergencyService.js` | SOS, emergency contacts, check-ins |
| `src/services/safety/DatePlanService.js` | Date plan sharing/management |
| `src/services/safety/index.js` | Safety services barrel export |

### Configuration Updates
| File | Change |
|------|--------|
| `babel.config.js` | Added module-resolver with `@/` path aliases |
| `tsconfig.json` | Updated paths to match babel aliases |
| `package.json` | Added `babel-plugin-module-resolver` dev dependency |

### Path Aliases Now Available
```javascript
import { useAuth } from '@/context/AuthContext';
import { api } from '@services/api';
import { useSwipeActions } from '@hooks/useSwipeActions';
import { Colors } from '@constants/colors';
```

---

*Updated: Session 3 - Dating App Refactoring*

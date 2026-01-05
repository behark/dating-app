# Upgrade Strategy & Roadmap

## Current Status (January 2026)

Based on `npm outdated`, your project has outdated dependencies. This document provides a prioritized upgrade path.

## Dependency Upgrade Roadmap

### Phase 1: Critical Updates (Do First)

These are necessary for security and stability.

| Package                   | Current | Latest  | Priority | Notes                                                |
| ------------------------- | ------- | ------- | -------- | ---------------------------------------------------- |
| `firebase`                | 10.13.0 | 12.7.0  | **HIGH** | 2 major versions behind; major APIs changed          |
| `react`                   | 18.3.1  | 19.2.3  | **HIGH** | 1 major version; breaking changes in hooks           |
| `react-native`            | 0.76.5  | 0.83.1  | **HIGH** | 7 minor versions; many bug fixes & perf improvements |
| `expo`                    | 54.0.30 | 54.0.30 | STABLE   | Already on latest patch                              |
| `react-native-reanimated` | 3.16.7  | 4.2.1   | **HIGH** | 1 major; significant perf improvements               |

### Phase 2: Navigation & State (After Phase 1)

| Package                          | Current | Latest | Priority   | Notes                                |
| -------------------------------- | ------- | ------ | ---------- | ------------------------------------ |
| `@react-navigation/native`       | 6.1.18  | 7.1.26 | **MEDIUM** | 1 major; breaking API changes        |
| `@react-navigation/native-stack` | 6.11.0  | 7.9.0  | **MEDIUM** | 1 major; requires react-navigation 7 |
| `@react-navigation/bottom-tabs`  | 6.6.1   | 7.9.0  | **MEDIUM** | 1 major; requires react-navigation 7 |

### Phase 3: Expo & Storage (After Phase 2)

| Package                                     | Current | Latest  | Priority   | Notes                                   |
| ------------------------------------------- | ------- | ------- | ---------- | --------------------------------------- |
| `expo-constants`                            | 17.0.3  | 18.0.12 | **MEDIUM** | 1 major; breaking changes in config API |
| `expo-image-picker`                         | 16.0.4  | 17.0.10 | **MEDIUM** | 1 major                                 |
| `expo-location`                             | 18.0.4  | 19.0.8  | **MEDIUM** | 1 major                                 |
| `expo-auth-session`                         | 6.0.0   | 7.0.10  | **MEDIUM** | 1 major                                 |
| `expo-web-browser`                          | 14.0.0  | 15.0.10 | **MEDIUM** | 1 major                                 |
| `@react-native-async-storage/async-storage` | 1.23.1  | 2.2.0   | **MEDIUM** | 1 major; breaking changes               |

### Phase 4: UI & Utilities (Final Polish)

| Package                          | Current | Latest | Priority | Notes                                         |
| -------------------------------- | ------- | ------ | -------- | --------------------------------------------- |
| `react-native-gesture-handler`   | 2.20.0  | 2.30.0 | **LOW**  | Minor version bump                            |
| `react-native-screens`           | 4.4.0   | 4.19.0 | **LOW**  | Minor version bump                            |
| `react-native-safe-area-context` | 4.14.0  | 5.6.2  | **LOW**  | 1 major but optional; backwards compat strong |
| `expo-linear-gradient`           | 14.0.1  | 15.0.8 | **LOW**  | 1 major                                       |
| `@expo/vector-icons`             | 14.0.0  | 15.0.3 | **LOW**  | 1 major                                       |

## Recommended Upgrade Order

### Step 1: Update Patch/Minor versions (Safe)

```bash
npm update
```

This updates all packages within their semver constraints.

### Step 2: Upgrade Major Versions (Guided)

```bash
# Phase 1 - Core dependencies
npm install --save react@latest react-dom@latest
npm install --save react-native@latest
npm install --save firebase@latest
npm install --save react-native-reanimated@latest

# Test mobile builds after Phase 1
npm run android  # or ios
npm run web

# Phase 2 - Navigation
npm install --save @react-navigation/native@latest
npm install --save @react-navigation/native-stack@latest
npm install --save @react-navigation/bottom-tabs@latest

# Phase 3 - Expo modules & storage
npm install --save expo-constants@latest
npm install --save expo-image-picker@latest
npm install --save expo-location@latest
npm install --save expo-auth-session@latest
npm install --save @react-native-async-storage/async-storage@latest

# Phase 4 - Polish
npm install --save react-native-gesture-handler@latest
npm install --save react-native-screens@latest
```

## Breaking Changes & Migration Guide

### React 19 (from 18.3.1)

- **Hooks Stable**: No major breaking changes, but new features in hooks API
- **Action**: Review React docs for deprecations; code likely works as-is

### React Native 0.83 (from 0.76.5)

- **CLI Changes**: Update build scripts
- **Hermes**: Enabled by default (performance benefit)
- **Action**: Run `npm install` and test thoroughly

### Firebase 12 (from 10.13)

- **SDK Modularization**: Continued; `getApps()` check already in place ✅
- **Deprecated APIs**: Some SDK imports may change
- **Action**: Update firebase.js imports; run tests

### React Navigation 7 (from 6.x)

- **Breaking**: Navigation state structure changed
- **Action**: Review [React Navigation 7 Migration Guide](https://reactnavigation.org/docs/migration-guide)
- **Testing**: Test all navigation flows (tabs, stacks, links)

### Reanimated 4 (from 3.16.7)

- **Breaking**: Some Worklet APIs changed
- **Babel Plugin**: Already in babel.config.js ✅
- **Action**: Check SwipeCard animations for compatibility

### AsyncStorage 2.x (from 1.23.1)

- **Breaking**: Some method signatures changed; mostly backwards compat
- **Action**: Test auth persistence flows

## Testing Checklist After Upgrades

- [ ] Mobile builds compile (`npm run android`, `npm run ios`)
- [ ] Web build works (`npm run web`, `npm run web:build`)
- [ ] Auth flows work (login, signup, logout)
- [ ] Navigation between screens works smoothly
- [ ] Animations (swipe card) are smooth and performant
- [ ] Image picker and location services work
- [ ] Firebase read/write operations succeed
- [ ] Error handling & error messages display correctly
- [ ] No console warnings or errors

## Performance Improvements to Expect

After these upgrades you should see:

- **Reanimated 4**: 30-50% faster animations
- **React Native 0.83**: Better GC, faster startup
- **React 19**: Improved reconciliation
- **New Expo SDKs**: Better module optimization

## Additional Recommendations

### 1. **TypeScript Migration** (Future)

Consider migrating to TypeScript for better type safety and developer experience.

```bash
npm install --save-dev typescript @types/react @types/react-native
```

### 2. **Code Splitting** (Performance)

Split large screens into smaller lazy-loaded components.

### 3. **Monitoring** (Production Readiness)

- Add Sentry for error tracking
- Add analytics (Firebase Analytics)
- Monitor performance with custom instrumentation

### 4. **Security Hardening**

- Keep dependencies updated with Renovate/Dependabot
- Run `npm audit fix` regularly
- Use environment variables properly (already set up ✅)

## Commands to Run Now

```bash
# Install new dev dependencies
npm install

# Initialize husky (git hooks)
npx husky install

# Run linter to check code
npm run lint

# Run tests
npm test

# Check formatting
npm run format:check

# Audit dependencies
npm audit
```

## References

- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- [React Native 0.83 Release](https://reactnative.dev/blog/2025/01/02/0.83-release)
- [Firebase JS SDK v12](https://firebase.google.com/docs/web/setup)
- [React Navigation 7 Migration](https://reactnavigation.org/docs/migration-guide)
- [Expo SDK 55 Docs](https://docs.expo.dev/)

---

**Created**: January 3, 2026  
**Next Review**: April 3, 2026 (Quarterly)

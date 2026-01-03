# Developer Quick Reference

## Common Commands

```bash
# Development
npm start                 # Start Expo dev server
npm run android          # Run on Android emulator/device
npm run ios              # Run on iOS simulator/device
npm run web              # Run web version

# Code Quality
npm run lint             # Check for code style issues
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes

# Testing
npm test                 # Run all tests once
npm run test:watch       # Watch mode (re-run on changes)
npm run test:coverage    # Generate coverage report

# Building
npm run build            # Build for web
npm run web:build        # Explicit web build

# Security & Maintenance
npm audit                # Check for vulnerabilities
npm audit:fix            # Auto-fix vulnerable dependencies
npm outdated             # See which packages need updating
npm update               # Update packages within version constraints
```

## Project Structure

```
dating-app/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/
│   │   ├── Card/
│   │   ├── Chat/
│   │   └── Profile/
│   ├── screens/             # Screen components
│   │   ├── ChatScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MatchesScreen.js
│   │   ├── ProfileScreen.js
│   │   └── ViewProfileScreen.js
│   ├── config/              # Configuration
│   │   └── firebase.js
│   ├── context/             # React Context
│   │   └── AuthContext.js
│   ├── navigation/          # Navigation setup
│   │   └── AppNavigator.js
│   ├── utils/               # Utility functions
│   └── __tests__/           # Test files
├── assets/                  # Static assets
├── App.js                   # Root component
├── index.js                 # Entry point
├── app.json                 # Expo config
├── babel.config.js          # Babel configuration
├── .eslintrc.json          # ESLint rules
├── .prettierrc.json        # Prettier config
├── jest.config.js          # Jest test config
├── jest.setup.js           # Jest setup/mocks
├── .github/workflows/       # CI/CD pipelines
├── .env.example            # Environment variables template
└── package.json            # Dependencies & scripts
```

## Key Configuration Files

### `app.json` (Expo Configuration)
- App name, version, icon, splash screen
- Environment variable definitions
- Platform-specific settings

### `firebase.js` (Firebase Setup)
- Firebase project initialization
- Auth, Firestore, Storage configuration
- Uses environment variables with fallbacks

### `AuthContext.js` (Authentication State)
- Global auth state management
- Login/signup/logout logic
- Persists auth session to AsyncStorage

### `AppNavigator.js` (Navigation)
- Tab-based navigation (Home, Matches, Chat, Profile)
- Stack navigation within tabs
- Auth screens (Login/Signup)

## Environment Variables

All public variables must use `EXPO_PUBLIC_` prefix:

```env
# Firebase (required)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Google OAuth (optional)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...

# Cloudinary (optional - but API_SECRET is private)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...              # Private, not in .env.example
CLOUDINARY_API_SECRET=...           # Private, not in .env.example
```

**Rule**: Only commit `.env.example` with placeholders, never `.env`.

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests
Place test files in `src/__tests__/` with `.test.js` extension:

```javascript
describe('Feature Name', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

**Mocked Dependencies**:
- `@react-native-async-storage/async-storage`
- `expo-constants`
- `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`

## Debugging

### Console Warnings
- ESLint configured to warn on `console.log` (use `console.warn` or `console.error` instead)
- Check `.eslintrc.json` for rules

### Mobile Debugging
```bash
# React Native Debugger
npm start
# Press 'd' in terminal to open debugger

# Chrome DevTools (web)
npm run web
# Open http://localhost:19006 and use browser DevTools
```

### Common Issues

**Firebase not initializing**:
- Check `EXPO_PUBLIC_FIREBASE_*` env vars are set
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

**AsyncStorage not persisting**:
- Ensure `jest.setup.js` mocks are configured for tests
- In production, AsyncStorage requires native modules

**Navigation not working**:
- Verify `AppNavigator.js` setup
- Check `AuthContext.js` for navigation context

## Git Workflow

### Pre-commit Hooks
Husky automatically runs before each commit:
1. **ESLint** - checks code style
2. **Prettier** - checks formatting

Fix issues before committing:
```bash
npm run lint:fix
npm run format
git add .
git commit -m "message"
```

### CI/CD Pipeline
GitHub Actions runs on every push/PR:
- Linting check
- Formatting check
- Security audit
- Test suite with coverage
- Web build verification

View results in GitHub Actions tab.

## Performance Tips

1. **Use React.memo** for expensive components
2. **Lazy load** screens/images with `React.lazy` or `expo-image`
3. **Optimize animations** with Reanimated worklets
4. **Profile** with React Profiler and Expo performance tools
5. **Code split** large features

## Security Best Practices

1. ✅ Keep dependencies updated (use `npm audit`)
2. ✅ Never commit `.env` file
3. ✅ Use `EXPO_PUBLIC_` only for public keys
4. ✅ Sanitize user input in Firebase rules
5. ✅ Enable Firebase Authentication rules
6. ✅ Set up Dependabot for auto-updates (GitHub Settings)

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) and [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for:
- Web deployment (Vercel, Netlify)
- Mobile app stores (App Store, Google Play)
- Firebase Hosting
- Environment variables setup

## Useful Links

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [React Navigation](https://reactnavigation.org/)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Jest Testing](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

**Last Updated**: January 3, 2026

# Development Setup & Workflow Guide

**Last Updated:** March 4, 2026  
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Local Setup](#local-setup)
4. [Running the Application](#running-the-application)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Code Quality](#code-quality)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- **Node.js** v16+ (check: `node --version`)
- **npm** v7+ (check: `npm --version`)
- **Git** (check: `git --version`)
- **Expo CLI** (`npm install -g expo-cli`)

### Optional Tools
- **Android Studio** (for Android emulator)
- **Xcode** (for iOS simulator - macOS only)
- **VS Code** with recommended extensions (see `.vscode/` folder)

### Accounts Required
- **Firebase** - Project credentials
- **Render.com** - For backend deployment
- **Vercel.com** - For frontend deployment
- **Expo.dev** - For mobile builds
- **GitHub** - For version control

---

## Project Structure

```
dating-app/
├── src/                      # Frontend React Native code
│   ├── app/                  # App-level setup, navigation
│   ├── features/             # Feature-based modules (auth, discovery, chat)
│   ├── components/           # Shared UI components
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   └── constants/            # App constants, themes
├── backend/                  # Backend Express API
│   ├── server.js             # Main server file
│   ├── routes/               # API endpoints
│   ├── controllers/          # Business logic
│   ├── middleware/           # Express middleware
│   ├── services/             # External service integrations
│   └── __tests__/            # Backend tests
├── tests/                    # Frontend tests
├── e2e/                      # End-to-end tests
├── docs/                     # Documentation
├── package.json              # Root dependencies
├── app.config.js             # Expo configuration
├── .env                      # Local environment variables
├── .gitignore                # Git ignore patterns
└── README.md                 # Project overview
```

---

## Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/dating-app.git
cd dating-app
```

### 2. Install Dependencies
```bash
# Root dependencies (frontend)
npm install --legacy-peer-deps

# Backend dependencies
cd backend && npm install && cd ..
```

### 3. Configure Environment Variables
```bash
# Copy example env file
cp .env.local.example .env

# Edit .env with your local configuration
nano .env  # or use your editor
```

**Required Variables for Local Development:**
```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Backend
EXPO_PUBLIC_API_URL=http://localhost:10000/api
EXPO_PUBLIC_BACKEND_URL=http://localhost:10000

# Google OAuth (get from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

### 4. Setup Backend Environment
```bash
cd backend

# Copy backend env template
cp .env.example .env.local

# Add to .env.local:
NODE_ENV=development
PORT=10000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dating-app-dev
# Add Firebase credentials
# Add other service credentials
```

### 5. Verify Setup
```bash
# Test frontend setup
npm run lint
npm test

# Test backend setup
cd backend && npm run lint && npm test
```

---

## Running the Application

### Option 1: Frontend Only (Web)
```bash
npm run web
# Opens http://localhost:8081
# Hot reload enabled - edit files and see changes instantly
```

### Option 2: Frontend + Local Backend
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run web
```

### Option 3: Mobile Development

**iOS (macOS only):**
```bash
npm run ios
# Opens iOS Simulator
# Press 'i' in Expo CLI to open in simulator
```

**Android:**
```bash
# Requires Android Studio & emulator running
npm run android
# Or: Press 'a' in Expo CLI
```

**Physical Device:**
```bash
npm run start
# Scan QR code with Expo Go app
# Make sure phone & computer on same WiFi
```

---

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Create feature folder**
   ```bash
   mkdir -p src/features/your-feature/screens
   mkdir -p src/features/your-feature/components
   mkdir -p src/features/your-feature/hooks
   ```

3. **Follow file naming conventions**
   - Components: `PascalCase.js` → `LoginForm.js`
   - Hooks: `camelCase.js` → `useAuth.js`
   - Constants: `CONSTANT_NAME` in `constants.js`
   - Tests: `FileName.test.js`

4. **Export from index.js**
   ```javascript
   // src/features/your-feature/index.js
   export { default as YourComponent } from './components/YourComponent';
   export { useYourHook } from './hooks/useYourHook';
   ```

5. **Write tests alongside code**
   ```bash
   npm test -- --watch
   ```

6. **Lint & format before committing**
   ```bash
   npm run lint:fix
   npm run format
   ```

7. **Create pull request**
   - Use descriptive title
   - Link related issues
   - Wait for CI/CD checks to pass

### Backend Feature Development

```bash
cd backend

# Start dev server with auto-reload
npm run dev

# Create new route file
# Follow controllers/middleware patterns

# Write tests
npm run test:watch

# Verify endpoints
curl http://localhost:10000/api/endpoint
```

---

## Testing

### Frontend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/features/auth/screens/LoginScreen.test.js

# Watch mode (re-run on file change)
npm test:watch

# Coverage report
npm run test:coverage
```

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Test specific controller
npm test -- controllers/authController.test.js

# Coverage report
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e:web

# Run specific test file
npm run test:e2e:web -- e2e/web/auth.spec.ts

# Debug mode
npx playwright test --debug

# UI mode (visual debugging)
npx playwright test --ui
```

### Test Script Reference
```bash
npm run test:backend           # Backend tests only
npm run test:coverage          # Full coverage report
npm run test:e2e:web           # Web E2E tests
npm run test:e2e:web:all       # All platform E2E tests
npm run test:e2e:mobile        # Mobile platform tests
npm run test:performance       # Performance tests
npm run test:responsive        # Responsive design tests
```

---

## Code Quality

### Linting
```bash
# Check code quality
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Backend linting
cd backend && npm run lint:fix
```

### Code Formatting
```bash
# Format all code files
npm run format

# Check formatting (no changes)
npm run format:check
```

### Type Checking
```bash
# TypeScript type checking
npm run type-check

# Watch mode
npm run type-check:watch
```

### Security Audit
```bash
# Check for vulnerabilities
npm audit

# Auto-fix common vulnerabilities
npm audit fix

# Snyk security scan
npm run snyk:test
```

---

## Common Tasks

### Adding a New Dependency
```bash
# Frontend
npm install package-name --save

# Backend
cd backend && npm install package-name --save

# Commit changes
git add package.json package-lock.json
git commit -m "feat: add package-name for feature-description"
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update minor versions only
npm update

# Check backend
cd backend && npm outdated && npm update
```

### Building for Production

**Web (Vercel-ready):**
```bash
npm run vercel-build
# Output: web-build/ directory
```

**Mobile:**
```bash
# Preview build
eas build --platform all --profile preview

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Database Seeding (Development)
```bash
cd backend
npm run seed
# Populates local MongoDB with test data
```

### Running Local Backend with Production Config
```bash
cd backend
NODE_ENV=development npm run dev
# Uses .env.local for configuration
```

---

## Troubleshooting

### Common Issues

**Issue: "Cannot find module" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Issue: Port 8081 already in use**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
expo start --dev-client --clear
```

**Issue: Firebase connection fails**
- Verify `.env` has correct FIREBASE_* variables
- Check Firebase project is accessible
- Ensure IP whitelist allows your computer

**Issue: Backend API timeout**
```bash
# Verify backend running
curl http://localhost:10000/health

# Check backend logs
cd backend && npm run dev
```

**Issue: Mobile simulator won't connect**
- Restart simulator/emulator
- Ensure WiFi on same network
- Clear Expo cache: `expo start --clear`

### Debug Mode

**Frontend:**
```bash
# Debug logs
console.log('DEBUG:', variable);

# Use React DevTools
expo start --dev-client
# Then press 'Shift+M' in terminal for menu

# React Native Debugger
# Download: https://github.com/jhen0409/react-native-debugger
react-native-debugger
```

**Backend:**
```bash
# Debug mode
NODE_DEBUG=http npm run dev

# Use Node debugger
node --inspect backend/server.js
# Then visit chrome://inspect

# View logs
npm run dev 2>&1 | tee debug.log
```

### Useful Commands Quick Reference

```bash
# Frontend
npm start                    # Start dev server
npm run web                  # Web version
npm run android             # Android version
npm test                    # Run tests
npm run lint:fix            # Fix linting
npm run format              # Format code

# Backend
cd backend && npm run dev    # Start server
npm test                    # Run tests
npm run seed                # Seed database
npm run lint:fix            # Fix linting

# Deployment
npm run vercel-build        # Build for Vercel
eas build --platform all    # Build mobile
npm run type-check          # Type safety check
```

---

## Getting Help

- **Documentation:** [docs/](../docs/)
- **Issues:** [GitHub Issues](https://github.com/your-username/dating-app/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/dating-app/discussions)
- **Deployment:** [docs/DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)

---

**Happy developing! 🚀**

# ⚡ Quick Command Reference

## 🚀 Get Started Now

```bash
# 1. Install new dev dependencies
npm install

# 2. Set up git hooks (Husky)
npx husky install

# 3. Verify setup (should all pass)
npm run lint           # Check code quality
npm run format:check   # Check formatting
npm test              # Run tests
npm audit             # Check for vulnerabilities
```

## 📋 Daily Development Commands

### Before Committing Code
```bash
# Fix linting issues automatically
npm run lint:fix

# Format code automatically
npm run format

# Run tests
npm test

# Then commit
git add .
git commit -m "your message"
```

### During Development
```bash
# Watch mode (re-run tests on changes)
npm run test:watch

# Continuous linting (if using IDE integration)
npm run lint
```

### Code Review / Before Merge
```bash
# Full quality check
npm run lint && npm run format:check && npm test

# Check dependencies
npm audit
npm outdated
```

## 🔄 Upgrade Commands (4-Phase Plan)

### Phase 1: Critical Dependencies (Week of Jan 3)
```bash
# Create upgrade branch
git checkout -b upgrade/phase-1-critical

# Install upgrades
npm install --save react@latest react-dom@latest
npm install --save react-native@latest
npm install --save firebase@latest
npm install --save react-native-reanimated@latest

# Verify
npm install
npm run lint:fix
npm test
npm run android   # or npm run ios
npm run web

# Commit
git add package*.json src/
git commit -m "upgrade: phase 1 - critical dependencies"
```

### Phase 2: Navigation (Week of Jan 10)
```bash
git checkout -b upgrade/phase-2-navigation

npm install --save \
  @react-navigation/native@latest \
  @react-navigation/native-stack@latest \
  @react-navigation/bottom-tabs@latest

npm install
npm run lint:fix && npm run format
npm test
npm run android && npm run web

git add package*.json src/
git commit -m "upgrade: phase 2 - react navigation 7"
```

### Phase 3: Expo Modules (Week of Jan 17)
```bash
git checkout -b upgrade/phase-3-expo-modules

npm install --save \
  expo-constants@latest \
  expo-image-picker@latest \
  expo-location@latest \
  expo-auth-session@latest \
  expo-web-browser@latest \
  expo-linear-gradient@latest \
  @react-native-async-storage/async-storage@latest

npm install
npm run lint:fix && npm run format
npm test
npm run android && npm run web

git add package*.json src/
git commit -m "upgrade: phase 3 - expo modules"
```

### Phase 4: Minor Updates (Week of Jan 24)
```bash
git checkout -b upgrade/phase-4-polish

npm update  # Updates within semver constraints

npm install
npm run lint:fix && npm run format
npm test
npm run build

git add package*.json
git commit -m "upgrade: phase 4 - minor version updates"
```

## 🧪 Testing Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (best for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
npm run test:coverage -- --coverage-reporters=text  # See in terminal

# Run specific test file
npm test -- firebase.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Firebase"
```

## 🔍 Code Quality Commands

```bash
# Check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format all code
npm run format

# Check for security vulnerabilities
npm audit

# Fix vulnerable dependencies
npm audit fix

# See which packages are outdated
npm outdated

# Update packages within constraints
npm update
```

## 🚢 Build & Deployment Commands

```bash
# Start development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator/device
npm run ios

# Run on web
npm run web

# Build for web
npm run build
npm run web:build  # Same thing

# Clean build
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentation Commands

```bash
# View implementation summary
cat IMPLEMENTATION_SUMMARY.md

# View upgrade roadmap
cat UPGRADE_ROADMAP.md

# View developer quick reference
cat DEVELOPER_GUIDE.md

# View architecture
cat ARCHITECTURE.md

# View next steps
cat POST_IMPLEMENTATION_CHECKLIST.md

# View setup completion
cat SETUP_COMPLETE.md
```

## 🔑 Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Edit with your Firebase credentials
nano .env
# or
code .env

# Verify Firebase setup
npm run start  # Should not error on Firebase init
```

## 🌳 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Work on code
npm run lint:fix && npm run format
npm test

# Commit (Husky will auto-run linting)
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature

# After PR review and CI passes
git checkout develop
git pull origin develop
git merge --squash feature/my-feature
git push origin develop

# Delete branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

## 🐛 Debugging Commands

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
rm -rf .expo

# Clear Jest cache
npm test -- --clearCache

# Check environment
npm start
# Press 'd' to open debugger

# Check what linting would do without changing
npm run lint -- --fix --dry-run

# See detailed error info
npm run lint -- --debug
```

## 📊 Performance Monitoring

```bash
# Build and measure
npm run build
# Check bundle size in dist/

# Run tests with profiling
npm test -- --detectOpenHandles

# Android profiling
npm run android
# In React Native debugger: Tools > Profiler

# Web profiling
npm run web
# Open Chrome DevTools > Performance tab
```

## 🔐 Security Commands

```bash
# Check for vulnerabilities
npm audit

# Fix low/medium vulnerabilities
npm audit fix

# Check for critical issues
npm audit --audit-level=high

# Update one package specifically
npm install --save [package-name]@latest

# Check for outdated packages
npm outdated

# Update all within constraints
npm update
```

## 🆘 Common Issues & Fixes

```bash
# Husky hooks not running
npx husky install

# Make hooks executable
chmod +x .husky/*

# ESLint not working
npm install  # Reinstall eslint

# Tests failing
npm test -- --clearCache && npm test

# Build failing
rm -rf dist/ && npm run build

# Node modules issues
rm -rf node_modules package-lock.json && npm install

# Port already in use (fix web dev server port)
npm start -- --port 19007  # Use different port

# Firebase initialization error
# Check: EXPO_PUBLIC_FIREBASE_API_KEY is set in .env
source .env
npm start
```

## 📖 Reference: npm Scripts in package.json

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm start` | Dev server | Development |
| `npm run android` | Android emulator | Mobile testing |
| `npm run ios` | iOS simulator | Mobile testing |
| `npm run web` | Web dev server | Web testing |
| `npm run build` | Build for web | Production web |
| `npm run lint` | Check code quality | Code review |
| `npm run lint:fix` | Auto-fix linting | Before commit |
| `npm run format` | Format code | Before commit |
| `npm run format:check` | Check formatting | CI pipeline |
| `npm test` | Run tests | Development |
| `npm run test:watch` | Watch mode tests | During development |
| `npm run test:coverage` | Coverage report | Before release |
| `npm audit` | Security check | Before push |
| `npm audit:fix` | Fix vulnerabilities | When vulnerabilities found |

## 🎯 Typical Daily Workflow

```bash
# Morning: Start work
git checkout -b feature/my-task
npm start                    # Start dev server

# During: Develop
# ... write code ...
npm run test:watch          # Keep tests running

# Before committing
npm run lint:fix            # Fix linting
npm run format              # Format code
npm test                    # All tests pass?

# Commit
git add .
git commit -m "feat: describe your change"

# Push and create PR
git push origin feature/my-task

# Afternoon: Code review & CI checks
# Wait for GitHub Actions to pass ✅
# (automated: eslint, prettier, jest, audit, build)

# Merge when approved
# [GitHub PR merge button]
```

## 📱 Multi-Platform Development

```bash
# Terminal 1: Start metro bundler
npm start

# Terminal 2: Development on Android
npm run android

# Terminal 3 (same as 2): Or development on iOS
npm run ios

# Terminal 4: Or development on web
npm run web

# All can run simultaneously pointing to same metro server
```

---

**Last Updated**: January 3, 2026  
**For Questions**: See relevant documentation in project root

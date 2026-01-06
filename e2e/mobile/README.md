# Mobile E2E Testing

This directory contains mobile E2E testing setup for iOS and Android.

## Setup Options

### Option 1: Maestro (Recommended for React Native)

Maestro is a modern mobile testing framework that works well with React Native apps.

**Installation:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Configuration:**
Create `maestro.yaml` files in this directory for iOS and Android flows.

### Option 2: Detox

Detox is another popular option for React Native E2E testing.

**Installation:**
```bash
npm install --save-dev detox
```

**Configuration:**
See `detox.config.js` for configuration details.

## Running Tests

### Maestro
```bash
maestro test e2e/mobile/ios/
maestro test e2e/mobile/android/
```

### Detox
```bash
npm run test:e2e:mobile:ios
npm run test:e2e:mobile:android
```

## Test Structure

- `ios/` - iOS-specific tests
- `android/` - Android-specific tests
- `shared/` - Shared test utilities

## Notes

Mobile E2E testing requires:
- iOS: Xcode and iOS Simulator
- Android: Android Studio and Android Emulator
- Physical devices can also be used

#!/bin/bash

# Android 15 Edge-to-Edge Compatibility Test Script
echo "Testing Android 15 edge-to-edge compatibility..."

# Clean any previous builds
echo "Cleaning previous builds..."
npx expo run:android --clean

# Build with verbose output to check for warnings
echo "Building Android app with edge-to-edge fix..."
npx eas build --platform android --profile production --verbose

# Check for deprecated API warnings in build output
echo "Build completed. Check for any remaining deprecated API warnings."

echo "If no deprecated API warnings appear, the fix is successful!"
echo "If warnings still appear, additional configuration may be needed."

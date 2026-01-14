#!/usr/bin/env bash
set -e

# Always skip husky install in CI/EAS build environments or if not in a git repo
# This prevents build failures when husky is not available
# Check for EAS build by looking at the working directory path or environment variables
if [ -n "$CI" ] || [ -n "$EAS_BUILD" ] || [ -n "$EXPO_PUBLIC_CI" ] || \
   [ "$(pwd | grep -o '/home/expo/workingdir' || true)" = "/home/expo/workingdir" ] || \
   [ ! -d ".git" ] 2>/dev/null; then
  echo "Skipping husky install (CI/EAS build environment detected)"
  exit 0
fi

# Try to run husky install, but don't fail if husky is not available
if command -v husky >/dev/null 2>&1 || [ -f "node_modules/.bin/husky" ] 2>/dev/null; then
  husky install 2>/dev/null || npx husky install 2>/dev/null || {
    echo "Husky install skipped (not available)"
    exit 0
  }
else
  echo "Husky not available, skipping install"
  exit 0
fi

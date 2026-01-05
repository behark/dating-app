#!/bin/bash

# Safe File Cleanup Script
# Removes files that are 100% safe to delete (no risk)
# 
# Rules Applied:
# - Do NOT remove tests
# - Do NOT remove configs
# - Do NOT remove migrations
# - Do NOT remove documentation
#
# Run with: bash scripts/cleanup-safe-files.sh

set -e

echo "🧹 Starting safe file cleanup..."
echo "📋 Rules: No tests, configs, migrations, or documentation will be removed"
echo ""

# Category 1: Coverage reports (regenerated on test)
if [ -d "coverage" ]; then
  echo "📊 Removing coverage reports (9.4MB) - can be regenerated..."
  rm -rf coverage/
  echo "✅ Removed coverage/"
else
  echo "ℹ️  coverage/ already removed"
fi

# Category 2: Preview HTML files
echo ""
echo "📄 Removing preview HTML files..."
PREVIEW_FILES=$(ls -1 preview-*.html 2>/dev/null || echo "")
if [ -n "$PREVIEW_FILES" ]; then
  for file in preview-*.html; do
    if [ -f "$file" ]; then
      rm "$file"
      echo "✅ Removed $file"
    fi
  done
else
  echo "ℹ️  No preview HTML files found"
fi

# Category 3: One-time fix scripts (already applied)
echo ""
echo "🔧 Removing one-time fix scripts (already applied)..."
ONE_TIME_SCRIPTS=(
  "scripts/fix-color-syntax.js"
  "scripts/fix-colors-import-paths.js"
  "scripts/fix-gradient-colors.js"
  "scripts/fix-remaining-colors.js"
  "scripts/replace-colors.js"
  "scripts/replace-console-statements.js"
  "scripts/replace-console.js"
)

for script in "${ONE_TIME_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    rm "$script"
    echo "✅ Removed $script"
  fi
done

# Category 4: Temporary env check files
echo ""
echo "🔍 Removing temporary env check files..."
TEMP_ENV_FILES=(
  ".env.check-current"
  ".env.vercel-check"
)

for file in "${TEMP_ENV_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "✅ Removed $file"
  fi
done

# Category 5: Temporary directory (if empty/old)
echo ""
echo "📁 Checking temporary directory..."
if [ -d "temp" ]; then
  if [ -z "$(ls -A temp 2>/dev/null)" ]; then
    rm -rf temp/
    echo "✅ Removed empty temp/ directory"
  else
    echo "⚠️  temp/ directory not empty - skipping (review manually)"
  fi
fi

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Coverage reports: Removed (~9.4MB saved)"
echo "  - Preview HTML files: Removed"
echo "  - One-time fix scripts: Removed"
echo "  - Temporary files: Removed"
echo ""
echo "💡 Next steps:"
echo "  - Review SAFE_TO_REMOVE_FILES.md for additional files to remove"
echo "  - Consider removing duplicate documentation (see Phase 2 in guide)"

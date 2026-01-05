#!/bin/bash

# Cleanup script to remove unnecessary files before pushing to Vercel

echo "🧹 Cleaning up files before push..."

# Remove backup files
echo "Removing backup files..."
find backend/controllers -name "*.backup.*" -type f -delete
echo "✅ Backup files removed"

# Remove temporary files
echo "Removing temporary files..."
find backend/controllers -name "*.tmp" -type f -delete
echo "✅ Temporary files removed"

# Remove test connection scripts
echo "Removing test scripts..."
rm -f backend/test-redis-connection.js
rm -f backend/test-mongodb-connection.js
echo "✅ Test scripts removed"

# Remove log files
echo "Removing log files..."
rm -f backend/server.log
rm -f frontend.log
rm -f ddagent-install.log
echo "✅ Log files removed"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Remaining untracked files:"
git status --short | grep "^??" | head -20

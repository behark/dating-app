#!/bin/bash

# Script to remove MongoDB credentials from git history
# WARNING: This rewrites git history. Make sure you've changed the password first!

echo "🚨 WARNING: This will rewrite git history!"
echo "⚠️  Make sure you've changed your MongoDB password FIRST!"
echo ""
read -p "Have you changed the MongoDB password? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Please change the MongoDB password first, then run this script again."
    exit 1
fi

echo ""
echo "🧹 Removing MongoDB credentials from git history..."

# Remove files containing credentials from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch MONGODB_CONNECTION_ISSUES.md ENV_VARS_SUMMARY.md 2>/dev/null || true" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up refs
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "⚠️  Next step: Force push to remote (this will rewrite remote history)"
echo "   git push origin --force --all"
echo ""
echo "⚠️  WARNING: Anyone who cloned the repo will need to re-clone after this!"

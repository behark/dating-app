#!/bin/bash

echo "🚀 Setting up GitHub and Vercel Deployment"
echo "=========================================="
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "📝 GitHub CLI authentication required"
    echo "Please run: gh auth login"
    echo ""
    read -p "Press Enter after you've authenticated with GitHub..."
fi

# Create GitHub repository
echo "📦 Creating GitHub repository..."
gh repo create dating-app --public --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Check if logged in to Vercel
    if ! vercel whoami &>/dev/null; then
        echo "🔐 Vercel authentication required"
        echo "Please run: vercel login"
        echo ""
        read -p "Press Enter after you've logged in to Vercel..."
    fi
    
    echo "🚀 Deploying to Vercel..."
    echo ""
    echo "⚠️  IMPORTANT: Before deploying, make sure to:"
    echo "   1. Update app.json with your Firebase credentials"
    echo "   2. Or set environment variables in Vercel dashboard"
    echo ""
    read -p "Press Enter to continue with deployment..."
    
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment complete!"
        echo "🎉 Your app is now live on Vercel!"
    else
        echo "❌ Deployment failed. Check the error messages above."
    fi
else
    echo "❌ Failed to create GitHub repository"
    echo "You can manually create it at: https://github.com/new"
    echo "Then run: git remote add origin <your-repo-url> && git push -u origin main"
fi

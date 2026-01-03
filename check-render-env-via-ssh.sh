#!/bin/bash

# Script to check Render environment variables via SSH
# Usage: ./check-render-env-via-ssh.sh

SERVICE_SSH="srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com"

echo "=========================================="
echo "Checking Render Environment Variables via SSH"
echo "=========================================="
echo ""
echo "Service SSH: $SERVICE_SSH"
echo ""
echo "Attempting to connect and check environment variables..."
echo ""

# Method 1: SSH and check process environment
echo "Method 1: Checking via SSH (process environment)"
echo "--------------------------------------------------"
ssh -o StrictHostKeyChecking=no $SERVICE_SSH "printenv | grep -E '^(MONGODB_URI|JWT_SECRET|ENCRYPTION_KEY|CORS_ORIGIN|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)' | sort" 2>&1

echo ""
echo "Method 2: Checking all environment variables (filtered)"
echo "--------------------------------------------------"
ssh -o StrictHostKeyChecking=no $SERVICE_SSH "printenv | sort" 2>&1 | head -50

echo ""
echo "Method 3: Checking via Node.js process"
echo "--------------------------------------------------"
ssh -o StrictHostKeyChecking=no $SERVICE_SSH "node -e 'console.log(JSON.stringify(process.env, null, 2))' | grep -E '(MONGODB|JWT|ENCRYPTION|CORS|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)'" 2>&1

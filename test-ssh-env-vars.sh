#!/bin/bash

# Script to test SSH and check environment variables
# Run this on your local machine (not in Cursor/AI environment)

SERVICE_SSH="srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com"

echo "=========================================="
echo "Testing SSH Connection to Render"
echo "=========================================="
echo ""
echo "Service: $SERVICE_SSH"
echo ""

# Test 1: Basic connection
echo "Test 1: Testing basic SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVICE_SSH "echo 'Connection successful!'" 2>&1; then
    echo "✅ SSH connection works!"
else
    echo "❌ SSH connection failed"
    exit 1
fi

echo ""

# Test 2: Check environment variables (filtered)
echo "Test 2: Checking environment variables..."
echo "----------------------------------------"
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVICE_SSH "printenv | grep -E '^(MONGODB_URI|JWT_SECRET|ENCRYPTION_KEY|CORS_ORIGIN|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE|AWS)' | sort" 2>&1

echo ""

# Test 3: Check all environment variables
echo "Test 3: All environment variables (first 50)..."
echo "----------------------------------------"
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVICE_SSH "printenv | sort | head -50" 2>&1

echo ""

# Test 4: Check via Node.js process
echo "Test 4: Checking via Node.js process.env..."
echo "----------------------------------------"
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVICE_SSH "node -e 'const env = process.env; Object.keys(env).filter(k => /MONGODB|JWT|ENCRYPTION|CORS|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE|AWS/i.test(k)).forEach(k => console.log(k + \"=\" + (env[k].length > 50 ? env[k].substring(0, 50) + \"...\" : env[k])))'" 2>&1

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

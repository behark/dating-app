#!/bin/bash

# Script to test deployment status

BACKEND_URL="https://dating-app-backend-x4yq.onrender.com"
FRONTEND_URL="https://dating-app-beharks-projects.vercel.app"

echo "=========================================="
echo "Testing Deployment Status"
echo "=========================================="
echo ""

echo "1. Testing Backend Health Endpoint..."
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend is UP (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo "❌ Backend is DOWN (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi

echo ""
echo "2. Testing Backend API - Register Endpoint..."
echo "----------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}' \
  -w "\nHTTP_CODE:%{http_code}" 2>&1)
REG_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
REG_BODY=$(echo "$REGISTER_RESPONSE" | grep -v "HTTP_CODE" | head -5)

if [ "$REG_HTTP_CODE" = "200" ] || [ "$REG_HTTP_CODE" = "201" ] || [ "$REG_HTTP_CODE" = "400" ]; then
    echo "✅ Register endpoint is responding (HTTP $REG_HTTP_CODE)"
    echo "Response: $REG_BODY"
else
    echo "❌ Register endpoint not working (HTTP $REG_HTTP_CODE)"
    echo "Response: $REG_BODY"
fi

echo ""
echo "3. Testing Backend API - Login Endpoint..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -w "\nHTTP_CODE:%{http_code}" 2>&1)
LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | grep -v "HTTP_CODE" | head -5)

if [ "$LOGIN_HTTP_CODE" = "200" ] || [ "$LOGIN_HTTP_CODE" = "401" ] || [ "$LOGIN_HTTP_CODE" = "400" ]; then
    echo "✅ Login endpoint is responding (HTTP $LOGIN_HTTP_CODE)"
    echo "Response: $LOGIN_BODY"
else
    echo "❌ Login endpoint not working (HTTP $LOGIN_HTTP_CODE)"
    echo "Response: $LOGIN_BODY"
fi

echo ""
echo "4. Testing Frontend..."
echo "----------------------------------------"
FRONTEND_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$FRONTEND_URL" 2>&1)
FRONTEND_HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is UP (HTTP $FRONTEND_HTTP_CODE)"
else
    echo "❌ Frontend is DOWN (HTTP $FRONTEND_HTTP_CODE)"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Backend Health: $([ "$HTTP_CODE" = "200" ] && echo "✅ UP" || echo "❌ DOWN")"
echo "Backend Register: $([ "$REG_HTTP_CODE" = "200" ] || [ "$REG_HTTP_CODE" = "201" ] || [ "$REG_HTTP_CODE" = "400" ] && echo "✅ Working" || echo "❌ Not Working")"
echo "Backend Login: $([ "$LOGIN_HTTP_CODE" = "200" ] || [ "$LOGIN_HTTP_CODE" = "401" ] || [ "$LOGIN_HTTP_CODE" = "400" ] && echo "✅ Working" || echo "❌ Not Working")"
echo "Frontend: $([ "$FRONTEND_HTTP_CODE" = "200" ] && echo "✅ UP" || echo "❌ DOWN")"
echo ""

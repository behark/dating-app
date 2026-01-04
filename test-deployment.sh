#!/bin/bash

# Dating App Deployment Test Script
# Tests both frontend and backend connectivity

echo "🧪 Testing Dating App Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="https://dating-app-backend-x4yq.onrender.com"
FRONTEND_URL="https://dating-3cf0mb0ca-beharks-projects.vercel.app"

# Test 1: Backend Health Check
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Backend API endpoints
echo "2️⃣  Testing Backend API Routes..."
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/api/auth/health" 2>&1)
HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Auth health endpoint not found (this is OK)${NC}"
else
    echo -e "${GREEN}✅ API routes are accessible${NC}"
fi
echo ""

# Test 3: Frontend Accessibility
echo "3️⃣  Testing Frontend Deployment..."
FRONTEND_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -I "$FRONTEND_URL" | grep "HTTP")
if echo "$FRONTEND_RESPONSE" | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
    echo "   URL: $FRONTEND_URL"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
    echo "   Response: $FRONTEND_RESPONSE"
fi
echo ""

# Test 4: CORS Configuration
echo "4️⃣  Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" -X OPTIONS "$BACKEND_URL/api/auth/login" -I | grep -i "access-control")
if [ ! -z "$CORS_TEST" ]; then
    echo -e "${GREEN}✅ CORS is configured${NC}"
    echo "   $CORS_TEST"
else
    echo -e "${YELLOW}⚠️  CORS headers not visible (may still work)${NC}"
fi
echo ""

# Test 5: Environment Variables
echo "5️⃣  Checking Critical Configuration..."
echo "   Backend URL: $BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo ""

# Test 6: Try a simple API call
echo "6️⃣  Testing API Authentication Endpoint..."
LOGIN_TEST=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}' \
    -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_TEST" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Auth endpoint is working (validation working)${NC}"
    echo "   Status: $HTTP_CODE (expected for invalid credentials)"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}❌ Server error - check backend logs${NC}"
    echo "$LOGIN_TEST" | grep -v "HTTP_CODE"
else
    echo -e "${YELLOW}⚠️  Unexpected response: $HTTP_CODE${NC}"
    echo "$LOGIN_TEST" | grep -v "HTTP_CODE"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo ""
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "Next Steps:"
echo "1. Open frontend URL in browser"
echo "2. Try signing up with email/password"
echo "3. Check browser console (F12) for errors"
echo "4. Check Render logs for backend errors"
echo ""
echo "🎉 Deployment test complete!"

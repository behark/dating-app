#!/bin/bash
# Security Audit Script for Node.js/Express Backend
# Run this before deploying to production

set -e

echo "🔒 Security Audit for Dating App Backend"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0
WARNINGS=0

# 1. Check for Helmet security headers
echo "1️⃣  Checking Security Headers (Helmet)..."
if grep -q "helmet" backend/server.js && grep -q "app.use(helmet" backend/server.js; then
    echo -e "${GREEN}✓ Helmet is configured${NC}"
else
    echo -e "${RED}✗ Helmet is NOT configured or not applied${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. Check for Rate Limiting
echo "2️⃣  Checking Rate Limiting..."
if grep -q "rateLimiter\|apiLimiter\|dynamicRateLimiter" backend/server.js || \
   grep -q "rateLimiter\|apiLimiter" backend/routes/*.js 2>/dev/null; then
    echo -e "${GREEN}✓ Rate limiting middleware exists${NC}"
    echo -e "${YELLOW}⚠  Note: Verify rate limiting is applied to all routes${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗ Rate limiting is NOT configured${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 3. Check CORS configuration
echo "3️⃣  Checking CORS Configuration..."
if grep -q "cors" backend/server.js && grep -q "app.use(cors" backend/server.js; then
    echo -e "${GREEN}✓ CORS is configured${NC}"
    # Check if origins are restrictive
    if grep -q "process.env.CORS_ORIGIN\|process.env.FRONTEND_URL" backend/server.js; then
        echo -e "${GREEN}✓ CORS uses environment variables (good)${NC}"
    else
        echo -e "${YELLOW}⚠  CORS may have hardcoded origins - check server.js${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ CORS is NOT configured${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 4. Check for hardcoded secrets
echo "4️⃣  Checking for Hardcoded Secrets..."
echo "   Scanning for potential secrets..."

# Check for hardcoded MongoDB URIs
if grep -r "mongodb://.*@" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1" | grep -v "example.com" | grep -v ".env.example" | grep -v "test" | grep -v "localhost:27017" > /dev/null; then
    echo -e "${RED}✗ Found potential hardcoded MongoDB URI${NC}"
    grep -r "mongodb://.*@" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1" | grep -v "example.com" | grep -v ".env.example" | grep -v "test" | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ No hardcoded MongoDB URIs found${NC}"
fi

# Check for hardcoded JWT secrets
if grep -r "jwt.*secret.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env" | grep -v "test" | grep -v "example" > /dev/null; then
    echo -e "${RED}✗ Found potential hardcoded JWT secrets${NC}"
    grep -r "jwt.*secret.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env" | grep -v "test" | grep -v "example" | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ No hardcoded JWT secrets found${NC}"
fi

# Check for hardcoded API keys
if grep -r "api.*key.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env" | grep -v "test" | grep -v "example" | grep -v "your_api_key" > /dev/null; then
    echo -e "${RED}✗ Found potential hardcoded API keys${NC}"
    grep -r "api.*key.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env" | grep -v "test" | grep -v "example" | grep -v "your_api_key" | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ No hardcoded API keys found${NC}"
fi
echo ""

# 5. Check error handling
echo "5️⃣  Checking Error Handling..."
# Check if errors return stack traces
if grep -r "res\.status.*json.*error.*stack" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env.NODE_ENV.*development" > /dev/null; then
    echo -e "${RED}✗ Found error responses that may leak stack traces${NC}"
    grep -r "res\.status.*json.*error.*stack" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage 2>/dev/null | grep -v "process.env.NODE_ENV.*development" | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ Error handling looks secure (no stack traces in production)${NC}"
fi

# Check for console.log with sensitive data
if grep -r "console\.\(log\|error\|warn\).*password\|console\.\(log\|error\|warn\).*token\|console\.\(log\|error\|warn\).*secret" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage -i 2>/dev/null | grep -v "test" | grep -v "example" > /dev/null; then
    echo -e "${YELLOW}⚠  Found console.log statements that may log sensitive data${NC}"
    grep -r "console\.\(log\|error\|warn\).*password\|console\.\(log\|error\|warn\).*token\|console\.\(log\|error\|warn\).*secret" backend/ --include="*.js" --exclude-dir=node_modules --exclude-dir=coverage -i 2>/dev/null | grep -v "test" | grep -v "example" | head -5
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No obvious sensitive data in console logs${NC}"
fi
echo ""

# 6. Check environment variables
echo "6️⃣  Checking Environment Variables..."
if [ -f "backend/.env.example" ]; then
    echo -e "${GREEN}✓ .env.example file exists${NC}"
    # Check if .env is in .gitignore
    if grep -q "\.env$" .gitignore 2>/dev/null || grep -q "\.env$" backend/.gitignore 2>/dev/null; then
        echo -e "${GREEN}✓ .env is in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠  .env may not be in .gitignore${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠  .env.example file not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for required env vars in code
REQUIRED_VARS=("JWT_SECRET" "MONGODB_URI" "NODE_ENV")
for var in "${REQUIRED_VARS[@]}"; do
    if grep -r "process\.env\.$var" backend/ --include="*.js" --exclude-dir=node_modules 2>/dev/null | head -1 > /dev/null; then
        echo -e "${GREEN}✓ $var is used from environment${NC}"
    else
        echo -e "${YELLOW}⚠  $var may not be configured${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# 7. Check for PM2 configuration
echo "7️⃣  Checking Process Management (PM2)..."
if [ -f "ecosystem.config.js" ] || [ -f "backend/ecosystem.config.js" ] || [ -f "pm2.config.js" ]; then
    echo -e "${GREEN}✓ PM2 configuration file found${NC}"
else
    echo -e "${YELLOW}⚠  PM2 configuration file not found${NC}"
    echo "   Consider creating ecosystem.config.js for production"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Audit Summary"
echo "=========================================="
echo -e "Issues found: ${RED}$ISSUES${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠  Some warnings found, but no critical issues${NC}"
    exit 0
else
    echo -e "${RED}❌ Critical issues found. Please fix before deploying.${NC}"
    exit 1
fi

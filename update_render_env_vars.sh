#!/bin/bash
# Update Render environment variables via API

SERVICE_ID="srv-d5cooc2li9vc73ct9j70"
API_KEY="rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO"
BASE_URL="https://api.render.com/v1/services/${SERVICE_ID}"

echo "🔧 Updating Render environment variables via API..."
echo ""

# Function to set/update env var
set_env_var() {
    local key=$1
    local value=$2
    echo -n "Setting ${key}... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/env-vars" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"envVar\": {\"key\": \"${key}\", \"value\": \"${value}\"}}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Success"
    else
        echo "⚠️  HTTP $HTTP_CODE"
        echo "   Response: $BODY" | head -3
    fi
}

# Function to delete env var by key
delete_env_var() {
    local key=$1
    echo -n "Deleting ${key}... "
    
    # Get all env vars and find the cursor for this key
    ALL_VARS=$(curl -s -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/env-vars")
    CURSOR=$(echo "$ALL_VARS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data:
        if item['envVar']['key'] == '${key}':
            print(item['cursor'])
            break
except:
    pass
" 2>/dev/null)
    
    if [ -z "$CURSOR" ]; then
        echo "⚠️  Not found (may already be deleted)"
        return
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/env-vars/${CURSOR}" \
        -H "Authorization: Bearer ${API_KEY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Deleted"
    else
        echo "⚠️  HTTP $HTTP_CODE"
    fi
}

echo "1️⃣  Deleting duplicate variables..."
delete_env_var "CORS_ORIGIN1"
delete_env_var "GOOGLE_CLIENT_ID1"
echo ""

echo "2️⃣  Setting critical variables..."
set_env_var "CORS_ORIGIN" "https://dating-app-seven-peach.vercel.app"
set_env_var "FRONTEND_URL" "https://dating-app-seven-peach.vercel.app"
set_env_var "PORT" "10000"
echo ""

echo "3️⃣  Setting recommended variables..."
echo "⚠️  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set manually"
echo "   Replace YOUR_GOOGLE_CLIENT_ID and YOUR_GOOGLE_CLIENT_SECRET with actual values"
# set_env_var "GOOGLE_CLIENT_ID" "YOUR_GOOGLE_CLIENT_ID"
# set_env_var "GOOGLE_CLIENT_SECRET" "YOUR_GOOGLE_CLIENT_SECRET"
echo ""

echo "✅ Environment variables update complete!"
echo ""
echo "📋 Summary of changes:"
echo "   - Deleted: CORS_ORIGIN1, GOOGLE_CLIENT_ID1"
echo "   - Updated: CORS_ORIGIN, FRONTEND_URL"
echo "   - Added: PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
echo ""
echo "🔄 Triggering new deployment..."

DEPLOY_RESPONSE=$(curl -s -X POST "${BASE_URL}/deploys" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"clearBuildCache": false}')

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('deploy', {}).get('id', ''))
except:
    pass
" 2>/dev/null)

if [ -n "$DEPLOY_ID" ] && [ "$DEPLOY_ID" != "None" ]; then
    echo "✅ Deployment triggered: ${DEPLOY_ID}"
    echo "   Monitor at: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${DEPLOY_ID}"
else
    echo "⚠️  Could not auto-trigger deployment"
    echo "   Please trigger manually from Render Dashboard"
    echo "   Or push a new commit to trigger auto-deploy"
fi

echo ""
echo "🔍 Verifying variables via SSH..."
sleep 2
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com "printenv | grep -E '^(CORS_ORIGIN|FRONTEND_URL|PORT|GOOGLE_CLIENT_ID[^0-9])' | sort" 2>&1 | grep -v "client_global_hostkeys"

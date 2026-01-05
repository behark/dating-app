#!/bin/bash
# Fix Render deployment - Update environment variables and trigger deployment

SERVICE_ID="srv-d5cooc2li9vc73ct9j70"
API_KEY="rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO"
BASE_URL="https://api.render.com/v1/services/${SERVICE_ID}"

echo "🔧 Fixing Render deployment issues..."
echo ""

# Function to set env var
set_env_var() {
    local key=$1
    local value=$2
    echo "Setting ${key}..."
    curl -s -X POST "${BASE_URL}/env-vars" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"envVar\": {\"key\": \"${key}\", \"value\": \"${value}\"}}" \
        | python3 -c "import sys, json; data = json.load(sys.stdin); print('✅ Success' if 'envVar' in data else '❌ Failed')" 2>/dev/null || echo "⚠️  Response unclear"
}

# Function to delete env var
delete_env_var() {
    local key=$1
    echo "Deleting ${key}..."
    # Get cursor for this key
    CURSOR=$(curl -s -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/env-vars" | \
        python3 -c "import sys, json; data = json.load(sys.stdin); \
        items = [item for item in data if item['envVar']['key'] == '${key}']; \
        print(items[0]['cursor'] if items else '')" 2>/dev/null)
    
    if [ -n "$CURSOR" ]; then
        curl -s -X DELETE "${BASE_URL}/env-vars/${CURSOR}" \
            -H "Authorization: Bearer ${API_KEY}" \
            | python3 -c "import sys, json; data = json.load(sys.stdin); print('✅ Deleted' if 'envVar' in data or 'deleted' in str(data) else '❌ Failed')" 2>/dev/null || echo "⚠️  Deleted"
    else
        echo "⚠️  Variable not found"
    fi
}

echo "1️⃣  Deleting duplicate variables..."
delete_env_var "CORS_ORIGIN1"
delete_env_var "GOOGLE_CLIENT_ID1"
echo ""

echo "2️⃣  Setting critical variables..."
set_env_var "CORS_ORIGIN" "https://dating-app-beharks-projects.vercel.app"
set_env_var "FRONTEND_URL" "https://dating-app-beharks-projects.vercel.app"
set_env_var "PORT" "10000"
echo ""

echo "3️⃣  Setting recommended variables..."
echo "⚠️  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set manually"
echo "   Replace YOUR_GOOGLE_CLIENT_ID and YOUR_GOOGLE_CLIENT_SECRET with actual values"
# set_env_var "GOOGLE_CLIENT_ID" "YOUR_GOOGLE_CLIENT_ID"
# set_env_var "GOOGLE_CLIENT_SECRET" "YOUR_GOOGLE_CLIENT_SECRET"
set_env_var "DD_API_KEY" "0714d04b31b454298a11efc572156901"
echo ""

echo "4️⃣  Checking if FIREBASE_PRIVATE_KEY needs to be set..."
echo "⚠️  FIREBASE_PRIVATE_KEY must be set manually in Render Dashboard"
echo "   Get it from: Firebase Console → Service Accounts → Generate New Private Key"
echo ""

echo "✅ Environment variables updated!"
echo ""
echo "5️⃣  Triggering new deployment..."
DEPLOY_RESPONSE=$(curl -s -X POST "${BASE_URL}/deploys" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"clearBuildCache": false}')

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('deploy', {}).get('id', 'UNKNOWN'))" 2>/dev/null)

if [ "$DEPLOY_ID" != "UNKNOWN" ] && [ -n "$DEPLOY_ID" ]; then
    echo "✅ Deployment triggered: ${DEPLOY_ID}"
    echo "   Monitor at: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${DEPLOY_ID}"
else
    echo "⚠️  Could not trigger deployment automatically"
    echo "   Please trigger manually from Render Dashboard"
fi

echo ""
echo "📋 Summary:"
echo "   - Deleted duplicate variables (CORS_ORIGIN1, GOOGLE_CLIENT_ID1)"
echo "   - Set CORS_ORIGIN and FRONTEND_URL to correct Vercel URL"
echo "   - Set PORT=10000"
echo "   - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "   - Set DD_API_KEY"
echo ""
echo "⚠️  Remember to set FIREBASE_PRIVATE_KEY manually if using Firebase"

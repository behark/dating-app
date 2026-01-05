#!/bin/bash
# Fix Render environment variables

SERVICE_ID="srv-d5cooc2li9vc73ct9j70"
API_KEY="rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO"
API_URL="https://api.render.com/v1/services/${SERVICE_ID}/env-vars"

echo "🔍 Checking current environment variables..."

# Get all env vars
ALL_VARS=$(curl -s -H "Authorization: Bearer ${API_KEY}" "${API_URL}")

# Check what's set
echo "Current CORS_ORIGIN:"
echo "$ALL_VARS" | python3 -c "import sys, json; data = json.load(sys.stdin); vars = {item['envVar']['key']: item['envVar']['value'] for item in data}; print(vars.get('CORS_ORIGIN', 'NOT SET'))"

echo "Current FRONTEND_URL:"
echo "$ALL_VARS" | python3 -c "import sys, json; data = json.load(sys.stdin); vars = {item['envVar']['key']: item['envVar']['value'] for item in data}; print(vars.get('FRONTEND_URL', 'NOT SET'))"

echo "Current FIREBASE_PRIVATE_KEY:"
echo "$ALL_VARS" | python3 -c "import sys, json; data = json.load(sys.stdin); vars = {item['envVar']['key']: item['envVar']['value'] for item in data}; key = vars.get('FIREBASE_PRIVATE_KEY', 'NOT SET'); print('SET' if key != 'NOT SET' and len(key) > 50 else 'NOT SET')"

echo ""
echo "✅ Critical variables check:"
echo "$ALL_VARS" | python3 -c "import sys, json; data = json.load(sys.stdin); vars = {item['envVar']['key']: item['envVar']['value'] for item in data}; print('MONGODB_URI:', '✅ SET' if 'MONGODB_URI' in vars else '❌ MISSING'); print('HASH_SALT:', '✅ SET' if 'HASH_SALT' in vars else '❌ MISSING'); print('PORT:', '✅ SET' if 'PORT' in vars else '❌ MISSING')"

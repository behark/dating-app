#!/bin/bash
# Script to add missing Firebase variables to Render using API

API_KEY="rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO"
SERVICE_ID="srv-d5cooc2li9vc73ct9j70"
API_URL="https://api.render.com/v1"

# Read Firebase values from JSON
FIREBASE_JSON="/home/behar/Downloads/my-project-de65d-firebase-adminsdk-fbsvc-6c1f815a0d.json"

if [ ! -f "$FIREBASE_JSON" ]; then
    echo "❌ Firebase JSON file not found: $FIREBASE_JSON"
    exit 1
fi

# Extract values using Python
FIREBASE_PROJECT_ID=$(python3 -c "import json; print(json.load(open('$FIREBASE_JSON'))['project_id'])" 2>/dev/null)
FIREBASE_CLIENT_EMAIL=$(python3 -c "import json; print(json.load(open('$FIREBASE_JSON'))['client_email'])" 2>/dev/null)
FIREBASE_PRIVATE_KEY=$(python3 -c "import json; print(json.load(open('$FIREBASE_JSON'))['private_key'])" 2>/dev/null)

echo "🔧 Adding Firebase environment variables to Render..."
echo ""

# Add FIREBASE_PROJECT_ID
echo "Adding FIREBASE_PROJECT_ID..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"key\": \"FIREBASE_PROJECT_ID\", \"value\": \"$FIREBASE_PROJECT_ID\"}" \
  "${API_URL}/services/${SERVICE_ID}/env-vars" | python3 -m json.tool

# Add FIREBASE_CLIENT_EMAIL
echo ""
echo "Adding FIREBASE_CLIENT_EMAIL..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"key\": \"FIREBASE_CLIENT_EMAIL\", \"value\": \"$FIREBASE_CLIENT_EMAIL\"}" \
  "${API_URL}/services/${SERVICE_ID}/env-vars" | python3 -m json.tool

# Add FIREBASE_PRIVATE_KEY (need to escape newlines)
echo ""
echo "Adding FIREBASE_PRIVATE_KEY..."
# Escape the private key for JSON
ESCAPED_KEY=$(echo "$FIREBASE_PRIVATE_KEY" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"key\": \"FIREBASE_PRIVATE_KEY\", \"value\": $ESCAPED_KEY}" \
  "${API_URL}/services/${SERVICE_ID}/env-vars" | python3 -m json.tool

echo ""
echo "✅ Done! Service will automatically redeploy."

#!/bin/bash
# Script to check Render environment variables

API_KEY="rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO"
API_URL="https://api.render.com/v1"

echo "🔍 Checking Render Services..."
echo ""

# Get all services
SERVICES=$(curl -s -H "Authorization: Bearer $API_KEY" "${API_URL}/services")
SERVICE_ID=$(echo "$SERVICES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for service in data:
    if 'dating-app-backend' in service.get('name', '').lower() or 'backend' in service.get('name', '').lower():
        print(service['id'])
        break
" 2>/dev/null)

if [ -z "$SERVICE_ID" ]; then
    echo "❌ Could not find dating-app-backend service"
    echo "Available services:"
    echo "$SERVICES" | python3 -c "import sys, json; [print(f\"  - {s['name']} (ID: {s['id']})\") for s in json.load(sys.stdin)]" 2>/dev/null
    exit 1
fi

echo "✅ Found service ID: $SERVICE_ID"
echo ""
echo "📋 Fetching environment variables..."
echo ""

# Get environment variables
ENV_VARS=$(curl -s -H "Authorization: Bearer $API_KEY" "${API_URL}/services/${SERVICE_ID}/env-vars")

# Parse and display
echo "$ENV_VARS" | python3 << 'PYTHON_SCRIPT'
import sys, json

try:
    data = json.load(sys.stdin)
    
    if not data:
        print("❌ No environment variables found")
        sys.exit(1)
    
    # Required variables checklist
    required = {
        'SENTRY_DSN': 'Sentry Error Monitoring',
        'DD_API_KEY': 'Datadog APM',
        'DD_SITE': 'Datadog Site',
        'DD_ENV': 'Datadog Environment',
        'FIREBASE_PROJECT_ID': 'Firebase Project',
        'FIREBASE_PRIVATE_KEY': 'Firebase Private Key',
        'FIREBASE_CLIENT_EMAIL': 'Firebase Client Email',
        'MONGODB_URI': 'MongoDB Connection',
        'JWT_SECRET': 'JWT Secret',
        'NODE_ENV': 'Node Environment',
        'PORT': 'Server Port',
    }
    
    # Get all env vars
    env_vars = {}
    for item in data:
        key = item.get('key', '')
        value = item.get('value', '')
        env_vars[key] = value
    
    print("=" * 70)
    print("ENVIRONMENT VARIABLES STATUS")
    print("=" * 70)
    print()
    
    # Check required variables
    missing = []
    present = []
    
    for key, description in required.items():
        if key in env_vars:
            value = env_vars[key]
            if value:
                # Mask sensitive values
                if 'SECRET' in key or 'KEY' in key or 'PRIVATE' in key or 'PASSWORD' in key or 'URI' in key:
                    display_value = value[:20] + "..." if len(value) > 20 else "***"
                else:
                    display_value = value
                print(f"✅ {key:30} = {display_value}")
                present.append(key)
            else:
                print(f"⚠️  {key:30} = (empty)")
                missing.append(key)
        else:
            print(f"❌ {key:30} = (MISSING)")
            missing.append(key)
    
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✅ Present: {len(present)}/{len(required)}")
    print(f"❌ Missing: {len(missing)}/{len(required)}")
    
    if missing:
        print()
        print("Missing variables:")
        for key in missing:
            print(f"  - {key}")
    
    print()
    print("=" * 70)
    print("ALL ENVIRONMENT VARIABLES")
    print("=" * 70)
    for key in sorted(env_vars.keys()):
        value = env_vars[key]
        if 'SECRET' in key or 'KEY' in key or 'PRIVATE' in key or 'PASSWORD' in key or 'URI' in key:
            display_value = "***" + value[-10:] if len(value) > 10 else "***"
        else:
            display_value = value
        print(f"{key:30} = {display_value}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Raw response:")
    print(data)
    sys.exit(1)
PYTHON_SCRIPT

#!/bin/bash
# Verify Render environment and provide fix instructions

SERVICE_ID="srv-d5cooc2li9vc73ct9j70"
SSH_HOST="srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com"

echo "🔍 Checking Render environment variables..."
echo ""

# Check current values via SSH
echo "Current values from running service:"
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_HOST" \
    "printenv | grep -E '^(CORS_ORIGIN|FRONTEND_URL|PORT|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|HASH_SALT|MONGODB_URI)' | sort" \
    2>&1 | grep -v "client_global_hostkeys" | while IFS='=' read -r key value; do
    case "$key" in
        CORS_ORIGIN)
            if [[ "$value" == *"dating-app-beharks-projects"* ]]; then
                echo "  ✅ $key = $value"
            else
                echo "  ❌ $key = $value (should be: https://dating-app-beharks-projects.vercel.app)"
            fi
            ;;
        FRONTEND_URL)
            if [[ "$value" == *"dating-app-beharks-projects"* ]]; then
                echo "  ✅ $key = $value"
            else
                echo "  ❌ $key = $value (should be: https://dating-app-beharks-projects.vercel.app)"
            fi
            ;;
        PORT)
            if [[ "$value" == "10000" ]]; then
                echo "  ✅ $key = $value"
            else
                echo "  ⚠️  $key = $value (should be: 10000)"
            fi
            ;;
        *)
            if [ -n "$value" ]; then
                echo "  ✅ $key = [SET]"
            else
                echo "  ❌ $key = [NOT SET]"
            fi
            ;;
    esac
done

echo ""
echo "📋 Summary:"
echo ""
echo "✅ Code fixes: Applied (server.js, MonitoringService.js, instrument.js)"
echo "✅ render.yaml: Updated with correct values"
echo ""
echo "⚠️  Manual action required:"
echo "   Update these 2 variables in Render Dashboard:"
echo "   1. CORS_ORIGIN → https://dating-app-beharks-projects.vercel.app"
echo "   2. FRONTEND_URL → https://dating-app-beharks-projects.vercel.app"
echo ""
echo "   Dashboard: https://dashboard.render.com/web/${SERVICE_ID}"
echo ""
echo "💡 After updating, Render will auto-deploy with the new values."

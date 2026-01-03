# Guide: Checking Render Environment Variables

## Overview

There are **two methods** to check environment variables on Render:

1. **SSH into the service** (Recommended - Most reliable)
2. **Render API** (May have limitations)

---

## Method 1: SSH into Service (Recommended) ✅

### Prerequisites

1. **SSH Key Setup**:
   - Render uses SSH keys for service access
   - Your SSH key should already be configured if you can access Render services
   - If not, add your SSH public key in Render Dashboard → Account Settings → SSH Keys

### Steps

#### Option A: Using the provided script

```bash
# Make sure you have SSH access configured
./check-render-env-via-ssh.sh
```

#### Option B: Manual SSH command

```bash
# SSH into your service
ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com

# Once connected, check environment variables:
printenv | grep -E '^(MONGODB_URI|JWT_SECRET|ENCRYPTION_KEY|CORS_ORIGIN|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)' | sort

# Or see all environment variables:
printenv | sort

# Or via Node.js (if Node is available):
node -e "console.log(JSON.stringify(process.env, null, 2))" | grep -E '(MONGODB|JWT|ENCRYPTION|CORS|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)'
```

#### Option C: One-liner to check specific variables

```bash
ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com "printenv | grep -E '^(MONGODB_URI|JWT_SECRET|ENCRYPTION_KEY|CORS_ORIGIN|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)' | sort"
```

### Security Notes

- ✅ **Safe**: SSH access is read-only for environment variables
- ✅ **Secure**: Your SSH key is required
- ⚠️ **Note**: Some sensitive variables might be masked in output

---

## Method 2: Render API

### Prerequisites

1. **Get API Key**:
   - Go to: https://dashboard.render.com
   - Click your profile → **API Keys**
   - Create a new API key
   - **Copy and save it** (you won't see it again!)

### Steps

#### Option A: Using the provided script

```bash
# Set your API key
export RENDER_API_KEY=your-api-key-here

# Run the script
node check-render-env-via-api.js
```

#### Option B: Manual API call

```bash
# Set API key
export RENDER_API_KEY=your-api-key-here

# Make API request
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     -H "Accept: application/json" \
     https://api.render.com/v1/services/srv-d5cooc2li9vc73ct9j70/env-vars
```

### Limitations

- ⚠️ **May not work**: Render API might not expose environment variables for security
- ⚠️ **Permissions**: API key needs appropriate permissions
- ⚠️ **Sensitive data**: Even if available, sensitive values might be hidden

---

## Method 3: Render Dashboard (Easiest) 🎯

**This is the simplest and most reliable method:**

1. Go to: https://dashboard.render.com/web/srv-d5cooc2li9vc73ct9j70
2. Click on **"Environment"** tab
3. View all environment variables

**Advantages:**
- ✅ No setup required
- ✅ Shows all variables clearly
- ✅ Can edit directly
- ✅ Shows which are auto-generated

---

## Quick Comparison

| Method | Difficulty | Reliability | Security | Setup Required |
|--------|-----------|-------------|----------|----------------|
| **Dashboard** | ⭐ Easy | ✅ 100% | ✅ Secure | None |
| **SSH** | ⭐⭐ Medium | ✅ 95% | ✅ Secure | SSH key |
| **API** | ⭐⭐⭐ Hard | ⚠️ 50% | ✅ Secure | API key |

---

## Recommended Approach

### For Quick Check:
👉 **Use Render Dashboard** - Fastest and most reliable

### For Automation/Scripts:
👉 **Use SSH** - Most reliable programmatic method

### For CI/CD:
👉 **Use Render API** (if supported) or **SSH**

---

## Security Best Practices

1. **Never commit API keys or SSH keys** to git
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Limit API key permissions** to minimum required
5. **Use SSH keys** with passphrases

---

## Troubleshooting

### SSH Access Denied

```bash
# Check if your SSH key is added to Render
# Go to: https://dashboard.render.com → Account Settings → SSH Keys

# Test SSH connection
ssh -v srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com
```

### API Key Not Working

```bash
# Verify API key is set
echo $RENDER_API_KEY

# Test API connection
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services
```

### Can't See Environment Variables

- Some variables are **auto-generated** by Render (like `JWT_SECRET`)
- Some variables are **hidden** for security (marked as `sync: false` in render.yaml)
- Check **Render Dashboard** for the most accurate view

---

## Example Output

### SSH Method Output:
```
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://dating-app-beharks-projects.vercel.app
FIREBASE_PROJECT_ID=my-project-de65d
JWT_SECRET=*** (hidden)
ENCRYPTION_KEY=*** (hidden)
```

### API Method Output:
```json
{
  "envVars": [
    {
      "key": "NODE_ENV",
      "value": "production"
    },
    {
      "key": "MONGODB_URI",
      "sync": false
    }
  ]
}
```

---

## Next Steps

1. **Choose a method** based on your needs
2. **Check which variables are set**
3. **Compare with required variables** (use `check-render-env-vars.js`)
4. **Set missing variables** in Render Dashboard

---

## Files Created

- `check-render-env-via-ssh.sh` - SSH method script
- `check-render-env-via-api.js` - API method script
- `check-render-env-vars.js` - Analysis script (compares render.yaml with requirements)

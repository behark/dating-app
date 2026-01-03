# How to Check Environment Variables on Render

## ✅ Yes, you can check variables via SSH or API!

I've created scripts to help you check environment variables. Here's what you need:

---

## 🚀 Method 1: SSH (Most Reliable)

### Setup Required

1. **Add your SSH public key to Render**:
   - Go to: https://dashboard.render.com → Account Settings → SSH Keys
   - Add your public SSH key (usually `~/.ssh/id_rsa.pub` or `~/.ssh/id_ed25519.pub`)

2. **Test SSH access**:
   ```bash
   ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com
   ```

3. **Run the script**:
   ```bash
   ./check-render-env-via-ssh.sh
   ```

   Or manually:
   ```bash
   ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com "printenv | grep -E '^(MONGODB_URI|JWT_SECRET|ENCRYPTION_KEY|CORS_ORIGIN|NODE_ENV|PORT|REDIS|FIREBASE|STORAGE|STRIPE|GOOGLE)' | sort"
   ```

### What You'll See

All environment variables that are set, including:
- `MONGODB_URI`
- `JWT_SECRET` (may be hidden/masked)
- `ENCRYPTION_KEY` (may be hidden/masked)
- `CORS_ORIGIN`
- `NODE_ENV`
- `PORT`
- And all others...

---

## 🔑 Method 2: Render API

### Setup Required

1. **Get your Render API key**:
   - Go to: https://dashboard.render.com
   - Click your profile → **API Keys**
   - Click **"New API Key"**
   - **Copy it immediately** (you won't see it again!)

2. **Set the API key**:
   ```bash
   export RENDER_API_KEY=your-api-key-here
   ```

3. **Run the script**:
   ```bash
   node check-render-env-via-api.js
   ```

### Limitations

⚠️ **Note**: Render API may not expose environment variables for security reasons. If the API doesn't work, use SSH or Dashboard method.

---

## 🎯 Method 3: Render Dashboard (Easiest - No Setup!)

**This is the simplest method - no scripts needed:**

1. Go to: https://dashboard.render.com/web/srv-d5cooc2li9vc73ct9j70
2. Click on **"Environment"** tab
3. **See all variables** listed there

**Advantages:**
- ✅ No setup required
- ✅ Shows everything clearly
- ✅ Can edit directly
- ✅ Shows which are auto-generated

---

## 📋 Quick Decision Guide

**Choose based on your situation:**

| Your Situation | Recommended Method |
|---------------|-------------------|
| Just want to check quickly | **Dashboard** (Method 3) |
| Want to automate/script | **SSH** (Method 1) |
| Already have API key | **API** (Method 2) |
| Need to check from terminal | **SSH** (Method 1) |

---

## 🔒 Security Notes

### SSH Key
- ✅ **Safe to share**: Your SSH **public** key (ends in `.pub`)
- ❌ **Never share**: Your SSH **private** key (no extension)
- Your public key is meant to be shared with services like Render

### API Key
- ❌ **Never share**: Your API key gives access to your Render account
- ✅ **Safe**: Only use in secure environments
- ✅ **Rotate**: Change it if compromised

---

## 📝 What to Do Next

### If Using SSH:

1. **Check if you have an SSH key**:
   ```bash
   ls -la ~/.ssh/id_*.pub
   ```

2. **If you don't have one, create it**:
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   # Press Enter to accept defaults
   ```

3. **Copy your public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Or
   cat ~/.ssh/id_rsa.pub
   ```

4. **Add to Render**:
   - Go to: https://dashboard.render.com → Account Settings → SSH Keys
   - Click "New SSH Key"
   - Paste your public key
   - Save

5. **Test connection**:
   ```bash
   ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com
   ```

6. **Check environment variables**:
   ```bash
   ./check-render-env-via-ssh.sh
   ```

### If Using API:

1. **Get API key** from Render Dashboard
2. **Export it**:
   ```bash
   export RENDER_API_KEY=your-key-here
   ```
3. **Run script**:
   ```bash
   node check-render-env-via-api.js
   ```

### If Using Dashboard:

1. Just go to: https://dashboard.render.com/web/srv-d5cooc2li9vc73ct9j70
2. Click "Environment" tab
3. Done! ✅

---

## 🐛 Troubleshooting

### SSH: "Permission denied (publickey)"

**Solution**: Add your SSH public key to Render Dashboard → Account Settings → SSH Keys

### API: "Unauthorized" or "403 Forbidden"

**Solution**: 
- Check API key is correct
- Ensure API key has proper permissions
- Try creating a new API key

### Can't see some variables

**Normal**: Some variables are:
- **Auto-generated** by Render (like `JWT_SECRET`)
- **Hidden** for security (marked `sync: false` in render.yaml)
- **Masked** in output (values shown as `***`)

---

## 📊 Expected Results

After running any method, you should see:

### Variables Currently Set (from render.yaml):
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`
- ✅ `FIREBASE_PROJECT_ID=my-project-de65d`
- ✅ `CORS_ORIGIN=https://dating-app-beharks-projects.vercel.app`
- ✅ `JWT_SECRET` (auto-generated)
- ✅ `ENCRYPTION_KEY` (auto-generated)

### Variables You Need to Check:
- ❓ `MONGODB_URI` - **CRITICAL - Must be set manually**
- ❓ `REDIS_HOST` or `REDIS_URL`
- ❓ `FIREBASE_PRIVATE_KEY`
- ❓ `FIREBASE_CLIENT_EMAIL`
- ❓ `STORAGE_PROVIDER`
- ❓ `CLOUDINARY_*` or `AWS_*` variables
- ❓ `STRIPE_SECRET_KEY`
- ❓ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

---

## 🎯 Summary

**Easiest**: Use Render Dashboard (no setup needed)  
**Most Reliable**: Use SSH (requires SSH key setup)  
**For Automation**: Use API (may have limitations)

**All methods are secure** - choose based on your preference and setup!

---

## 📁 Files Created

- ✅ `check-render-env-via-ssh.sh` - SSH method script
- ✅ `check-render-env-via-api.js` - API method script  
- ✅ `check-render-env-vars.js` - Analysis script (what's needed vs configured)
- ✅ `CHECK_ENV_VARS_GUIDE.md` - Detailed guide
- ✅ `HOW_TO_CHECK_ENV_VARS.md` - This file

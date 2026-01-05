# Firebase Configuration for Render 🔥

## Issue Found

Firebase environment variables are **NOT SET** on Render deployment, causing warnings:
```
⚠️ Firebase credentials not configured - using MongoDB fallback
```

## Required Firebase Environment Variables

Based on `backend/config/firebase.js`, Firebase needs these environment variables:

1. ✅ `FIREBASE_PROJECT_ID` - Already in `render.yaml` (value: `my-project-de65d`)
2. ❌ `FIREBASE_PRIVATE_KEY` - **MISSING** (needs to be added)
3. ❌ `FIREBASE_CLIENT_EMAIL` - **MISSING** (needs to be added)

**Optional:**
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_CLIENT_ID`

---

## How to Get Firebase Credentials

### Step 1: Get Service Account Key

1. Go to: https://console.firebase.google.com/
2. Select your project: `my-project-de65d`
3. Go to: **Project Settings** (gear icon) → **Service Accounts**
4. Click: **Generate New Private Key**
5. Download the JSON file

### Step 2: Extract Values from JSON

The downloaded JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "my-project-de65d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@my-project-de65d.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### Step 3: Add to Render Dashboard

1. Go to: https://dashboard.render.com
2. Select: `dating-app-backend` service
3. Go to: **Environment** tab
4. Add these environment variables:

#### FIREBASE_PROJECT_ID
```
Key: FIREBASE_PROJECT_ID
Value: my-project-de65d
```
*(Already set in render.yaml, but verify it's in dashboard)*

#### FIREBASE_PRIVATE_KEY
```
Key: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```
**Important**: 
- Copy the entire `private_key` value from JSON (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- Keep the `\n` characters as they are (they represent newlines)
- Or use the actual newlines if Render supports multi-line values

#### FIREBASE_CLIENT_EMAIL
```
Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@my-project-de65d.iam.gserviceaccount.com
```
*(Copy the `client_email` value from JSON)*

5. Click: **Save Changes**
6. Service will automatically redeploy

---

## Alternative: Use Service Account JSON File

If you prefer using a JSON file instead of environment variables:

1. Upload the service account JSON file to your repository at:
   ```
   backend/keys/firebase-service-account.json
   ```

2. **⚠️ Security Warning**: Never commit this file to Git!
   - Add to `.gitignore`:
     ```
     backend/keys/firebase-service-account.json
     ```

3. The code will automatically use the file if it exists (priority over env vars)

---

## Verification

After adding the variables and redeploying:

```bash
ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com

# Check variables are set
env | grep FIREBASE

# Test Firebase initialization
cd /opt/render/project/src/backend
node -e "require('./config/firebase.js'); console.log('Firebase initialized');"
```

**Expected output:**
```
✅ Firebase Admin initialized with environment variables
Firebase initialized
```

Instead of:
```
⚠️ Firebase credentials not configured - using MongoDB fallback
```

---

## Current Status

- ✅ `FIREBASE_PROJECT_ID` - Set in `render.yaml` (but not in dashboard)
- ❌ `FIREBASE_PRIVATE_KEY` - **NEEDS TO BE ADDED**
- ❌ `FIREBASE_CLIENT_EMAIL` - **NEEDS TO BE ADDED**

**Impact**: 
- App works fine (falls back to MongoDB)
- Firebase features (push notifications, Firestore) won't work
- Warning messages in logs

---

## Next Steps

1. **Get Firebase service account JSON** from Firebase Console
2. **Extract the values** (private_key, client_email)
3. **Add to Render Dashboard** → Environment Variables
4. **Redeploy** (automatic after saving)
5. **Verify** Firebase initializes correctly

---

## Security Notes

- ⚠️ **Never commit** Firebase credentials to Git
- ✅ Use Render's environment variables (encrypted at rest)
- ✅ Mark as `sync: false` in `render.yaml` (already done)
- ✅ Rotate keys periodically for security

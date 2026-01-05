# 🚨 URGENT: MongoDB Credentials Security Fix

## ⚠️ CRITICAL: MongoDB Credentials Found in Git History

Your MongoDB credentials were committed to git in an earlier commit. Here's what you need to do:

---

## 🔒 STEP 1: Change MongoDB Password IMMEDIATELY (DO THIS FIRST!)

**This is the most important step - do this NOW:**

1. **Go to MongoDB Atlas:** https://cloud.mongodb.com
2. **Navigate to:** Database Access (left sidebar)
3. **Find user:** `beharkabashi19_db_user`
4. **Click:** "Edit" → "Edit Password"
5. **Generate:** A new strong password (or create your own)
6. **Save** the new password

**Why:** Even if we remove it from git, anyone who cloned the repo before we fix it has access.

---

## 🔧 STEP 2: Update Environment Variables

After changing the password, update:

### Render.com:

1. Go to your Render service
2. Environment → Edit `MONGODB_URI`
3. Replace with: `mongodb+srv://beharkabashi19_db_user:NEW_PASSWORD@cluster0.jvmgujl.mongodb.net/dating-app?appName=Cluster0`
4. Save and redeploy

### Local `.env`:

Update `backend/.env`:

```
MONGODB_URI=mongodb+srv://beharkabashi19_db_user:NEW_PASSWORD@cluster0.jvmgujl.mongodb.net/dating-app?appName=Cluster0
```

---

## 🛠️ STEP 3: Remove from Git History

After changing the password, we can clean up git history. Options:

### Option A: Use git filter-branch (Recommended)

```bash
# Remove file containing credentials from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ENV_VARS_SUMMARY.md" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### Option B: Use BFG Repo-Cleaner (Easier)

```bash
# Install BFG
# Then run:
bfg --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

---

## 📋 What Was Exposed

- **Username:** `beharkabashi19_db_user`
- **Password:** `Behar123.` (OLD - change this!)
- **Cluster:** `cluster0.jvmgujl.mongodb.net`
- **Database:** `dating-app`

---

## ✅ After Password Change

1. ✅ Password changed in MongoDB Atlas
2. ✅ Updated in Render.com
3. ✅ Updated in local `.env`
4. ✅ Git history cleaned (optional but recommended)
5. ✅ Test connection with new password

---

## 🎯 Priority Order

1. **CHANGE PASSWORD** (do this immediately!)
2. Update environment variables
3. Clean git history (can do later, but password change is urgent)

---

**Remember: The password change is the most important step. Git history cleanup can wait, but change the password NOW!**

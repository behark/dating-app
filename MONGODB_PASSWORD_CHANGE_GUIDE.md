# 🚨 URGENT: Change MongoDB Password - Step by Step

## ⚠️ Your MongoDB Password is in Git History

**Password found:** `Behar123.`  
**Username:** `beharkabashi19_db_user`  
**Cluster:** `cluster0.jvmgujl.mongodb.net`

---

## 🔒 STEP 1: Change Password in MongoDB Atlas (DO THIS NOW!)

### Quick Steps:

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Log in with your account

2. **Navigate to Database Access:**
   - Click "Database Access" in the left sidebar
   - Or go directly: https://cloud.mongodb.com/v2#/security/database/users

3. **Find Your User:**
   - Look for: `beharkabashi19_db_user`
   - Click the "Edit" button (pencil icon)

4. **Change Password:**
   - Click "Edit Password"
   - Choose one:
     - **Option A:** Click "Autogenerate Secure Password" (recommended)
     - **Option B:** Enter your own strong password
   - **Copy the new password** (you'll need it!)
   - Click "Update User"

5. **Save the new password securely** (you'll need it for the next steps)

---

## 🔧 STEP 2: Update Render.com

1. Go to: https://dashboard.render.com
2. Select your backend service
3. Click "Environment" in left sidebar
4. Find `MONGODB_URI`
5. Click "Edit"
6. Replace the password in the connection string:
   ```
   mongodb+srv://beharkabashi19_db_user:NEW_PASSWORD@cluster0.jvmgujl.mongodb.net/dating-app?appName=Cluster0
   ```
7. Click "Save Changes"
8. **Redeploy** your service

---

## 💻 STEP 3: Update Local .env

Edit `backend/.env`:

```bash
MONGODB_URI=mongodb+srv://beharkabashi19_db_user:NEW_PASSWORD@cluster0.jvmgujl.mongodb.net/dating-app?appName=Cluster0
```

---

## 🧪 STEP 4: Test New Connection

After updating, test the connection:

```bash
cd backend
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e.message))"
```

---

## 🛠️ STEP 5: Clean Git History (After Password Change)

Once you've changed the password everywhere, we can clean git history:

```bash
# Run the cleanup script
./scripts/remove-mongodb-from-history.sh

# Then force push (WARNING: Rewrites remote history)
git push origin --force --all
```

---

## ⚠️ Important Notes

1. **Change password FIRST** - This is the most important step
2. **Update all places** - Render, local .env, any other configs
3. **Test connection** - Make sure everything works with new password
4. **Then clean git** - History cleanup can wait, password change cannot

---

## ✅ Checklist

- [ ] Password changed in MongoDB Atlas
- [ ] New password saved securely
- [ ] Updated in Render.com
- [ ] Updated in local `.env`
- [ ] Tested connection with new password
- [ ] Git history cleaned (optional but recommended)

---

**Priority: Change the password NOW, then update environment variables!**

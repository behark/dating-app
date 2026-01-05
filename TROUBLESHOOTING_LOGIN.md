# Troubleshooting Login/Signup Issues

## 🔍 Debug Steps

### Step 1: Open Browser Console

1. Go to: https://dating-app-seven-peach.vercel.app
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Clear the console (click 🚫 or press Ctrl+L)

### Step 2: Check API Configuration

When the page loads, you should see:
```
🌐 API Configuration:
  - Platform: web
  - API_URL: https://dating-app-backend-x4yq.onrender.com/api
  - __DEV__: false
  ...
```

**If API_URL is wrong or undefined**, that's the problem!

### Step 3: Try Login/Signup

1. Try to login or signup
2. Watch the console for these messages:

**For Login:**
```
🔍 Login - API_URL: [should show the backend URL]
🔍 Login - Full URL: [should show the full endpoint]
✅ Login - Response status: [should show 200 or 401]
📥 Login - Response text: [should show the JSON response]
```

**For Signup:**
```
🔍 Signup - API_URL: [should show the backend URL]
🔍 Signup - Full URL: [should show the full endpoint]
✅ Signup - Response status: [should show 201 or 400]
📥 Signup - Response text: [should show the JSON response]
```

### Step 4: Check for Errors

Look for messages starting with:
- ❌ (red X) = Error occurred
- ✅ (green check) = Success

## 🐛 Common Issues & Solutions

### Issue 1: API_URL is undefined or wrong

**Symptoms:**
- Console shows `API_URL: undefined` or wrong URL
- Requests fail immediately

**Solution:**
- Check Vercel environment variables
- Set `EXPO_PUBLIC_API_URL` = `https://dating-app-backend-x4yq.onrender.com/api`
- Redeploy on Vercel

### Issue 2: CORS Error

**Symptoms:**
- Console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
- Network tab shows CORS error

**Solution:**
- Update Render environment variables:
  - `CORS_ORIGIN` = `https://dating-app-seven-peach.vercel.app`
  - `FRONTEND_URL` = `https://dating-app-seven-peach.vercel.app`
- Wait for Render to redeploy

### Issue 3: Network Error

**Symptoms:**
- Console shows: `❌ Login - No response received`
- Network tab shows failed request

**Solution:**
- Check if backend is running: https://dating-app-backend-x4yq.onrender.com/health
- Check Render dashboard for service status
- Verify backend is not sleeping (free tier sleeps after inactivity)

### Issue 4: Invalid Response Format

**Symptoms:**
- Console shows: `❌ Login - JSON parse error`
- Response status is not 200/201

**Solution:**
- Check the response text in console
- Verify backend is returning valid JSON
- Check backend logs in Render dashboard

### Issue 5: Response Not OK

**Symptoms:**
- Console shows: `❌ Login - Response not OK:`
- Response status is 400, 401, 500, etc.

**Solution:**
- Check the error message in console
- Verify credentials are correct
- Check backend logs for detailed error

## 📋 What to Share for Help

If login/signup still doesn't work, share:

1. **Console Output:**
   - Copy all console messages (especially ❌ and 🔍 messages)
   - Include the API Configuration section

2. **Network Tab:**
   - Go to Network tab in DevTools
   - Try login/signup
   - Find the request to `/auth/login` or `/auth/register`
   - Right-click → Copy → Copy as cURL
   - Share the cURL command

3. **Error Message:**
   - The exact error message shown in the alert
   - Any error messages in console

## ✅ Quick Checks

Before troubleshooting, verify:

- [ ] Backend is running: https://dating-app-backend-x4yq.onrender.com/health
- [ ] CORS is configured: Test with curl (see QUICK_FIX_FRONTEND_URL.md)
- [ ] Frontend URL matches: Check Render environment variables
- [ ] No ad blockers: Disable browser extensions that might block requests
- [ ] Try incognito mode: Rule out browser cache issues

## 🔧 Manual Test

Test the API directly:

```bash
# Test Login
curl -X POST https://dating-app-backend-x4yq.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://dating-app-seven-peach.vercel.app" \
  -d '{"email":"test@test.com","password":"test123"}'

# Test Signup
curl -X POST https://dating-app-backend-x4yq.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://dating-app-seven-peach.vercel.app" \
  -d '{"email":"newuser@test.com","password":"test123456","name":"Test","age":25,"gender":"male"}'
```

If these work but the website doesn't, it's a frontend configuration issue.

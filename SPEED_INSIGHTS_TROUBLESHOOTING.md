# Speed Insights Troubleshooting Guide

## Issue: "No data available" in Vercel Speed Insights

If you're seeing "No data available" in your Vercel Speed Insights dashboard, here are the steps to troubleshoot:

---

## ✅ Current Setup

- **Package Version**: `@vercel/speed-insights@1.3.1` (latest)
- **Implementation**: Component-based in `App.js`
- **Platform**: Web only (conditional loading)

---

## 🔍 Troubleshooting Steps

### 1. Verify Package Installation
```bash
npm list @vercel/speed-insights
```
Should show: `@vercel/speed-insights@1.3.1`

### 2. Check Implementation
The Speed Insights component should be in `App.js`:
```javascript
{Platform.OS === 'web' && SpeedInsights && <SpeedInsights />}
```

### 3. Verify Deployment
Speed Insights **only works on Vercel deployments**, not:
- ❌ Local development (`npm start`)
- ❌ Local builds
- ✅ Only works on `vercel.com` domains

### 4. Check Build Output
After building, verify the component is included:
```bash
npm run web:build
# Check web-build/index.html or web-build/_expo/static/js/
```

### 5. Verify in Browser
1. Deploy to Vercel
2. Visit your deployed site
3. Open browser DevTools → Network tab
4. Look for requests to `vitals.vercel-insights.com` or similar
5. Navigate between pages to generate data

### 6. Wait for Data Collection
- **Minimum**: 30 seconds after visiting
- **Recommended**: Visit multiple pages and wait 1-2 minutes
- Speed Insights needs real user interactions to collect data

### 7. Check Browser Console
Open DevTools Console and look for:
- ✅ No errors related to Speed Insights
- ✅ Check if component is rendering (React DevTools)

### 8. Verify Vercel Project Settings
1. Go to Vercel Dashboard → Your Project
2. Settings → Speed Insights
3. Ensure Speed Insights is enabled
4. Check if there are any configuration issues

---

## 🛠️ Common Issues & Solutions

### Issue 1: Component Not Loading
**Symptom**: No network requests to Vercel Insights

**Solution**: 
- Verify the component is rendered (check React DevTools)
- Check for import errors in console
- Ensure `Platform.OS === 'web'` is true

### Issue 2: Ad Blockers
**Symptom**: Component loads but no data collected

**Solution**:
- Disable ad blockers temporarily
- Test in incognito mode
- Speed Insights requests might be blocked

### Issue 3: Not Deployed to Vercel
**Symptom**: Works locally but no data

**Solution**:
- Speed Insights **only works on Vercel**
- Deploy to Vercel: `vercel --prod`
- Verify deployment URL is `*.vercel.app` or your custom domain

### Issue 4: Build Configuration
**Symptom**: Component not in build output

**Solution**:
- Check `vercel.json` build command
- Verify `web-build` directory contains the component
- Check Expo web build configuration

### Issue 5: Insufficient Traffic
**Symptom**: Component works but no data

**Solution**:
- Speed Insights needs real user visits
- Visit multiple pages on your deployed site
- Wait at least 1-2 minutes
- Generate multiple page views

---

## 🔧 Enhanced Implementation

If the current implementation isn't working, try this enhanced version:

```javascript
// In App.js
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Initialize Speed Insights for web
useEffect(() => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Ensure Speed Insights initializes
    try {
      const speedInsights = require('@vercel/speed-insights/react');
      console.log('Speed Insights loaded:', !!speedInsights);
    } catch (error) {
      console.warn('Speed Insights not available:', error);
    }
  }
}, []);
```

---

## 📊 Verification Checklist

- [ ] Package installed: `@vercel/speed-insights@1.3.1`
- [ ] Component rendered in `App.js`
- [ ] Deployed to Vercel (not just local)
- [ ] Visited deployed site
- [ ] Navigated between pages
- [ ] Waited 30+ seconds
- [ ] Checked browser console for errors
- [ ] Disabled ad blockers
- [ ] Verified in Vercel dashboard

---

## 🚀 Quick Test

1. **Deploy to Vercel**:
   ```bash
   npm run web:build
   vercel --prod
   ```

2. **Visit your site** and navigate between pages

3. **Wait 1-2 minutes**

4. **Check Vercel Dashboard** → Speed Insights

5. **Verify data appears**

---

## 📝 Notes

- Speed Insights uses **Real User Monitoring (RUM)**
- Requires actual user visits (not just page loads)
- Data collection happens client-side
- Works automatically once deployed to Vercel
- No additional configuration needed beyond component inclusion

---

## 🔗 Resources

- [Vercel Speed Insights Docs](https://vercel.com/docs/analytics/speed-insights)
- [Package Documentation](https://www.npmjs.com/package/@vercel/speed-insights)

---

## ✅ If Still Not Working

1. **Check Vercel Dashboard** → Speed Insights settings
2. **Verify deployment** is successful
3. **Test in different browser** (Chrome, Firefox, Safari)
4. **Check network tab** for blocked requests
5. **Contact Vercel support** if issue persists

---

**Last Updated**: 2026-01-05

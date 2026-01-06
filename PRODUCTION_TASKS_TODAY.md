# 🚀 Production Tasks - Complete Today

## Priority Order (Do These First)

### 1. Security & Compliance (30 min)
- [ ] Remove all `console.log()` statements from production code
- [ ] Ensure no API keys or secrets are hardcoded
- [ ] Verify Privacy Policy URL is accessible and linked in app
- [ ] Verify Terms of Service URL is accessible and linked in app
- [ ] Add data deletion endpoint (GDPR compliance)
- [ ] Add data export endpoint (GDPR compliance)
- [ ] Ensure all user inputs are validated and sanitized
- [ ] Verify rate limiting is active on all public endpoints

### 2. Error Handling & Logging (20 min)
- [ ] Replace all console.log with proper logging (Winston/Sentry)
- [ ] Add error boundaries to all React Native screens
- [ ] Ensure all API errors return user-friendly messages
- [ ] Verify Sentry is configured and capturing errors
- [ ] Test error scenarios (network failures, invalid inputs)

### 3. Performance Optimization (30 min)
- [ ] Optimize images (compress, use appropriate formats)
- [ ] Implement lazy loading for images and screens
- [ ] Add loading states to all async operations
- [ ] Optimize database queries (add missing indexes)
- [ ] Enable Redis caching for frequently accessed data
- [ ] Reduce bundle size (remove unused dependencies)

### 4. App Store Assets (15 min)
- [ ] Verify app icon exists (1024x1024 iOS, 512x512 Android)
- [ ] Prepare screenshots for both stores
- [ ] Review app descriptions (short + full)
- [ ] Set age rating (17+ for dating apps)
- [ ] Prepare privacy policy and terms URLs

### 5. Build & Configuration (20 min)
- [ ] Configure production environment variables
- [ ] Test production build locally
- [ ] Verify API endpoints point to production
- [ ] Configure push notifications
- [ ] Test deep linking

### 6. Final Testing (30 min)
- [ ] Test critical flows: Login → Signup → Match → Chat
- [ ] Test error scenarios
- [ ] Test on both iOS and Android (if possible)
- [ ] Verify all features work in production mode
- [ ] Check for memory leaks
- [ ] Verify app startup time < 3 seconds

## Quick Commands

```bash
# Remove console.logs
find . -name "*.js" -not -path "./node_modules/*" -exec sed -i '/console\.log/d' {} \;

# Check for hardcoded secrets
grep -r "password.*=" --include="*.js" --exclude-dir=node_modules

# Build for production
npm run build

# Test production build
npm run start:backend
```

## Store Submission Checklist

### Google Play Store
- [ ] App signed with release keystore
- [ ] App icon (512x512)
- [ ] Screenshots (phone, tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Age rating (Mature 17+)
- [ ] Content rating questionnaire completed

### Apple App Store
- [ ] App signed with distribution certificate
- [ ] App icon (1024x1024)
- [ ] Screenshots (various iPhone/iPad sizes)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Age rating (17+)
- [ ] App Store Connect account ready

## When Asking AI for Help

Use this format:
```
"I need to complete production tasks for app store submission. Please:
1. Remove all console.logs and replace with proper logging
2. Add error boundaries to all screens
3. Optimize images and implement lazy loading
4. [specific task]"
```

The AI will implement these directly following our production-ready patterns.

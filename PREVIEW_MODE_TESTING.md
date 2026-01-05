# Preview Mode Testing Guide

## Overview

The app now shows a **PreviewHomeScreen** to unlogged users by default, allowing them to explore demo profiles before signing up.

## Test Scenarios

### 1. Unlogged User Flow

**Expected Behavior:**

- ✅ User opens app → Sees PreviewHomeScreen with demo profiles
- ✅ "Preview Mode" badge visible at top
- ✅ Value proposition header visible
- ✅ 5 demo profiles available to swipe through
- ✅ Demo badges visible on each card

**Test Steps:**

1. Log out (if logged in)
2. Close and reopen app
3. Verify PreviewHomeScreen is shown
4. Check that demo profiles are displayed

---

### 2. Interaction Triggers Login Modal

**Expected Behavior:**

- ✅ Swiping left/right → Opens login modal
- ✅ Tapping profile info button → Opens login modal
- ✅ Tapping action buttons (pass/like/super like) → Opens login modal
- ✅ Modal shows context-aware message based on interaction

**Test Steps:**

1. Try swiping a card left → Modal should appear with "Sign up to start matching!"
2. Try swiping a card right → Modal should appear
3. Tap the info button on a card → Modal should say "Create an account to view full profiles"
4. Tap the like button → Modal should say "Join to like and match with people"
5. Tap the super like button → Modal should say "Sign up to send Super Likes!"

---

### 3. Login/Signup

**Expected Behavior:**

- ✅ Login/Signup form works in modal
- ✅ Can switch between login and signup
- ✅ Google sign-in works
- ✅ After successful auth, modal closes automatically
- ✅ User is automatically navigated to full app (HomeScreen)

**Test Steps:**

1. Trigger login modal (by swiping)
2. Try signing up with new account
3. Verify modal closes after successful signup
4. Verify user sees real HomeScreen (not preview)
5. Log out and try logging in with existing account
6. Verify same behavior

---

### 4. Navigation Flow

**Expected Behavior:**

- ✅ Logged-in users never see PreviewHomeScreen
- ✅ Unlogged users see PreviewHomeScreen by default
- ✅ After login, seamless transition to MainTabs
- ✅ Can navigate back to preview if logged out

**Test Steps:**

1. While logged in, verify you see MainTabs (not preview)
2. Log out → Should see PreviewHomeScreen
3. Log in → Should see MainTabs immediately
4. Verify no flickering or loading states

---

### 5. Demo Profile Display

**Expected Behavior:**

- ✅ All demo profiles show correctly
- ✅ Photos load from Unsplash
- ✅ Names, ages, bios display correctly
- ✅ Distance shows correctly (e.g., "5 km away")
- ✅ Verification badges show where applicable
- ✅ Can swipe through all 5 profiles

**Test Steps:**

1. Check each demo profile displays correctly
2. Verify photos load (may take a moment)
3. Check distance formatting
4. Swipe through all profiles
5. Verify empty state appears after last profile

---

### 6. Empty State

**Expected Behavior:**

- ✅ After viewing all demo profiles, empty state appears
- ✅ Empty state has clear CTA to sign up
- ✅ Tapping CTA opens login modal

**Test Steps:**

1. Swipe through all 5 demo profiles
2. Verify empty state appears
3. Tap "Get Started Free" button
4. Verify login modal opens

---

### 7. Edge Cases

**Expected Behavior:**

- ✅ Modal can be closed with X button
- ✅ Closing modal doesn't break app state
- ✅ Can reopen modal after closing
- ✅ App handles network errors gracefully

**Test Steps:**

1. Open login modal
2. Close it with X button
3. Try interacting again → Modal should reopen
4. Test with poor network connection
5. Verify error messages display correctly

---

## Known Demo Profiles

1. **Alex** - 28, New York, 5 km away, Verified
2. **Jordan** - 26, San Francisco, 12 km away
3. **Taylor** - 30, Los Angeles, 8 km away, Verified
4. **Sam** - 27, Miami, 15 km away
5. **Casey** - 29, Seattle, 20 km away, Verified

---

## Quick Test Checklist

- [ ] PreviewHomeScreen shows for unlogged users
- [ ] Demo profiles display correctly
- [ ] Swiping triggers login modal
- [ ] Login modal shows context-aware messages
- [ ] Sign up works from modal
- [ ] Login works from modal
- [ ] Modal closes after successful auth
- [ ] User navigates to full app after login
- [ ] Logged-in users don't see preview
- [ ] Empty state works correctly
- [ ] All action buttons work
- [ ] Google sign-in works
- [ ] Modal can be closed and reopened

---

## Troubleshooting

### Issue: PreviewHomeScreen not showing

- Check if user is logged in (should see MainTabs instead)
- Verify AppNavigator has PreviewHomeScreen imported
- Check navigation stack order

### Issue: Login modal not opening

- Check if showLoginModal state is being set
- Verify interaction handlers are connected
- Check console for errors

### Issue: Modal doesn't close after login

- Verify AuthContext updates currentUser
- Check useEffect dependency array
- Verify onAuthSuccess callback is called

### Issue: Photos not loading

- Check network connection
- Verify Unsplash URLs are accessible
- Check image loading errors in console

---

## Success Criteria

✅ **All test scenarios pass**
✅ **No console errors**
✅ **Smooth transitions between screens**
✅ **Login/signup works seamlessly**
✅ **User experience is intuitive**

---

## Next Steps After Testing

1. Monitor user analytics for preview → signup conversion
2. A/B test different demo profiles
3. Consider adding more demo profiles
4. Add analytics tracking for interactions
5. Consider adding onboarding tooltips

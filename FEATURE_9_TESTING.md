# Feature 9: Safety & Moderation Testing Guide

## Quick Test Summary

**Total Test Cases:** 45
**Test Categories:** 6 (Reporting, Blocking, Verification, Content Flags, Safety Tips, Admin)
**Expected Coverage:** 100% of safety features

---

## 1. Report User Functionality Tests

### Test Case 1.1: Report User - Successful Submission
**Steps:**
1. Navigate to a user's profile
2. Tap the report button (or menu → Report)
3. Select a report category (e.g., "Inappropriate Photos")
4. Enter description "Test report for inappropriate content"
5. Tap "Submit Report"

**Expected Result:**
- Report successfully submitted message
- Report stored in Firestore `reports` collection
- User redirected to previous screen
- No errors in console

**Validation Command:**
```bash
# Check Firebase console or use curl
curl -X POST http://localhost:3000/api/safety/report \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "user123",
    "category": "inappropriate_photos",
    "description": "Test report for inappropriate content",
    "evidence": []
  }'
```

### Test Case 1.2: Report User - All Categories
**Steps:**
1. Test each report category:
   - 📸 Inappropriate Photos
   - 👤 Fake Profile
   - 💬 Harassment/Abuse
   - ⚠️ Scam
   - 😠 Offensive Behavior
   - 📋 Other

**Expected Result:**
- All 6 categories selectable
- Each category shows correct icon/color
- Each category submits successfully

### Test Case 1.3: Report User - Validation Errors
**Steps:**
1. Attempt to submit without selecting category
2. Attempt to submit with description < 10 characters
3. Attempt to submit with description > 500 characters
4. Attempt to report yourself

**Expected Result:**
- Appropriate error messages appear
- Submit button disabled until valid
- Self-report prevented with message

**Error Messages:**
- "Please select a report category"
- "Please provide at least 10 characters of detail"
- "Description cannot exceed 500 characters"
- "Cannot report yourself"

### Test Case 1.4: Character Count Display
**Steps:**
1. Open ReportUserScreen
2. Type description with 50 characters
3. Delete to 10 characters
4. Continue to 500 characters
5. Attempt to exceed 500

**Expected Result:**
- Character count shows "X/500"
- Input stops at 500 characters
- Count updates in real-time

### Test Case 1.5: Report Data Persistence
**Steps:**
1. Submit a report
2. Check Firestore console or database
3. Verify report structure

**Expected Data:**
```javascript
{
  reporterId: "auth_user_id",
  reportedUserId: "target_user_id",
  category: "inappropriate_photos",
  description: "Test report...",
  status: "pending",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Test Case 1.6: Multiple Reports on Same User
**Steps:**
1. Report the same user twice with different categories
2. Check Firestore `reports` collection
3. Verify user's `reportCount` incremented

**Expected Result:**
- Multiple report documents created
- User's `reportCount` = 2
- Each report tracked separately

### Test Case 1.7: Auto-Suspension on 3+ Reports
**Steps:**
1. Report user 3 times
2. Check user's `suspended` field in database
3. Verify suspension timestamp set

**Expected Result:**
- After 3rd report: user auto-suspended
- `suspended: true` in user document
- `suspendedAt: <timestamp>`
- `suspendReason: "Multiple user reports"`

---

## 2. Block User Functionality Tests

### Test Case 2.1: Block User - Successful
**Steps:**
1. View user profile
2. Tap menu → Block User
3. Confirm block action
4. Check blocked users list

**Expected Result:**
- User successfully blocked
- Confirmation message appears
- User added to `blockedUsers` array
- Profile becomes inaccessible

**Validation:**
```bash
curl -X POST http://localhost:3000/api/safety/block \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId": "user123"}'
```

### Test Case 2.2: Unblock User
**Steps:**
1. Go to Profile → Settings → Blocked Users
2. Swipe or tap delete on blocked user
3. Confirm unblock

**Expected Result:**
- User unblocked successfully
- Removed from `blockedUsers` array
- Can interact again

### Test Case 2.3: Blocked Users List
**Steps:**
1. Block 3 different users
2. Navigate to Settings → Blocked Users
3. Verify list shows all 3

**Expected Result:**
- All blocked users displayed
- Shows user avatar/name
- Option to unblock each
- Count shows "3 blocked"

**API Test:**
```bash
curl -X GET http://localhost:3000/api/safety/blocked \
  -H "Authorization: Bearer <TOKEN>"
```

### Test Case 2.4: Interaction Prevention
**Steps:**
1. Block user A
2. Try to send message to user A
3. Try to like user A's profile
4. Try to view their profile

**Expected Result:**
- All interactions blocked
- "This user has blocked you" or similar message
- Cannot access profile
- Cannot send messages

### Test Case 2.5: Mutual Block Check
**Steps:**
1. User A blocks User B
2. User B tries to contact User A
3. System checks mutual blocks

**Expected Result:**
- System detects User A blocked User B
- Interaction prevented
- Clear message to both parties

**API Test:**
```bash
curl -X GET http://localhost:3000/api/safety/blocked/otherUserId \
  -H "Authorization: Bearer <TOKEN>"
```

### Test Case 2.6: Block Prevents Seeing Profile
**Steps:**
1. Block user
2. Try searching for them
3. Try accessing via old link/message

**Expected Result:**
- Profile invisible to blocked user
- Search results exclude them
- Old links show "User not available"

### Test Case 2.7: Cannot Block Self
**Steps:**
1. Attempt to block own profile

**Expected Result:**
- Error message: "Cannot block yourself"
- Block option disabled on own profile

---

## 3. Photo Verification Tests

### Test Case 3.1: Submit Verification Photo
**Steps:**
1. Navigate to Verification screen
2. Review requirements checklist
3. Take/upload selfie photo
4. Confirm and submit

**Expected Result:**
- Photo uploaded to Firebase Storage
- Verification record created in Firestore
- Status shows "pending"
- Success confirmation shown

**Validation:**
```bash
# Check Firestore verifications collection
# userId: "auth_user_id"
# status: "pending"
# submittedAt: <timestamp>
```

### Test Case 3.2: Verification Status Check
**Steps:**
1. After submission, check status
2. Navigate away and return
3. Verify status persists

**Expected Result:**
- Status shows "pending"
- Message: "Your photo is being reviewed..."
- Resubmit option available if rejected

### Test Case 3.3: Verification Expiration
**Steps:**
1. Submit photo (manually set expiresAt to 1 day from now for testing)
2. Wait 1+ days (or mock time)
3. Check verification status
4. Try to interact with verified status

**Expected Result:**
- Status shows "expired"
- Message: "Verification expired. Please submit new photo."
- Must resubmit to regain verified status

### Test Case 3.4: Liveness Detection - Pass
**Steps:**
1. Take clear selfie with good lighting
2. Face directly to camera
3. Submit photo
4. System performs liveness check

**Expected Result:**
- Liveness check passes
- Photo meets requirements
- Verification can be approved

### Test Case 3.5: Liveness Detection - Fail
**Steps:**
1. Submit photo that's not a clear selfie
2. Submit printed photo
3. Submit very old photo
4. Submit heavily filtered photo

**Expected Result:**
- Liveness detection fails
- Photo rejected
- Clear error message with requirements
- Can retry

### Test Case 3.6: Advanced Verification (Face Match)
**Steps:**
1. Submit selfie for verification
2. System compares with profile photos
3. Check similarity score

**Expected Result:**
- Face matching score calculated
- > 85% match = passes
- < 85% match = fails
- Shows similarity percentage

### Test Case 3.7: Verification Badge Display
**Steps:**
1. Approve user's verification (admin)
2. View user profile
3. Check for verification badge

**Expected Result:**
- ✓ Badge appears on profile
- Shows "Verified" status
- Can be seen by matches

### Test Case 3.8: Multiple Submission Attempts
**Steps:**
1. Submit photo, get rejected
2. Submit again (same photo)
3. Submit different photo
4. Track all attempts

**Expected Result:**
- `attempts` counter increments
- All submissions logged
- History available to admin

---

## 4. Content Moderation Flagging Tests

### Test Case 4.1: Flag Message Content
**Steps:**
1. Long-press or right-click message
2. Select "Flag Content"
3. Choose reason (e.g., "explicit")
4. Provide optional description
5. Submit

**Expected Result:**
- Flag created successfully
- Message flagged in system
- Doesn't delete message, just flags for review
- User gets notification of submission

**API Test:**
```bash
curl -X POST http://localhost:3000/api/safety/flag \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "message",
    "contentId": "msg123",
    "reason": "explicit",
    "description": "Inappropriate content"
  }'
```

### Test Case 4.2: Flag Profile Photo
**Steps:**
1. View user profile
2. Tap menu → Flag Photo
3. Select reason (inappropriate, fake, etc.)
4. Submit

**Expected Result:**
- Photo flagged for review
- Photo still visible to user who uploaded it
- Visible to other users normally
- Admin can view flags

### Test Case 4.3: Flag Profile
**Steps:**
1. View profile
2. Flag entire profile
3. Provide reason and details

**Expected Result:**
- Entire profile flagged
- Profile flagged status logged
- Can still view profile normally

### Test Case 4.4: Multiple Flags on Same Content
**Steps:**
1. Have 3 users flag the same message
2. Check flags collection
3. Aggregate flag count

**Expected Result:**
- All 3 flags recorded
- Count available: "3 reports on this content"
- Higher priority for admin review if multiple flags

### Test Case 4.5: Valid Flag Reasons
**Steps:**
1. Test each flag reason:
   - explicit
   - hateful
   - violent
   - misleading
   - spam

**Expected Result:**
- All reasons selectable
- Each submits successfully
- Reason stored correctly

### Test Case 4.6: Invalid Flag Reason Rejected
**Steps:**
1. Attempt to flag with invalid reason
2. Submit form

**Expected Result:**
- Error: "Invalid reason"
- Form doesn't submit
- Valid reasons list shown

---

## 5. Safety Tips Screen Tests

### Test Case 5.1: Load Safety Tips
**Steps:**
1. Navigate to Profile
2. Tap "Safety Tips"
3. Wait for content to load

**Expected Result:**
- Screen loads smoothly
- All 6 tip categories visible
- No loading spinner after 2 seconds

### Test Case 5.2: Expand/Collapse Tips
**Steps:**
1. Tap "Protect Your Personal Information"
2. Verify content expands
3. Tap again to collapse
4. Verify content collapses

**Expected Result:**
- Smooth expand animation
- All tips visible when expanded
- Smooth collapse animation
- No content overlaps

### Test Case 5.3: All 6 Categories
**Steps:**
1. Verify all categories present:
   - 🔐 Protect Your Personal Information
   - ✅ Verify Before Meeting
   - 📍 Safe First Meeting
   - 💬 Online Interaction Safety
   - ⚠️ Red Flags to Watch For
   - 🚨 If Something Goes Wrong

**Expected Result:**
- All 6 visible and working
- Correct icons and colors
- All tips have 3-5 items each

### Test Case 5.4: Emergency Resources Section
**Steps:**
1. Scroll to "Emergency Resources"
2. Verify content displays
3. Check "Call Police" button
4. Check "Crisis Text" button

**Expected Result:**
- Emergency section clearly visible
- Red background for urgency
- Buttons properly formatted
- Contact info accurate

### Test Case 5.5: Reporting Guide Steps
**Steps:**
1. Scroll to "How to Report on Our App"
2. Verify 4 steps displayed
3. Check step numbers
4. Verify clarity of instructions

**Expected Result:**
- 4 numbered steps visible
- Step 1: Find profile/conversation
- Step 2: Tap menu and select Report
- Step 3: Select reason and provide details
- Step 4: Submit and wait for review

### Test Case 5.6: Best Practices Cards
**Steps:**
1. Scroll to "Best Practices"
2. Count practice cards
3. Verify each has icon, title, and description

**Expected Result:**
- 4 practice cards:
  - 🔐 Privacy First
  - 🔍 Verify Identity
  - 📍 Public Meetings
  - 💭 Trust Your Gut
- All have descriptions

### Test Case 5.7: Community Guidelines
**Steps:**
1. Scroll to "Community Guidelines"
2. Verify all 5 prohibited behaviors listed
3. Check icons are visible

**Expected Result:**
- All 5 guidelines visible:
  - Harassment, abuse, or threats
  - Explicit or inappropriate content
  - Scams or financial exploitation
  - Fraud or false information
  - Solicitation or spam

### Test Case 5.8: Scroll and Layout
**Steps:**
1. Scroll through entire screen
2. Check for text overlap
3. Check button sizes
4. Verify spacing

**Expected Result:**
- No content cuts off
- No text overlaps
- Buttons easily tappable
- Good spacing throughout

### Test Case 5.9: Mobile Responsiveness
**Steps:**
1. Test on different screen sizes (iPhone SE, iPhone 12 Pro Max, iPad)
2. Verify layout adapts
3. Check text readability
4. Test touch targets

**Expected Result:**
- Proper responsive design
- Text readable on all sizes
- Buttons tappable (minimum 44x44)
- No horizontal scrolling needed

---

## 6. Admin Features Tests

### Test Case 6.1: View All Reports
**Steps:**
1. Log in as admin
2. Navigate to reports dashboard
3. Verify all pending reports display

**Expected Result:**
- All reports show:
  - Reporter name
  - Reported user
  - Category
  - Description
  - Timestamp
  - Status: pending

**API Test:**
```bash
curl -X GET http://localhost:3000/api/safety/reports \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Test Case 6.2: Filter Reports by Status
**Steps:**
1. Admin dashboard
2. Filter by: pending
3. Filter by: reviewed
4. Filter by: action_taken

**Expected Result:**
- Reports filter correctly
- Count shows correct number
- Each status shows relevant reports

### Test Case 6.3: Review Report - Dismiss
**Steps:**
1. Open pending report
2. Review details
3. Click "Dismiss"
4. Add optional note

**Expected Result:**
- Report status: dismissed
- Admin notes saved
- Report removed from pending
- Appears in "Dismissed" tab

### Test Case 6.4: Review Report - Take Action
**Steps:**
1. Open pending report
2. Click "Take Action"
3. Select action: "Suspend User"
4. Provide reason
5. Confirm

**Expected Result:**
- User suspended
- Report status: action_taken
- Admin notes logged
- Reason stored
- Notification sent to user (optional)

### Test Case 6.5: Safety Score Calculation
**Steps:**
1. Select user
2. View safety score
3. Check risk factors breakdown

**Expected Result:**
- Score 0-100 displayed
- Shows factors:
  - Report count
  - Verification status
  - Block count
  - Suspension status
- Accurate calculation

**API Test:**
```bash
curl -X GET http://localhost:3000/api/safety/safety-score/userId \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Test Case 6.6: Suspend/Unsuspend User
**Steps:**
1. Select user
2. Click "Suspend"
3. Provide reason
4. Confirm
5. User appears as suspended
6. Click "Unsuspend"
7. Confirm

**Expected Result:**
- User suspended successfully
- `suspended: true` set
- `suspendReason` saved
- All interactions blocked for user
- Unsuspend reverses process

### Test Case 6.7: Photo Verification Review
**Steps:**
1. View pending verifications
2. Review submitted photo
3. Click "Approve" or "Reject"
4. If reject, provide reason

**Expected Result:**
- Photo displayed
- Approve/reject options clear
- User notified of decision
- Badge shows verification status
- Rejection reason saved

---

## 7. Integration Tests

### Test Case 7.1: Report + Block Combined
**Steps:**
1. Report user
2. Automatically block user
3. Verify both actions completed

**Expected Result:**
- Report submitted
- User added to blockedUsers
- Both actions logged
- User cannot interact

### Test Case 7.2: Block + Notification
**Steps:**
1. User blocks another user
2. Check if both receive notifications
3. Verify accurate notification

**Expected Result:**
- Blocking user gets confirmation
- Blocked user doesn't see profile anymore
- No notification sent to blocked user (privacy)

### Test Case 7.3: Verification Badge on Profile
**Steps:**
1. User submits verification photo
2. Admin approves
3. View user's profile
4. Check for verification badge

**Expected Result:**
- ✓ Badge appears
- Shows "Verified" status
- Badge visible in profile
- Badge visible in match list

### Test Case 7.4: Safety Check in Chat
**Steps:**
1. User A tries to message User B
2. User B has User A blocked
3. User A is suspended
4. Interaction attempted

**Expected Result:**
- Blocked: message fails
- Suspended: interaction blocked
- Clear error message
- No data leak

### Test Case 7.5: Firestore Rules Enforcement
**Steps:**
1. Try to access report not owned by you
2. Try to update blocked users list
3. Try to delete verification

**Expected Result:**
- Unauthorized errors returned
- Rules prevent unauthorized access
- Data integrity maintained

---

## 8. Error & Edge Cases

### Test Case 8.1: Network Error Handling
**Steps:**
1. Turn off network
2. Try to submit report
3. Try to block user
4. Try to flag content

**Expected Result:**
- Error messages shown
- Retry options available
- Data cached for retry
- No data loss

### Test Case 8.2: Rate Limiting
**Steps:**
1. Submit 10 reports in rapid succession
2. Block 10 users rapidly
3. Flag 10 contents rapidly

**Expected Result:**
- After threshold (e.g., 5 per minute):
- 429 Too Many Requests error
- Cooldown timer shown
- Queue subsequent requests

### Test Case 8.3: Large Data Sets
**Steps:**
1. Load user with 100+ blocked users
2. Load user with 50+ reports
3. Load safety tips with many items

**Expected Result:**
- Smooth performance
- Pagination works
- No lag or crashes
- Memory efficient

### Test Case 8.4: Offline Support
**Steps:**
1. Go offline
2. Try to report, block, flag
3. Restore connectivity
4. Verify sync

**Expected Result:**
- Actions queued locally
- Data persists
- Auto-syncs when online
- No data loss

---

## Test Execution Commands

### Run All Safety Tests
```bash
npm test -- --testPathPattern=Safety
```

### Run Specific Test Suite
```bash
npm test -- --testNamePattern="Report User"
npm test -- --testNamePattern="Block User"
npm test -- --testNamePattern="Photo Verification"
```

### Backend API Tests
```bash
# Start backend
cd backend && npm start

# Test report endpoint
curl -X POST http://localhost:3000/api/safety/report \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '...'

# Test block endpoint
curl -X POST http://localhost:3000/api/safety/block \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '...'
```

---

## Test Results Documentation

**Date:** [Date of test]
**Tester:** [Name]
**Build:** [Build version]
**Platform:** iOS/Android/Both

| Test Case | Status | Notes | Time |
|-----------|--------|-------|------|
| 1.1 Report Submission | PASS ✓ | | 2min |
| 1.2 Categories | PASS ✓ | | 3min |
| ... | ... | ... | ... |

**Summary:**
- Passed: XX/45
- Failed: X/45
- Blocked: X/45
- Coverage: 100%

---

## Known Issues & Workarounds

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
| Photo upload slow on 3G | Medium | Pre-compress image | Open |
| Block UI doesn't update immediately | Low | Pull to refresh | Open |


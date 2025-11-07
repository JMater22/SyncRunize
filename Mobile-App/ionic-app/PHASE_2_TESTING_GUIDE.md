# Phase 2: Testing Guide 🧪

## Overview
This guide will help you test all the features implemented in Phase 2: User Profile & Settings.

---

## Prerequisites

### 1. Backend Setup
Ensure your backend API is running and accessible:
- Backend URL should be set in `.env` file: `VITE_API_URL=http://localhost:5000/api`
- Database should have test data (users, routes, challenges, followers)

### 2. Mobile App Setup
```bash
cd Mobile-App/ionic-app
npm install
npm run dev  # For web testing
# OR
ionic capacitor run android  # For Android device testing
```

### 3. Test Account
You'll need a test account with:
- At least 1-2 completed activities/runs
- At least 1 active challenge
- A few followers and following relationships

---

## Test Scenarios

### ✅ Test 1: User Profile Display

**Goal**: Verify that the user profile loads real data from the backend

**Steps**:
1. Log in to the app with your test account
2. Navigate to the **Profile** tab (bottom navigation)
3. Wait for the page to load (should show loading spinner)

**Expected Results**:
- ✅ Your profile picture displays (or default avatar if not set)
- ✅ Your name and username display correctly
- ✅ Location displays if you've set one
- ✅ Follower count shows real number from backend
- ✅ Following count shows real number from backend
- ✅ Badge count shows number of completed challenges
- ✅ Weekly distance chart displays with actual data from last 7 days
- ✅ If you have an active challenge, it displays with correct progress percentage
- ✅ No console errors appear

**How to Debug**:
- Open browser console (F12) and check Network tab
- Look for API calls to:
  - `/api/follows/{userId}/counts`
  - `/api/routes/user/{userId}?activities_only=true`
- Check if responses contain data

---

### ✅ Test 2: Weekly Activity Chart

**Goal**: Verify that the chart shows real activity data

**Steps**:
1. From Profile page, locate the "Distance" card
2. Observe the weekly chart (should show last 7 days)
3. Try changing the time period selector (Per Day / Per Week / Per Month)

**Expected Results**:
- ✅ Chart shows bars for each day of the week
- ✅ Days with activities show taller bars
- ✅ Days without activities show empty/minimal bars
- ✅ If no activities exist, shows "No activity data yet" message
- ✅ Time period selector works (though only "Per Week" is fully implemented)

**Test Data**:
- If you have activities in the last 7 days, bars should reflect actual distances
- Run a test activity and come back → Chart should update

---

### ✅ Test 3: Settings - Privacy Controls

**Goal**: Verify privacy settings persist to backend

**Steps**:
1. Navigate to Profile → Tap Settings icon (top right)
2. Scroll to "Privacy Controls" section
3. Find "Activity Visibility" dropdown
4. Note current value (Everyone or Private)
5. Change to the opposite value
6. Observe toast notification
7. Navigate back to Profile, then return to Settings
8. Check if the setting persisted

**Expected Results**:
- ✅ Dropdown shows current setting from backend
- ✅ Changing setting shows success toast: "Activity visibility set to [value]"
- ✅ Setting persists after navigating away and back
- ✅ Backend receives the update (check Network tab for `PUT /api/users/settings/privacy`)

**API Call to Verify**:
```
PUT /api/users/settings/privacy
Body: { "activities_visibility": "public" | "private" }
```

---

### ✅ Test 4: Settings - Distance Units

**Goal**: Verify distance unit preference persists

**Steps**:
1. From Settings page, scroll to "App Preferences"
2. Find "Distance Units" with km/mi buttons
3. Note which one is currently selected (solid fill)
4. Tap the other button (km ↔ mi)
5. Observe toast notification
6. Navigate back to Profile
7. Return to Settings
8. Verify button selection persisted

**Expected Results**:
- ✅ Currently selected unit shows solid fill, other is outline
- ✅ Changing unit shows toast: "Distance unit set to [km/mi]"
- ✅ Setting persists after navigation
- ✅ Distances throughout app should eventually reflect chosen unit
- ✅ Backend receives update (check Network tab for `PUT /api/users/update-me`)

**API Call to Verify**:
```
PUT /api/users/update-me
Body: { "distance_unit": "km" | "mi" }
```

---

### ✅ Test 5: Following Tab - View Following List

**Goal**: Verify following list loads from backend

**Steps**:
1. From Profile, tap on "Following" count (or navigate to /following)
2. Ensure "Following" tab is selected
3. Observe the list of users

**Expected Results**:
- ✅ Page shows loading spinner initially
- ✅ List displays all users you're following from backend
- ✅ Each user shows:
  - Avatar (or default)
  - Name
  - Username (with @)
  - Location (if set)
  - "Unfollow" button (red outline)
- ✅ Count at top matches number of users displayed
- ✅ If no following, shows empty state with "Find Athletes" button

**API Call to Verify**:
```
GET /api/follows/{userId}/following
```

---

### ✅ Test 6: Following Tab - Unfollow Functionality

**Goal**: Verify unfollow action works and updates backend

**Steps**:
1. From Following tab, note current count (e.g., "4")
2. Find a user you're following
3. Tap "Unfollow" button
4. Observe the UI changes

**Expected Results**:
- ✅ Button shows loading spinner while processing
- ✅ User is removed from the list immediately (optimistic update)
- ✅ Count decreases by 1
- ✅ Toast notification shows: "Unfollowed successfully"
- ✅ If you navigate to Profile and back, count remains updated
- ✅ Backend receives call (check Network tab for `POST /api/follows/{userId}/toggle`)

**How to Revert**:
- Use Search Runners page to find the user and follow them again
- Or use a database tool to restore the relationship

---

### ✅ Test 7: Followers Tab - View Followers List

**Goal**: Verify followers list loads from backend

**Steps**:
1. From Following page, tap "Followers" segment
2. Observe the list of users

**Expected Results**:
- ✅ List displays all users following you from backend
- ✅ Each user shows:
  - Avatar, name, username, location
  - Either "Following" button (solid, disabled) if you follow them back
  - Or "Follow Back" button (outline, clickable) if you don't
- ✅ Count at top matches number of displayed users
- ✅ If no followers, shows empty state message

**API Call to Verify**:
```
GET /api/follows/{userId}/followers
```

---

### ✅ Test 8: Followers Tab - Follow Back Functionality

**Goal**: Verify follow-back action works

**Steps**:
1. From Followers tab, find a user with "Follow Back" button
2. Note the current Following count
3. Tap "Follow Back" button
4. Observe UI changes

**Expected Results**:
- ✅ Button shows loading spinner
- ✅ Button changes to "Following" (solid, disabled)
- ✅ Toast notification shows: "Following back successfully"
- ✅ Switch to "Following" tab → User now appears in that list
- ✅ Following count increased by 1
- ✅ Backend receives call (check Network tab)

---

### ✅ Test 9: Push Notifications (Following Page)

**Goal**: Verify push notification handling (if you have push enabled)

**Requires**: Physical device or emulator with FCM configured

**Steps**:
1. Open Following page
2. From another account (or ask a friend), have them follow you
3. Observe the app behavior

**Expected Results**:
- ✅ Toast notification appears with message
- ✅ New follower badge count increases on "Followers" tab
- ✅ Tapping notification navigates to Followers tab
- ✅ Badge clears when viewing Followers tab

**Note**: This test requires backend push notification setup

---

### ✅ Test 10: Logout and Data Clearing

**Goal**: Verify logout clears contexts and redirects

**Steps**:
1. From Settings page, scroll to bottom
2. Tap "Log Out" button (red)
3. Observe behavior

**Expected Results**:
- ✅ Button shows "Logging out..." with disabled state
- ✅ Redirects to /authentication page
- ✅ All user data cleared from contexts
- ✅ Supabase session cleared
- ✅ Attempting to access /profile redirects to login

---

## Integration Tests

### Test A: Profile → Following → Unfollow → Profile
1. Start at Profile page, note follower count
2. Navigate to Following page
3. Unfollow a user
4. Navigate back to Profile
5. **Verify**: Following count decreased by 1

### Test B: Settings → Change Unit → Profile
1. Go to Settings, change distance to "mi"
2. Navigate to Profile
3. Check distance chart
4. **Verify**: Distances eventually display in miles (requires full distance conversion implementation)

### Test C: Complete a Run → View Profile
1. Go to Run Tracking
2. Complete a run (or simulate one)
3. Navigate to Profile
4. **Verify**: Weekly chart updates with new data
5. **Verify**: Activity count may increase

---

## Error Scenarios to Test

### Test E1: Backend Offline
1. Stop your backend server
2. Navigate to Profile page
3. **Expected**: Loading spinner, then error toast
4. **Expected**: Graceful error message, not app crash

### Test E2: Invalid Token
1. Manually clear Supabase token (localStorage)
2. Try to access Profile
3. **Expected**: Redirect to login

### Test E3: Network Timeout
1. Use browser DevTools to throttle network (Slow 3G)
2. Navigate to Following page
3. **Expected**: Longer loading time but eventual success

---

## Performance Tests

### Test P1: Multiple Rapid Navigations
1. Quickly navigate: Profile → Following → Profile → Settings → Profile
2. **Expected**: No crashes, contexts load correctly, no duplicate API calls

### Test P2: Large Following List
1. If you have 50+ following
2. Navigate to Following page
3. **Expected**: Smooth scrolling, all users render

---

## Checklist Summary

**Profile Page**:
- [ ] User info displays correctly
- [ ] Follower/following counts are accurate
- [ ] Weekly chart shows real data
- [ ] Badge count is correct
- [ ] Active challenge displays with progress
- [ ] No console errors

**Settings Page**:
- [ ] Privacy settings load correctly
- [ ] Changing privacy setting persists
- [ ] Distance unit loads correctly
- [ ] Changing distance unit persists
- [ ] Toast notifications appear
- [ ] Logout works

**Following Page**:
- [ ] Following list loads from backend
- [ ] Followers list loads from backend
- [ ] Unfollow action works
- [ ] Follow back action works
- [ ] Counts update correctly
- [ ] Empty states display properly
- [ ] Push notifications work (if configured)

---

## Known Issues / Limitations

1. **Time Period Selector**: Currently only "Per Week" view is fully implemented
2. **User Profile Navigation**: Clicking users navigates to `/user/{userId}` which doesn't exist yet (will be implemented in future phases)
3. **Distance Unit Display**: While preference saves, full app-wide conversion requires updates to all distance-displaying components

---

## Reporting Issues

If you encounter bugs, please note:
1. What you were trying to do
2. Expected behavior
3. Actual behavior
4. Console errors (if any)
5. API responses (Network tab)
6. Device/browser information

---

## Next Steps

After testing Phase 2, proceed to **Phase 3: Posts & Community Feed**!

---

**Happy Testing! 🎉**

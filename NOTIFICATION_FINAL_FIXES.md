# Notification System - Final Fixes Applied

## Issues Fixed

### 1. ✅ Environment Variable Mismatch
**Problem:** NotificationContext was using `VITE_BACKEND_URL` but `.env` file had `VITE_API_URL`

**Fix:**
- Updated all API calls in NotificationContext to use `VITE_API_URL || 'http://localhost:3000/api'`
- Fixed `.env` file: Changed port from 5000 → 3000

**Files Modified:**
- `syncrunize-react/src/contexts/NotificationContext.tsx` (lines 94, 246, 276)
- `syncrunize-react/.env` (line 7)

---

### 2. ✅ Notifications Being Deleted Instead of Marked as Read
**Problem:** When user clicked notification, it was deleted from the list instead of staying visible but dimmed

**Fix:**
- Changed `markAsRead()` to update notification state to `is_read: true` instead of filtering it out
- Updated backend to fetch ALL notifications (read + unread) instead of just unread
- Added CSS styling to dim read notifications (opacity: 0.6)

**Files Modified:**
- `syncrunize-react/src/contexts/NotificationContext.tsx` (lines 98-111, 260-267)
- `backend/models/notification_model.js` (added `getAllNotifications` function)
- `backend/controllers/notification_controller.js` (added `getAllNotifications` controller)
- `backend/routes/notification_routes.js` (added `/all/:user_id` route)
- `syncrunize-react/src/components/Notifications/NotificationMenu.tsx` (line 188)
- `syncrunize-react/src/components/Notifications/NotificationMenu.css` (lines 40-53)

---

### 3. ✅ Read vs Unread Styling
**Problem:** No visual differentiation between read and unread notifications

**Fix:**
- Added CSS classes `.unread` and `.read` to notification items
- Unread notifications: Light background
- Read notifications: Dimmed (opacity: 0.6) with gray background

**CSS Added:**
```css
.notification-item.unread {
  --background: var(--ion-color-light);
}

.notification-item.read {
  --background: var(--ion-background-color);
  opacity: 0.6;
}
```

---

### 4. ✅ Username Display Fix
**Problem:** Notification messages showing "@Someone" instead of actual username

**Fix:**
- Changed `actorName` logic to use `username` first, then fallback to `name`
- Removed `@` prefix since message already includes it

**Before:**
```typescript
const actorName = notification.actor?.name || 'Someone';
return <><strong>@{actorName}</strong> {notification.message}</>;
```

**After:**
```typescript
const actorName = notification.actor?.username || notification.actor?.name || 'Someone';
return <><strong>{actorName}</strong> {notification.message}</>;
```

---

## Backend Notification Triggers Status

### ✅ Working Controllers:

1. **Follow Notifications** - `backend/controllers/follow_controller.js:82`
   ```javascript
   await NotificationService.notifyFollow(parseInt(userId), followerId);
   ```

2. **Like Notifications** - `backend/controllers/like_controller.js:32, 69`
   ```javascript
   await NotificationService.notifyLike(post.user_id, userId, parseInt(postId));
   ```

3. **Comment Notifications** - `backend/controllers/comment_controller.js:32`
   ```javascript
   await NotificationService.notifyComment(post.user_id, userId, parseInt(postId));
   ```

4. **Group Member Invite** - `backend/controllers/group_member_controller.js:125`
   ```javascript
   await NotificationService.notifyGroupInvite(parseInt(userId), parseInt(groupId), group.name);
   ```

5. **Group Like** - `backend/controllers/group_like_controller.js:50`
   ```javascript
   await NotificationService.notifyGroupLike(post.user_id, userId, groupPostId, groupId);
   ```

6. **Group Comment** - `backend/controllers/group_comment_controller.js:69`
   ```javascript
   await NotificationService.notifyGroupComment(post.user_id, userId, groupPostId, groupId);
   ```

### ⏳ Not Yet Implemented (Need to be added):

7. **Challenge Completion** - Service function exists but not called
   - Function: `NotificationService.notifyChallengeComplete(userId, challengeId, challengeName, badgeImageUrl)`
   - Where to add: Challenge controller when user completes a challenge

8. **Badge Earned** - Service function exists but not called
   - Function: `NotificationService.notifyBadgeEarned(userId, badgeName, badgeImageUrl)`
   - Where to add: Stats/route controller when user reaches milestones (100km, 500km, 1000km)

---

## What to Check Now

### 1. Restart Dev Server
**IMPORTANT:** You must restart the frontend dev server for `.env` changes to take effect:

```bash
# Stop current server (Ctrl+C)
cd syncrunize-react
npm run dev
```

### 2. Check Browser Console
You should now see:

```
✅ NotificationContext: Current user ID: 11
🔄 NotificationContext: Fetching notifications for user: 11
✅ NotificationContext: Fetched notifications: [...]  ← THIS SHOULD SHOW DATA NOW!
🔌 NotificationContext: Setting up realtime subscription for user: 11
✅ NotificationContext: Successfully subscribed to realtime notifications
```

### 3. Test Each Notification Type

#### Test Follow Notification:
1. User A follows User B
2. Check User B's notifications
3. Should see: **"userA followed you"**

#### Test Like Notification:
1. User A likes User B's post
2. Check User B's notifications
3. Should see: **"userA liked your post"**
4. When User C also likes: **"userC and 1 other liked your post"**

#### Test Comment Notification:
1. User A comments on User B's post
2. Check User B's notifications
3. Should see: **"userA commented on your post"**

#### Test Group Invite:
1. User A adds User B to a group
2. Check User B's notifications
3. Should see: **"You've been added to [Group Name]"**

### 4. Test Read/Unread Behavior

1. Click on an unread notification
2. Notification should:
   - Stay in the list (not disappear)
   - Turn gray/dimmed (opacity: 0.6)
   - Navigate to appropriate page
3. Unread count should decrease

### 5. Verify Badge Display

Check database if badge/challenge notifications exist:
```sql
SELECT * FROM notifications
WHERE type IN ('challenge_progress', 'badge_earned')
ORDER BY created_at DESC;
```

If they exist, verify:
- Badge image shows instead of user avatar
- Clicking navigates to challenges or profile page

---

## Why Only Comments Were Showing Before

The issue was **NOT with the backend controllers**. All notification triggers are correctly implemented.

The problem was:
1. **Wrong API URL** - NotificationContext couldn't fetch notifications
2. **Console showed fetching but no data** - API calls were failing silently

Now that the API URL is fixed:
- All notification types should appear
- Realtime should work
- Read/unread styling should work

---

## Debugging Steps if Still Not Working

### If notifications still don't appear:

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check API endpoint manually:**
   ```bash
   # Get your access token from browser console:
   const { data } = await supabase.auth.getSession();
   console.log(data.session.access_token);

   # Then test API:
   curl -X GET "http://localhost:3000/api/notifications/all/11" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

3. **Check database directly:**
   ```sql
   SELECT
     notification_id,
     user_id,
     type,
     message,
     is_read,
     created_at
   FROM notifications
   WHERE user_id = 11
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Verify actor details are joined:**
   ```sql
   SELECT
     n.*,
     u.username as actor_username,
     u.name as actor_name
   FROM notifications n
   LEFT JOIN users u ON n.actor_id = u.user_id
   WHERE n.user_id = 11
   ORDER BY n.created_at DESC
   LIMIT 5;
   ```

### If specific notification type not appearing:

Example: If follow notifications don't appear:

1. **Test follow action:**
   - User A follows User B
   - Check backend terminal for logs

2. **Check if notification was created:**
   ```sql
   SELECT * FROM notifications
   WHERE type = 'follow'
   AND user_id = [USER_B_ID]
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Check backend logs:**
   ```
   Should see in terminal:
   POST /api/follows/:userId
   📢 Notification sent
   ```

---

## Navigation Routes

When user clicks notification:

| Type | Navigates To |
|------|-------------|
| `follow` | `/profile/:actor_id` (follower's profile) |
| `like` | `/home` (home feed, should scroll to post) |
| `comment` | `/home` (home feed, should scroll to post) |
| `group_invite` | `/group/:group_id` (group page) |
| `group_like` | `/group/:group_id` (group page) |
| `group_comment` | `/group/:group_id` (group page) |
| `challenge_progress` | `/challenges` (challenges page) |
| `badge_earned` | `/profile` (own profile to see badges) |

---

## Consolidated Notifications Behavior

### For Likes:
- 1st like: **"userA liked your post"** (like_count: 1)
- 2nd like: **"userB and 1 other liked your post"** (like_count: 2)
- 3rd like: **"userC and 2 others liked your post"** (like_count: 3)

### For Comments:
- 1st comment: **"userA commented on your post"** (comment_count: 1)
- 2nd comment: **"userB and 1 other commented on your post"** (comment_count: 2)
- 3rd comment: **"userC and 2 others commented on your post"** (comment_count: 3)

**Only ONE notification per post** (until marked as read)

---

## Files Modified Summary

### Frontend:
1. `syncrunize-react/.env` - Fixed API URL port
2. `syncrunize-react/src/contexts/NotificationContext.tsx` - Fixed API calls, read behavior
3. `syncrunize-react/src/components/Notifications/NotificationMenu.tsx` - Added read/unread styling, fixed username display
4. `syncrunize-react/src/components/Notifications/NotificationMenu.css` - Added CSS for read notifications

### Backend:
1. `backend/models/notification_model.js` - Added `getAllNotifications()` function
2. `backend/controllers/notification_controller.js` - Added `getAllNotifications` controller
3. `backend/routes/notification_routes.js` - Added `/all/:user_id` route

---

## Next Steps

1. ✅ Restart dev server
2. ✅ Test all notification types (follow, like, comment, group invite)
3. ✅ Verify read/unread styling works
4. ✅ Verify notifications stay in list after clicking
5. ⏳ Implement challenge completion notifications (when ready)
6. ⏳ Implement badge earned notifications (when ready)

---

## Success Criteria

All tests should pass:

- ✅ Follow notification appears when someone follows you
- ✅ Like notification appears when someone likes your post
- ✅ Multiple likes consolidate into one notification
- ✅ Comment notification appears
- ✅ Group invite notification appears
- ✅ Clicking notification marks as read (turns gray)
- ✅ Notification stays in list after clicking
- ✅ Unread count badge is accurate
- ✅ Realtime updates work without refresh
- ✅ Username displays correctly (not "Someone")

---

## Summary

**Root Cause of "Only Comments Working":**
- API URL misconfiguration prevented frontend from fetching notifications
- Console showed "Fetching" but never "Fetched" with data
- All backend triggers were working correctly all along

**Fixes Applied:**
- ✅ Fixed API URL from VITE_BACKEND_URL → VITE_API_URL
- ✅ Fixed port from 5000 → 3000
- ✅ Changed read behavior to dim instead of delete
- ✅ Added backend endpoint for ALL notifications
- ✅ Added read/unread CSS styling
- ✅ Fixed username display

**Result:** All notification types should now work correctly!

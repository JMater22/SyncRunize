# Quick Notification System Test

## Prerequisites

1. ✅ SQL alterations applied
2. ✅ Supabase Realtime enabled for `notifications` table
3. ✅ Backend server running
4. ✅ Frontend dev server running
5. ✅ Two user accounts created (User A and User B)

---

## Test 1: Check if Notifications Context is Working

### Open Browser Console (F12) and look for these logs:

#### ✅ Expected on Page Load:
```
✅ NotificationContext: Current user ID: 123
🔄 NotificationContext: Fetching notifications for user: 123
✅ NotificationContext: Fetched notifications: []
🔌 NotificationContext: Setting up realtime subscription for user: 123
🔌 NotificationContext: Realtime subscription status: SUBSCRIBING
✅ NotificationContext: Successfully subscribed to realtime notifications
```

#### ❌ Error States to Watch For:
```
❌ NotificationContext: Realtime channel error
❌ NotificationContext: Realtime subscription timed out
❌ NotificationContext: Error fetching notifications
```

---

## Test 2: Manual Notification Creation (via Backend API)

Open browser console and run:

```javascript
// Get your auth token and user ID
const session = await supabase.auth.getSession();
const token = session.data.session.access_token;

// Get your user ID
const { data: userData } = await supabase
  .from('users')
  .select('user_id')
  .eq('auth_id', session.data.session.user.id)
  .single();

const myUserId = userData.user_id;
console.log('My User ID:', myUserId);

// Create a test notification
const response = await fetch('http://localhost:3000/api/notifications/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    user_id: myUserId,
    actor_id: null,
    message: 'Test notification from browser console',
    type: 'system',
    is_read: false
  })
});

const result = await response.json();
console.log('Created notification:', result);

// You should immediately see:
// 🔔 NotificationContext: New notification INSERT: {...}
// ✅ NotificationContext: Adding new notification to state: {...}
```

### ✅ Expected Result:
- Notification appears in NotificationMenu without page refresh
- FAB button shows unread count badge
- Console shows INSERT event

---

## Test 3: Follow Notification

### Steps:
1. Log in as **User A**
2. Navigate to User B's profile
3. Click "Follow" button
4. Log in as **User B** (in different browser/incognito)
5. Check notifications

### ✅ Expected Result:
```
Notification:
👤 @userA followed you
Just now
```

### 🔍 Debug if it fails:
```javascript
// Check if follow was created in database
const { data: follows } = await supabase
  .from('follows')
  .select('*')
  .eq('following_id', userB_id)
  .order('created_at', { ascending: false })
  .limit(1);

console.log('Latest follow:', follows);

// Check if notification was created
const { data: notifs } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userB_id)
  .eq('type', 'follow')
  .order('created_at', { ascending: false })
  .limit(1);

console.log('Latest follow notification:', notifs);
```

---

## Test 4: Like Notification (Single)

### Steps:
1. Log in as **User B** and create a post
2. Log in as **User A**
3. Like User B's post
4. Check User B's notifications

### ✅ Expected Result:
```
Notification:
👤 @userA liked your post
Just now
```

---

## Test 5: Consolidated Like Notifications

### Steps:
1. User B has a post already created
2. **User A** likes the post
3. **User C** likes the same post
4. **User D** likes the same post
5. Check User B's notifications

### ✅ Expected Result (After all 3 likes):
```
Notification:
👤 @userD and 2 others liked your post
Just now
```

**Note:** Only ONE notification should exist, not three separate ones.

### 🔍 Debug with Console:
```javascript
// After each like, check the notification
const { data: likeNotifs } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userB_id)
  .eq('type', 'like')
  .eq('post_id', the_post_id)
  .eq('is_read', false);

console.log('Like notifications:', likeNotifs);
console.log('Count should be 1, not 3:', likeNotifs.length);

// Check like_count field
console.log('Like count:', likeNotifs[0]?.like_count); // Should be 3
```

### 🔍 Expected Console Logs:

**After User A likes:**
```
🔔 NotificationContext: New notification INSERT: { type: 'like', message: 'liked your post', like_count: 1 }
```

**After User C likes:**
```
🔄 NotificationContext: Notification UPDATE: { type: 'like', message: 'and 1 other liked your post', like_count: 2 }
```

**After User D likes:**
```
🔄 NotificationContext: Notification UPDATE: { type: 'like', message: 'and 2 others liked your post', like_count: 3 }
```

---

## Test 6: Comment Notification (Consolidated)

### Steps:
1. User B has a post
2. **User A** comments on the post
3. **User C** comments on the same post
4. Check User B's notifications

### ✅ Expected Result:
```
Notification:
👤 @userC and 1 other commented on your post
Just now
```

---

## Test 7: Group Invite Notification

### Steps:
1. User A creates a group
2. User A invites User B to the group
3. Check User B's notifications

### ✅ Expected Result:
```
Notification:
👥 You've been added to "Group Name"
Just now
```

---

## Test 8: Realtime Update Test

### Steps:
1. Open app in **Browser Window 1** (User B logged in)
2. Open app in **Browser Window 2** or Incognito (User A logged in)
3. In Window 2 (User A): Like User B's post
4. Watch Window 1 (User B): Notification should appear **without page refresh**

### ✅ Expected Result:
- Notification appears in Window 1 immediately
- FAB badge count increases
- Console in Window 1 shows INSERT event

---

## Test 9: Mark as Read

### Steps:
1. User B has unread notifications
2. Click on a notification
3. Verify notification disappears from list
4. Verify unread count badge decreases

### ✅ Expected Result:
- Notification is removed from list
- Unread count goes from 3 → 2
- User is navigated to appropriate page

### 🔍 Debug:
```javascript
// Before clicking
console.log('Unread count:', unreadCount); // e.g., 3

// After clicking
console.log('Unread count:', unreadCount); // e.g., 2

// Check database
const { data: unreadNotifs } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', myUserId)
  .eq('is_read', false);

console.log('Unread in DB:', unreadNotifs.length);
```

---

## Test 10: Clear All Notifications

### Steps:
1. User has multiple notifications
2. Click "Clear All" button
3. Verify all notifications are deleted
4. Verify count goes to 0

### ✅ Expected Result:
- All notifications disappear
- Unread count shows 0
- "No new notifications" message appears

---

## Common Issues During Testing

### Issue: Console shows "Error fetching notifications: Network Error"

**Cause:** Backend not running or wrong URL

**Fix:**
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check .env file
cat syncrunize-react/.env
# Should have: VITE_BACKEND_URL=http://localhost:3000
```

---

### Issue: "Realtime channel error" in console

**Cause:** Supabase Realtime not enabled

**Fix:**
1. Go to Supabase Dashboard
2. Database → Replication
3. Enable Realtime for `notifications` table

---

### Issue: Notifications exist in DB but don't appear in UI

**Cause:** API not returning actor details

**Debug:**
```javascript
// Check API response
const response = await fetch(`http://localhost:3000/api/notifications/unread/${myUserId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

const data = await response.json();
console.log('API Response:', data);

// Check if actor is included
console.log('First notification actor:', data.data[0]?.actor);
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": 1,
      "message": "liked your post",
      "actor": {
        "user_id": 456,
        "username": "john_doe",
        "name": "John Doe",
        "profile_picture": "https://..."
      }
    }
  ]
}
```

---

### Issue: Consolidated notifications creating duplicates instead of updating

**Cause:** Missing `like_count` or `comment_count` columns

**Fix:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
```

---

## Quick Database Checks

### Check if notifications are being created:
```sql
SELECT
  notification_id,
  user_id,
  type,
  message,
  like_count,
  comment_count,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Check if actor details are available:
```sql
SELECT
  n.*,
  u.username,
  u.name,
  u.profile_picture
FROM notifications n
LEFT JOIN users u ON n.actor_id = u.user_id
ORDER BY n.created_at DESC
LIMIT 5;
```

### Check if Realtime is enabled:
```sql
-- In Supabase SQL Editor, run:
SELECT tablename,
       CASE
         WHEN replica_identity = 'n' THEN 'Disabled'
         ELSE 'Enabled'
       END as realtime_status
FROM pg_tables t
LEFT JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public' AND tablename = 'notifications';
```

---

## Success Criteria

All tests should pass:

- ✅ Browser console shows successful realtime subscription
- ✅ Follow notification appears
- ✅ Single like creates notification
- ✅ Multiple likes consolidate into one notification
- ✅ Like count increments correctly (1 → 2 → 3)
- ✅ Comments consolidate like likes
- ✅ Group invite notification appears
- ✅ Realtime updates work across browser windows
- ✅ Mark as read removes notification
- ✅ Clear all deletes all notifications
- ✅ Unread count badge is accurate

---

## If All Tests Pass

Congratulations! 🎉 Your notification system is fully working.

Next steps:
1. Implement challenge completion notifications
2. Implement badge earned notifications
3. Add notification sounds (optional)
4. Add desktop notifications (optional)
5. Add push notifications for mobile (future)

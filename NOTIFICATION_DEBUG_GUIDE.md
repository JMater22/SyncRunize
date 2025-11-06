# Notification System Debugging Guide

## Issues Fixed

### 1. ✅ Missing TypeScript Interface Fields
**Problem:** NotificationContext interface was missing new fields (challenge_id, badge_name, badge_image_url, like_count, comment_count)
**Fix:** Updated Notification interface to include all fields

### 2. ✅ UPDATE Event Handler Not Fetching Actor Details
**Problem:** When notifications were updated (consolidated likes/comments), the UPDATE handler just spread the payload without fetching actor details
**Fix:** Changed UPDATE handler to fetch full notification with actor details using Supabase query

### 3. ✅ No Realtime Subscription Status Logging
**Problem:** Couldn't see if realtime was connecting successfully
**Fix:** Added subscription status callback with logging for SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED

### 4. ✅ Missing Console Debugging
**Problem:** No visibility into data flow
**Fix:** Added comprehensive console logging throughout NotificationContext

---

## Step-by-Step Debugging Process

### Step 1: Check if Supabase Realtime is Enabled

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find `notifications` table
4. Enable **Realtime** toggle
5. Verify status shows "Enabled"

**IMPORTANT:** Only enable realtime for `notifications` table, NOT for `follows`, `likes`, `comments`, etc.

---

### Step 2: Check Browser Console Logs

Open browser console (F12) and look for these logs:

#### On Page Load:
```
✅ NotificationContext: Current user ID: 123
🔄 NotificationContext: Fetching notifications for user: 123
✅ NotificationContext: Fetched notifications: [...]
🔌 NotificationContext: Setting up realtime subscription for user: 123
🔌 NotificationContext: Realtime subscription status: SUBSCRIBING
✅ NotificationContext: Successfully subscribed to realtime notifications
```

#### When Notification is Created:
```
🔔 NotificationContext: New notification INSERT: {...}
✅ NotificationContext: Adding new notification to state: {...}
```

#### When Notification is Updated (Consolidated):
```
🔄 NotificationContext: Notification UPDATE: {...}
✅ NotificationContext: Updating notification in state: {...}
```

---

### Step 3: Test Backend API Directly

#### Test 1: Get Unread Notifications
```bash
# Replace with your values
USER_ID=123
TOKEN="your_supabase_access_token"

curl -X GET "http://localhost:3000/api/notifications/unread/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": 1,
      "user_id": 123,
      "actor_id": 456,
      "message": "liked your post",
      "type": "like",
      "like_count": 1,
      "is_read": false,
      "created_at": "2025-11-06T10:00:00Z",
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

#### Test 2: Create Notification Manually
```bash
curl -X POST "http://localhost:3000/api/notifications/create" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "actor_id": 456,
    "message": "liked your post",
    "type": "like",
    "post_id": 789,
    "like_count": 1
  }'
```

---

### Step 4: Test Notification Triggers

#### Test Follow Notification:
1. Have User A follow User B
2. Check User B's notifications
3. Should see: "@userA followed you"

**Backend Logs to Check:**
```bash
# In backend terminal
POST /api/follows/:userId
✅ Follow created
📢 Notification sent to user 123
```

#### Test Like Notification:
1. Have User A like User B's post
2. Check User B's notifications
3. Should see: "@userA liked your post"

**For Consolidated Likes:**
1. User A likes post → Creates notification "userA liked your post"
2. User C likes same post → Updates notification to "userC and 1 other liked your post"
3. User D likes same post → Updates notification to "userD and 2 others liked your post"

---

### Step 5: Verify Database Records

#### Check Notifications Table:
```sql
-- In Supabase SQL Editor
SELECT
  notification_id,
  user_id,
  actor_id,
  type,
  message,
  like_count,
  comment_count,
  is_read,
  created_at
FROM notifications
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 10;
```

#### Check if Actor Details are Joined Properly:
```sql
SELECT
  n.*,
  u.username as actor_username,
  u.name as actor_name,
  u.profile_picture as actor_picture
FROM notifications n
LEFT JOIN users u ON n.actor_id = u.user_id
WHERE n.user_id = 123
ORDER BY n.created_at DESC
LIMIT 10;
```

---

## Common Issues and Solutions

### Issue 1: Notifications Not Appearing in UI

**Symptoms:**
- Notifications exist in database
- Nothing appears in NotificationMenu
- No console errors

**Debugging Steps:**
1. Check console logs - Do you see "Fetched notifications: []" or actual data?
2. Check if `VITE_BACKEND_URL` is set correctly in `.env`
3. Check if user is authenticated (session exists)
4. Verify API endpoint is accessible

**Solution:**
```typescript
// In .env file
VITE_BACKEND_URL=http://localhost:3000
```

---

### Issue 2: Realtime Not Working

**Symptoms:**
- Console shows "Realtime subscription status: CHANNEL_ERROR"
- New notifications don't appear without page refresh

**Debugging Steps:**
1. Check if Supabase Realtime is enabled for notifications table
2. Check Supabase project URL and anon key are correct
3. Check browser network tab for WebSocket connections

**Solution:**
1. Enable Realtime in Supabase Dashboard → Database → Replication
2. Verify `supabaseClient.ts` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

### Issue 3: Actor Details Missing

**Symptoms:**
- Notifications appear but show "Someone" instead of username
- No profile pictures

**Debugging Steps:**
1. Check if `actor:actor_id` join is working in Supabase query
2. Verify users table has the referenced actor_id

**Solution:**
Check the Supabase query in NotificationContext:
```typescript
const { data: newNotification } = await supabase
  .from('notifications')
  .select(`
    *,
    actor:actor_id (
      user_id,
      name,
      username,
      profile_picture
    )
  `)
  .eq('notification_id', payload.new.notification_id)
  .single();
```

If this fails, check if:
- Foreign key relationship exists between `notifications.actor_id` and `users.user_id`
- Actor user exists in users table

---

### Issue 4: Consolidated Notifications Not Updating

**Symptoms:**
- Each like creates a new notification instead of updating existing one
- Console shows INSERT instead of UPDATE

**Debugging Steps:**
1. Check if notification_service.js consolidation logic is running
2. Verify like_count and comment_count columns exist in database
3. Check if existing notification query is finding the unread notification

**Solution:**
Run SQL alterations:
```bash
psql -h your-db-host -U postgres -d postgres -f backend/sql/notification_alterations.sql
```

Or manually add columns:
```sql
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
```

---

### Issue 5: Badge Images Not Showing

**Symptoms:**
- Challenge/badge notifications appear but no image
- Default avatar shown instead

**Debugging Steps:**
1. Check if `badge_image_url` column exists in notifications table
2. Verify image exists in Supabase Storage
3. Check if bucket is public or using signed URLs

**Solution:**
1. Add column: `ALTER TABLE notifications ADD COLUMN badge_image_url TEXT NULL;`
2. Upload images to Supabase Storage → assets/badges/ and assets/challenges/
3. Make bucket public or use `getPublicUrl()`

---

## Testing Realtime with Browser Console

Open browser console and run:

```javascript
// Check if NotificationContext is loaded
console.log('Notifications:', window);

// Manually trigger a test notification
// (Replace with your actual user IDs)
await fetch('http://localhost:3000/api/notifications/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
  },
  body: JSON.stringify({
    user_id: 123,  // Your user ID
    actor_id: 456,  // Another user ID
    message: 'Test notification',
    type: 'follow'
  })
});

// You should see in console:
// 🔔 NotificationContext: New notification INSERT: {...}
```

---

## Verify All Components are Connected

### 1. Check App.tsx has NotificationProvider:
```typescript
<NotificationProvider>
  <IonReactRouter>
    {/* Your routes */}
  </IonReactRouter>
</NotificationProvider>
```

### 2. Check Home.tsx uses NotificationContext:
```typescript
const { unreadCount } = useNotifications();
```

### 3. Check NotificationMenu is rendered:
```typescript
<IonModal isOpen={showNotifications}>
  <NotificationMenu />
</IonModal>
```

---

## Success Checklist

- ✅ SQL alterations applied (like_count, comment_count, challenge_id, badge_name, badge_image_url)
- ✅ Supabase Realtime enabled for notifications table
- ✅ Console shows "Successfully subscribed to realtime notifications"
- ✅ Console shows "Fetched notifications: [...]" with data
- ✅ NotificationMenu displays notifications with avatars
- ✅ Clicking notification marks it as read and navigates
- ✅ Unread count badge appears on FAB button
- ✅ New notifications appear without page refresh
- ✅ Consolidated notifications update (like count increments)

---

## Next Steps After Debugging

Once notifications are working:

1. Test all notification types:
   - Follow
   - Like (with consolidation)
   - Comment (with consolidation)
   - Group invite
   - Group like/comment
   - Challenge completion (when implemented)
   - Badge earned (when implemented)

2. Test realtime updates:
   - Open app in two browser windows
   - Have one user like a post
   - Verify notification appears in other window without refresh

3. Performance testing:
   - Create 100+ notifications
   - Check if list scrolls smoothly
   - Verify indexes are working (queries should be < 50ms)

---

## Get Help

If you're still having issues:

1. **Check all console logs** - They will tell you exactly where the problem is
2. **Check backend logs** - See if notifications are being created
3. **Check Supabase logs** - See if realtime events are firing
4. **Verify database** - Check if records exist

**Most common issue:** Supabase Realtime not enabled for notifications table
**Second most common:** Missing SQL columns (like_count, comment_count, etc.)

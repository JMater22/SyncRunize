# Notification System Troubleshooting & Setup Guide

## Problem: Notifications in Database But Not Appearing in UI

### Step 1: Enable Supabase Realtime ⚡

**IMPORTANT**: You MUST enable realtime ONLY for the `notifications` table.

#### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**
2. Navigate to **Database → Replication** (left sidebar)
3. Look for the table list
4. Find `public.notifications` in the list
5. Toggle **"Enable Realtime"** to ON (it will turn green)
6. Wait 5-10 seconds for it to activate

**Visual Guide:**
```
Database
  └── Replication
        └── Tables
              └── ☑ notifications  <-- Toggle this ON
```

#### Method 2: Via SQL Editor

```sql
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify it's enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

### ⚠️ **DO NOT ENABLE REALTIME FOR OTHER TABLES**

You do **NOT** need realtime for:
- ❌ `follows` table
- ❌ `likes` table
- ❌ `comments` table
- ❌ `posts` table
- ❌ `groups` table
- ❌ `users` table

**Why?** These tables are read by the backend, which then creates notifications. Only the `notifications` table needs realtime to push updates to the frontend.

---

## Step 2: Verify Database Changes

Run the updated SQL file:

```sql
-- Run this in Supabase SQL Editor
-- File: backend/sql/notification_alterations.sql

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS challenge_id INTEGER NULL,
ADD COLUMN IF NOT EXISTS badge_name TEXT NULL,
ADD COLUMN IF NOT EXISTS badge_image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Update type constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (
    ARRAY[
      'follow'::text,
      'group_invite'::text,
      'like'::text,
      'comment'::text,
      'group_like'::text,
      'group_comment'::text,
      'hazard_nearby'::text,
      'hazard_update'::text,
      'system'::text,
      'challenge_progress'::text,
      'badge_earned'::text
    ]
  )
);
```

---

## Step 3: Check Browser Console

Open your browser DevTools (F12) and check for:

### ✅ Good Signs:
```javascript
// You should see these console logs:
New notification received: {new: {...}, old: null, ...}
WebSocket connection established
Realtime subscription active
```

### ❌ Bad Signs (and fixes):

**Error: "realtime subscriptions are not enabled"**
- **Fix**: Enable realtime in Supabase (Step 1)

**Error: "WebSocket connection failed"**
- **Fix**: Check your internet connection
- **Fix**: Verify Supabase URL and anon key in `.env`

**Error: "Authentication required"**
- **Fix**: Make sure user is logged in
- **Fix**: Check if session exists in NotificationProvider

**No logs at all?**
- **Fix**: Verify `NotificationProvider` wraps your app in `App.tsx`
- **Fix**: Check if `useNotifications()` is called in Home.tsx

---

## Step 4: Test Realtime Connection

Add this test to your browser console:

```javascript
// Open browser console (F12) and paste:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Test realtime subscription
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    console.log('✅ Realtime working!', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// You should see: Subscription status: SUBSCRIBED
```

---

## Step 5: Verify Notification Structure

Check if notifications are created correctly:

```sql
-- Run in Supabase SQL Editor
SELECT
  notification_id,
  user_id,
  actor_id,
  type,
  message,
  is_read,
  like_count,
  comment_count,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

**Check for:**
- ✅ `user_id` matches the logged-in user
- ✅ `is_read` is `false` for new notifications
- ✅ `type` is valid (follow, like, comment, etc.)
- ✅ `actor_id` exists for social notifications
- ✅ `like_count` and `comment_count` exist

---

## Facebook-Style Consolidated Notifications

### How It Works:

**First like:**
```
@john liked your post
```

**Second like (updates existing notification):**
```
@jane and 1 other liked your post
```

**Third like:**
```
@mike and 2 others liked your post
```

**Key Points:**
- ✅ **One notification per post** (not one per like)
- ✅ Shows most recent liker's avatar
- ✅ Updates count automatically
- ✅ Moves to top when updated (new timestamp)
- ✅ Only consolidates **unread** notifications

**Same logic for comments:**
```
@john commented on your post
@jane and 1 other commented on your post
@mike and 2 others commented on your post
```

---

## Common Issues & Solutions

### Issue 1: Multiple notifications for same post

**Cause**: Old code was creating new notification each time
**Fix**: Updated notification service now consolidates (done ✅)

### Issue 2: Notifications appear on refresh but not real-time

**Cause**: Realtime not enabled
**Fix**: Enable realtime in Supabase Dashboard (Step 1)

### Issue 3: Wrong user receiving notifications

**Cause**: `user_id` mismatch
**Fix**: Check notification creation - ensure `user_id` is post owner, not liker

### Issue 4: Avatar not showing in notifications

**Cause**: Actor details not fetched
**Fix**: Verify `NotificationContext` fetches actor with join:
```typescript
.select(`
  *,
  actor:actor_id (
    user_id,
    name,
    username,
    profile_picture
  )
`)
```

### Issue 5: Notification count not updating

**Cause**: `like_count`/`comment_count` columns missing
**Fix**: Run the updated SQL alterations (Step 2)

### Issue 6: Notifications work locally but not in production

**Cause**: Environment variables not set
**Fix**: Verify `.env` has correct values:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## Testing Checklist

Use this checklist to verify everything works:

### Backend Testing:
- [ ] SQL alterations applied (`like_count`, `comment_count` columns exist)
- [ ] Realtime enabled for `notifications` table
- [ ] Notification triggers added to controllers
- [ ] Notifications created in database when actions performed

### Frontend Testing:
- [ ] `NotificationProvider` wraps app
- [ ] Home page shows notification FAB button
- [ ] Clicking FAB opens notification modal
- [ ] Browser console shows "New notification received"
- [ ] WebSocket connection active (check Network tab)

### Functionality Testing:

**Test 1: Follow Notification**
1. User A follows User B
2. User B sees notification "@userA followed you"
3. Click notification → Navigate to User A's profile

**Test 2: Like Notification (Consolidated)**
1. User A likes User B's post
2. User B sees "@userA liked your post"
3. User C likes same post
4. User B's notification updates to "@userC and 1 other liked your post"
5. Notification moves to top

**Test 3: Comment Notification (Consolidated)**
1. User A comments on User B's post
2. User B sees "@userA commented on your post"
3. User C comments on same post
4. User B's notification updates to "@userC and 1 other commented on your post"

**Test 4: Real-time Update**
1. Open app in 2 browser windows (different users)
2. User A likes User B's post
3. User B should see notification appear **instantly** (no refresh)

---

## Debug Mode

Add this to `NotificationContext.tsx` for debugging:

```typescript
useEffect(() => {
  console.log('🔔 Notification Context Debug:', {
    currentUserId,
    notificationCount: notifications.length,
    unreadCount,
    loading
  });
}, [notifications, unreadCount, loading, currentUserId]);

// In realtime subscription:
.on('postgres_changes', ..., async (payload) => {
  console.log('🆕 New notification payload:', payload);
  console.log('📊 Notification type:', payload.new.type);
  console.log('👤 For user:', payload.new.user_id);
  console.log('🎭 From actor:', payload.new.actor_id);

  // ... rest of code
})
```

Open browser console and watch these logs as you perform actions.

---

## Performance Notes

### Why Only Enable Realtime for Notifications?

**Database Load:**
- Realtime creates WebSocket connections for EVERY client
- More tables = more connections = higher load
- We only need instant updates for notifications
- Other data can be fetched on-demand

**Example:**
- ✅ User likes post → Backend creates notification → Realtime pushes to recipient
- ❌ Don't subscribe to `likes` table → Too many updates, not needed

### Indexes Matter

The SQL file includes 10 indexes. The most important:

```sql
-- This index makes notification queries FAST
CREATE INDEX idx_notifications_user_unread_time
ON notifications (user_id, is_read, created_at DESC);
```

Without this index, fetching notifications for a user with 1000+ notifications would be slow.

---

## Still Not Working?

1. **Restart your development server** (backend and frontend)
2. **Clear browser cache** and reload
3. **Check Supabase logs** (Dashboard → Logs)
4. **Verify API responses** in Network tab
5. **Test with a fresh user account**

If still stuck, check:
- Supabase service status
- Database connection
- Network connectivity
- Browser console for errors

---

## Summary

✅ **Enable realtime** for `notifications` table ONLY
✅ **Run SQL alterations** to add `like_count` and `comment_count`
✅ **Check browser console** for realtime connection
✅ **Verify notification structure** in database
✅ **Test with multiple users** to see real-time updates
✅ **One notification per post** like Facebook ✨

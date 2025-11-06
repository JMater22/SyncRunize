# Notification System - Implementation Summary & Fixes Needed

## Current Status

### ✅ Working:
- **Comment notifications** - Fully functional with consolidation
- Frontend notification display (read/unread styling)
- Realtime subscription
- Notification fetching from backend

### ❌ Not Working:
1. **Like notifications** - Not being created in database
2. **Follow notifications** - Not being created in database
3. **Challenge completion notifications** - Not implemented yet
4. **Badge earned notifications** - Not implemented yet

---

## Root Causes

### Problem 1: Backend Logging Added But Not Tested Yet

I added comprehensive logging to `notification_service.js` but you need to:
1. **Restart backend server** (to load new logging code)
2. **Test like action** and check backend terminal
3. **Test follow action** and check backend terminal

The logs will show:
- `📢 NotificationService.notifyLike CALLED:` - Function was called
- `✅ NotificationService.notifyLike: Created notification:` - Success
- `❌ NotificationService.notifyLike ERROR:` - Error occurred

### Problem 2: Challenge Completion Has No Notification Trigger

Found in `backend/models/user_challenge_model.js` line 158:
```javascript
export const setProgress = async (userChallengeId, fields) => {
  // Updates challenge progress but NEVER calls notification service
}
```

**Missing:** Notification trigger when `completed` changes from `false` to `true`

---

## Fixes Needed

### Fix 1: Add Challenge Completion Notification

Update `backend/models/user_challenge_model.js`:

```javascript
import * as NotificationService from "../services/notification_service.js";
import { supabase } from "../utils/supabase.js";

export const setProgress = async (userChallengeId, fields) => {
  const {
    total_distance_km,
    total_runs,
    progress_percent,
    completed,
    awarded_badge_id,
  } = fields;

  // Get current challenge state BEFORE update
  const { data: before } = await supabase
    .from("user_challenges")
    .select("completed, user_id, challenge_id")
    .eq("user_challenge_id", userChallengeId)
    .single();

  // Update challenge progress
  const { data, error } = await supabase
    .from("user_challenges")
    .update({
      total_distance_km,
      total_runs,
      progress_percent,
      completed,
      awarded_badge_id,
      updated_at: new Date().toISOString()
    })
    .eq("user_challenge_id", userChallengeId)
    .select()
    .single();

  if (error) throw error;

  // 🔔 Send notification if challenge was just completed
  if (completed && !before.completed) {
    console.log('🎉 Challenge completed! Sending notification...');

    // Get challenge details
    const { data: challenge } = await supabase
      .from("challenges")
      .select("name, image_url")
      .eq("challenge_id", before.challenge_id)
      .single();

    if (challenge) {
      // Get badge image URL if exists
      let badgeImageUrl = null;
      if (challenge.image_url) {
        const { data: imageData } = supabase.storage
          .from('assets')
          .getPublicUrl(`challenges/${challenge.image_url}`);
        badgeImageUrl = imageData.publicUrl;
      }

      // Send notification
      await NotificationService.notifyChallengeComplete(
        before.user_id,
        before.challenge_id,
        challenge.name,
        badgeImageUrl
      );
    }
  }

  return data;
};
```

---

## Testing Steps

### Step 1: Test Like Notifications

1. **Restart backend server**
2. **Like a post** (from different user)
3. **Check backend terminal** for:
   ```
   📢 NotificationService.notifyLike CALLED: { postOwnerId: 11, likerId: 9, postId: 123 }
   📝 NotificationService.notifyLike: Creating new notification
   ✅ NotificationService.notifyLike: Created notification: {...}
   ```

4. **If you see the logs** → Notification service is working, check:
   - Was notification created in database?
   - Does it appear in frontend?

5. **If you DON'T see the logs** → Controller isn't calling notification service:
   - Check `like_controller.js` line 32 and 69
   - Verify `NotificationService` is imported
   - Check if there's an error in controller

### Step 2: Test Follow Notifications

1. **Follow someone**
2. **Check backend terminal** for:
   ```
   📢 NotificationService.notifyFollow CALLED: { followedUserId: 11, followerUserId: 9 }
   ✅ NotificationService.notifyFollow SUCCESS: {...}
   ```

3. Check if notification appears in database and frontend

### Step 3: Test Challenge Completion

After applying Fix 1:

1. **Complete a challenge** (reach 100% progress)
2. **Check backend terminal** for:
   ```
   🎉 Challenge completed! Sending notification...
   📢 NotificationService.notifyChallengeComplete CALLED: {...}
   ✅ NotificationService.notifyChallengeComplete: Created notification
   ```

3. **Check frontend** - Should see notification with challenge badge image

---

## Database Schema Verification

Your schema looks perfect! ✅

```sql
create table public.notifications (
  notification_id serial not null,
  user_id integer not null,
  actor_id integer null,
  message text not null,
  type text not null,
  -- Post/Group references
  post_id integer null,
  group_post_id integer null,
  group_id integer null,
  -- Challenge/Badge fields (PRESENT ✅)
  challenge_id integer null,
  badge_name text null,
  badge_image_url text null,
  like_count integer null default 0,
  comment_count integer null default 0,
  -- Status fields
  is_read boolean null default false,
  push_status text null default 'pending'::text,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  -- Constraints
  constraint notifications_pkey primary key (notification_id),
  constraint notifications_challenge_id_fkey foreign KEY (challenge_id)
    references challenges (challenge_id) on delete set null,
  constraint notifications_type_check check (
    type = any (array[
      'follow'::text,
      'group_invite'::text,
      'like'::text,
      'comment'::text,
      'group_like'::text,
      'group_comment'::text,
      'hazard_nearby'::text,
      'hazard_update'::text,
      'system'::text,
      'challenge_progress'::text,  -- ✅
      'badge_earned'::text          -- ✅
    ])
  )
);
```

All required indexes are present ✅

---

## Quick Diagnostic Commands

### Check if notifications are being created:

```sql
-- Check all notification types
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Should see:
-- comment | 3
-- like    | 0  ← If 0, likes aren't being created
-- follow  | 0  ← If 0, follows aren't being created
```

### Check if like controller is being called:

```sql
-- Check if likes exist in likes table
SELECT COUNT(*) FROM likes;

-- If likes exist but no notifications, controller isn't calling notification service
```

### Check backend terminal when liking:

Should see something like:
```
POST /api/likes/:postId
200 OK
📢 NotificationService.notifyLike CALLED: {...}
```

If you DON'T see the notification log, the controller code isn't executing the notification call.

---

## Summary

**To fix all notification issues:**

1. ✅ **Restart backend** - Load new logging code
2. ✅ **Test likes** - Check backend logs to see if function is called
3. ✅ **Test follows** - Check backend logs
4. ✅ **Apply Fix 1** - Add challenge completion notification to `user_challenge_model.js`
5. ✅ **Test challenge completion** - Verify notification appears

**Most likely issue with likes/follows:**
- Backend terminal will show if the notification functions are being called
- If called but failing, logs will show the error
- If not called at all, we need to check controller routing

**After testing, please share:**
1. Backend terminal output when you like a post
2. Backend terminal output when you follow someone
3. Result of SQL query: `SELECT type, COUNT(*) FROM notifications GROUP BY type`

This will tell us exactly where the problem is!

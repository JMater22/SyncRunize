# Notification Examples - Before & After

## ❌ OLD BEHAVIOR (Multiple Notifications)

**What happens when 3 users like the same post:**

```
┌──────────────────────────────────────┐
│ @mike liked your post                │  ← 3rd notification
│ 2 minutes ago                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ @jane liked your post                │  ← 2nd notification
│ 5 minutes ago                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ @john liked your post                │  ← 1st notification
│ 10 minutes ago                       │
└──────────────────────────────────────┘
```

**Problems:**
- ❌ Cluttered notification list
- ❌ Hard to track which post
- ❌ Annoying for users
- ❌ Database grows fast

---

## ✅ NEW BEHAVIOR (Facebook-Style Consolidated)

**What happens when 3 users like the same post:**

```
┌──────────────────────────────────────┐
│ @mike and 2 others liked your post  │  ← ONE notification
│ 2 minutes ago                        │     (updates each time)
└──────────────────────────────────────┘
```

**Benefits:**
- ✅ Clean notification list
- ✅ Shows most recent liker
- ✅ Shows total count
- ✅ Less database rows
- ✅ Better UX (like Facebook)

---

## How It Works Step-by-Step

### Scenario: Post gets 5 likes

**Step 1: First like**
```
User: John likes post #123
Backend: Creates new notification
Database:
  notification_id: 1
  actor_id: john_id
  message: "liked your post"
  like_count: 1

Frontend shows:
┌──────────────────────────────────────┐
│ 👤 @john liked your post             │
│ Just now                             │
└──────────────────────────────────────┘
```

**Step 2: Second like**
```
User: Jane likes same post #123
Backend: Finds existing unread notification for post #123
Backend: Updates notification (not creates new)
Database:
  notification_id: 1  ← Same ID!
  actor_id: jane_id   ← Updated to most recent
  message: "and 1 other liked your post"
  like_count: 2       ← Incremented
  created_at: NOW     ← Updated (moves to top)

Frontend shows:
┌──────────────────────────────────────┐
│ 👤 @jane and 1 other liked your post │
│ Just now                             │
└──────────────────────────────────────┘
```

**Step 3: Third like**
```
User: Mike likes same post #123
Backend: Updates same notification again
Database:
  notification_id: 1  ← Still same ID!
  actor_id: mike_id   ← Updated to Mike
  message: "and 2 others liked your post"
  like_count: 3       ← Incremented
  created_at: NOW     ← Updated

Frontend shows:
┌──────────────────────────────────────┐
│ 👤 @mike and 2 others liked your post│
│ Just now                             │
└──────────────────────────────────────┘
```

**Step 4: User marks as read**
```
User: Clicks notification, marks as read
Database:
  notification_id: 1
  is_read: true       ← Marked as read

Now if anyone else likes:
Backend: Creates NEW notification (previous is read)
```

**Step 5: Fourth like (after marking read)**
```
User: Alice likes same post #123
Backend: Previous notification is read, creates new
Database:
  notification_id: 2  ← New notification
  actor_id: alice_id
  message: "liked your post"
  like_count: 1       ← Starts fresh
  is_read: false

Frontend shows:
┌──────────────────────────────────────┐
│ 👤 @alice liked your post            │  ← New unread
│ Just now                             │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ @mike and 2 others liked your post  │  ← Old read
│ 10 minutes ago                       │     (grayed out)
└──────────────────────────────────────┘
```

---

## Comment Notifications Work The Same Way

**Multiple comments on same post:**

```
┌──────────────────────────────────────┐
│ 👤 @sarah and 3 others commented on  │
│    your post                         │
│ 5 minutes ago                        │
└──────────────────────────────────────┘
```

Instead of:
```
❌ @sarah commented on your post
❌ @mike commented on your post
❌ @jane commented on your post
❌ @john commented on your post
```

---

## Group Notifications

Group likes and comments also consolidate:

```
┌──────────────────────────────────────┐
│ 👤 @mike and 5 others liked your    │
│    group post                        │
│ 2 minutes ago                        │
└──────────────────────────────────────┘
```

---

## Other Notification Types (No Consolidation)

These notification types do NOT consolidate:

### Follow Notifications
```
┌──────────────────────────────────────┐
│ 👤 @john followed you                │
│ 5 minutes ago                        │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 👤 @jane followed you                │
│ 10 minutes ago                       │
└──────────────────────────────────────┘
```
**Why?** Each follow is a separate social connection.

### Challenge/Badge Notifications
```
┌──────────────────────────────────────┐
│ 🏆 Congratulations! You completed    │
│    "Couch to 5K"                     │
│ 1 hour ago                           │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 🏅 You've earned a new badge: Bronze!│
│ 2 hours ago                          │
└──────────────────────────────────────┘
```
**Why?** Each achievement is unique and important.

### Group Invites
```
┌──────────────────────────────────────┐
│ 👥 You've been added to "Running     │
│    Club SF"                          │
│ 30 minutes ago                       │
└──────────────────────────────────────┘
```
**Why?** Each group invite needs separate action.

---

## Code Changes

### Before (Creates New Each Time):
```javascript
// OLD CODE - Don't use this
export const notifyLike = async (postOwnerId, likerId, postId) => {
  await NotificationModel.createNotification({
    user_id: postOwnerId,
    actor_id: likerId,
    message: "liked your post",
    type: "like",
    post_id: postId,
  });
};
```

### After (Consolidates):
```javascript
// NEW CODE - Now used
export const notifyLike = async (postOwnerId, likerId, postId) => {
  // Check if unread notification exists for this post
  const { data: existingNotif } = await supabase
    .from("notifications")
    .select("notification_id, like_count")
    .eq("user_id", postOwnerId)
    .eq("post_id", postId)
    .eq("type", "like")
    .eq("is_read", false)
    .single();

  if (existingNotif) {
    // Update existing notification
    const newCount = (existingNotif.like_count || 1) + 1;
    await supabase
      .from("notifications")
      .update({
        actor_id: likerId,
        message: newCount === 2
          ? "and 1 other liked your post"
          : `and ${newCount - 1} others liked your post`,
        like_count: newCount,
        created_at: new Date().toISOString()
      })
      .eq("notification_id", existingNotif.notification_id);
  } else {
    // Create new notification
    await NotificationModel.createNotification({
      user_id: postOwnerId,
      actor_id: likerId,
      message: "liked your post",
      type: "like",
      post_id: postId,
      like_count: 1,
    });
  }
};
```

---

## Database Schema Changes

### New Columns Added:
```sql
ALTER TABLE notifications
ADD COLUMN like_count INTEGER DEFAULT 0,
ADD COLUMN comment_count INTEGER DEFAULT 0;
```

### Example Row (Consolidated):
```
notification_id: 123
user_id: 456
actor_id: 789         ← Most recent liker
type: 'like'
message: 'and 2 others liked your post'
post_id: 101
like_count: 3         ← Total likes
is_read: false
created_at: '2025-11-06 10:30:00'
```

---

## Testing

### Test Script:

```javascript
// Run this in browser console to test

// Simulate 5 users liking same post
async function testConsolidation() {
  const postId = 123;
  const postOwnerId = 456;

  // Like 1
  await NotificationService.notifyLike(postOwnerId, 111, postId);
  console.log('Like 1: Should show "@user111 liked your post"');

  await sleep(2000);

  // Like 2
  await NotificationService.notifyLike(postOwnerId, 222, postId);
  console.log('Like 2: Should show "@user222 and 1 other liked your post"');

  await sleep(2000);

  // Like 3
  await NotificationService.notifyLike(postOwnerId, 333, postId);
  console.log('Like 3: Should show "@user333 and 2 others liked your post"');

  // Check notification count
  const { data } = await supabase
    .from('notifications')
    .select('count(*)')
    .eq('user_id', postOwnerId)
    .eq('post_id', postId)
    .eq('type', 'like')
    .eq('is_read', false);

  console.log('Total notifications:', data);
  // Should be 1, not 3!
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testConsolidation();
```

---

## Summary

| Feature | Old | New |
|---------|-----|-----|
| Likes per post | Multiple notifications | One notification (updated) |
| Database rows | 1 per like | 1 per post (until read) |
| User experience | Cluttered | Clean, like Facebook |
| Avatar shown | First liker | Most recent liker |
| Count display | No | Yes ("and 2 others") |
| Timestamp | Original | Updates to most recent |
| Realtime updates | ❌ | ✅ |

**Result:** Much better UX and cleaner database! 🎉

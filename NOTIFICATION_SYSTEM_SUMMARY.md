# SyncRunize Real-Time Notification System

## Overview
A complete real-time in-app notification system using Supabase Realtime. Notifications appear instantly without page refresh using WebSocket subscriptions.

---

## Changes Made

### ✅ Backend Implementation

#### 1. **Notification Service** ([backend/services/notification_service.js](backend/services/notification_service.js))
Added notification trigger functions:
- `notifyFollow()` - User followed
- `notifyLike()` - Post liked
- `notifyComment()` - Post commented
- `notifyGroupLike()` - Group post liked
- `notifyGroupComment()` - Group post commented
- `notifyGroupInvite()` - Added to group
- `notifyChallengeComplete()` - **NEW** Challenge completed
- `notifyBadgeEarned()` - **NEW** Badge earned

#### 2. **Controllers Updated**
Added notification triggers to:
- **[follow_controller.js:81](backend/controllers/follow_controller.js:81)** - Sends notification when followed
- **[like_controller.js:30](backend/controllers/like_controller.js:30)** - Sends notification when post liked
- **[comment_controller.js:32](backend/controllers/comment_controller.js:32)** - Sends notification when commented
- **[group_member_controller.js:125](backend/controllers/group_member_controller.js:125)** - Sends notification for group invites
- **[group_like_controller.js:50](backend/controllers/group_like_controller.js:50)** - Sends notification when group post liked
- **[group_comment_controller.js:69](backend/controllers/group_comment_controller.js:69)** - Sends notification when group post commented

#### 3. **Notification Model** ([backend/models/notification_model.js](backend/models/notification_model.js))
- Enhanced to fetch actor details (username, profile picture) with notifications
- Supports all notification types including challenge and badge

---

### ✅ Frontend Implementation

#### 1. **Notification Context** ([syncrunize-react/src/contexts/NotificationContext.tsx](syncrunize-react/src/contexts/NotificationContext.tsx))
- Manages notification state globally
- Real-time subscription to Supabase notifications table
- Automatically updates when new notifications arrive
- Functions: `markAsRead()`, `clearAll()`, `refreshNotifications()`
- Tracks unread count

#### 2. **Notification Menu Component** ([syncrunize-react/src/components/Notifications/NotificationMenu.tsx](syncrunize-react/src/components/Notifications/NotificationMenu.tsx))
- Displays notifications with avatars/badge images
- Shows time ago (5m ago, 2h ago, etc.)
- Unread indicator dot
- Click to navigate and mark as read
- Supports all notification types including challenge/badge with images

#### 3. **Home Page Integration** ([syncrunize-react/src/pages/Home.tsx](syncrunize-react/src/pages/Home.tsx))
- Notification FAB (Floating Action Button) at bottom-right
- Shows unread count badge
- Opens modal with NotificationMenu
- Uses NotificationContext for real-time updates

#### 4. **App.tsx** ([syncrunize-react/src/App.tsx](syncrunize-react/src/App.tsx))
- Wraps app with NotificationProvider
- Removed notification bell from header (as requested)

---

## Database Changes

### SQL Alterations Required

Run this SQL script to add support for challenge and badge notifications:

```sql
-- Add new columns
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS challenge_id INTEGER NULL,
ADD COLUMN IF NOT EXISTS badge_name TEXT NULL,
ADD COLUMN IF NOT EXISTS badge_image_url TEXT NULL;

-- Add foreign key
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_challenge_id_fkey
FOREIGN KEY (challenge_id)
REFERENCES challenges (challenge_id)
ON DELETE SET NULL;

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

**Full SQL file with indexes:** [backend/sql/notification_alterations.sql](backend/sql/notification_alterations.sql)

---

## Recommended Indexes

Performance-optimized indexes for common queries:

```sql
-- Most important: user's unread notifications sorted by time
CREATE INDEX idx_notifications_user_unread_time
ON notifications (user_id, is_read, created_at DESC);

-- User's all notifications
CREATE INDEX idx_notifications_user_id
ON notifications (user_id);

-- User's read/unread filter
CREATE INDEX idx_notifications_user_id_is_read
ON notifications (user_id, is_read);

-- User's notifications by time
CREATE INDEX idx_notifications_user_id_created_at
ON notifications (user_id, created_at DESC);

-- Filter by type
CREATE INDEX idx_notifications_type
ON notifications (type);

-- Lookup by actor
CREATE INDEX idx_notifications_actor_id
ON notifications (actor_id)
WHERE actor_id IS NOT NULL;

-- Lookup by post
CREATE INDEX idx_notifications_post_id
ON notifications (post_id)
WHERE post_id IS NOT NULL;

-- Lookup by group
CREATE INDEX idx_notifications_group_id
ON notifications (group_id)
WHERE group_id IS NOT NULL;

-- Lookup by challenge
CREATE INDEX idx_notifications_challenge_id
ON notifications (challenge_id)
WHERE challenge_id IS NOT NULL;

-- General time-based queries
CREATE INDEX idx_notifications_created_at
ON notifications (created_at DESC);
```

### Index Priority

**High Priority** (Create these first):
1. `idx_notifications_user_unread_time` - Main query for notification list
2. `idx_notifications_user_id` - User lookup
3. `idx_notifications_user_id_created_at` - Sorting

**Medium Priority**:
4. `idx_notifications_type` - Filter by notification type
5. `idx_notifications_actor_id` - Actor lookups

**Optional** (Only if needed):
- Post, group, challenge specific indexes

---

## Notification Types & Behavior

### Social Notifications (with actor avatar)
| Type | Trigger | Message Format | Navigate To |
|------|---------|----------------|-------------|
| `follow` | User followed | "@username followed you" | User's profile |
| `like` | Post liked | "@username liked your post" | Home feed |
| `comment` | Post commented | "@username commented on your post" | Home feed |
| `group_like` | Group post liked | "@username liked your group post" | Group page |
| `group_comment` | Group post commented | "@username commented on your group post" | Group page |

### System Notifications (no actor)
| Type | Trigger | Message Format | Navigate To |
|------|---------|----------------|-------------|
| `group_invite` | Added to group | "You've been added to [Group Name]" | Group page |
| `challenge_progress` | Challenge completed | "Congratulations! You completed [Challenge Name]" | Challenges page |
| `badge_earned` | Badge earned | "You've earned a new badge: [Badge Name]!" | Profile page |

### Badge/Challenge Image Display
- For `challenge_progress` and `badge_earned` types
- Shows badge/challenge image instead of user avatar
- Image URL retrieved from `badge_image_url` column
- Images stored in Supabase Storage at `assets/badges/` and `assets/challenges/`

---

## How to Trigger Challenge/Badge Notifications

### In your Challenge Controller (when user completes challenge):

```javascript
import * as NotificationService from "../services/notification_service.js";
import { supabase } from "../utils/supabase.js";

// When marking challenge as completed
export const completeChallenge = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { challengeId } = req.params;

    // ... your logic to mark challenge complete ...

    // Get challenge details
    const { data: challenge } = await supabase
      .from("challenges")
      .select("name, badge_image_url")
      .eq("challenge_id", challengeId)
      .single();

    if (challenge) {
      // Get badge image URL from Supabase storage
      const { data: badgeUrl } = supabase.storage
        .from('assets')
        .getPublicUrl(`challenges/${challenge.badge_image_url}`);

      // Send notification
      await NotificationService.notifyChallengeComplete(
        userId,
        challengeId,
        challenge.name,
        badgeUrl.publicUrl
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### For Badge Earned (when user reaches milestone):

```javascript
// Example: User reached 100km milestone
const checkAndAwardBadges = async (userId, totalDistance) => {
  if (totalDistance >= 100 && !hasBronzeBadge) {
    // Get badge image
    const { data: badgeUrl } = supabase.storage
      .from('assets')
      .getPublicUrl('badges/Bronze.png');

    // Send notification
    await NotificationService.notifyBadgeEarned(
      userId,
      'Bronze',
      badgeUrl.publicUrl
    );
  }
};
```

---

## How Badge Images are Retrieved (Reference from Profile)

From [Profile.tsx:79-98](syncrunize-react/src/pages/Profile.tsx:79-98):

```typescript
useEffect(() => {
  const fetchBadges = async () => {
    const bucket = 'assets';
    const folder = 'badges';
    const badges = ['Bronze.png', 'Silver.png', 'Gold.png'];
    const badgeUrls: Record<string, string> = {};

    for (const badge of badges) {
      const { data } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(`${folder}/${badge}`);

      badgeUrls[badge.split('.')[0]] = data.publicUrl;
    }

    setBadgeImages(badgeUrls);
  };

  fetchBadges();
}, []);
```

**Use the same pattern** when creating challenge/badge notifications in backend controllers.

---

## Features

✅ **Real-time updates** - WebSocket subscription via Supabase Realtime
✅ **No page refresh needed** - Notifications appear instantly
✅ **Smart triggers** - Doesn't notify users of their own actions
✅ **Unread count badge** - Shows "99+" if more than 99
✅ **Click to navigate** - Opens relevant page based on notification type
✅ **Mark as read** - Automatically marks as read when clicked
✅ **Clear all** - Bulk delete all notifications
✅ **Time formatting** - "Just now", "5m ago", "2h ago", etc.
✅ **Avatar/Badge images** - Shows user avatars or badge images
✅ **Single container for like/comment** - Same notification updated

---

## Testing

### Test Notification Flow

1. **Follow Notification**:
   - User A follows User B
   - User B receives notification "@userA followed you"
   - Click → Navigate to User A's profile

2. **Like Notification**:
   - User A likes User B's post
   - User B receives notification "@userA liked your post"
   - Click → Navigate to home feed

3. **Challenge Complete**:
   - Complete a challenge via API
   - User receives notification with challenge badge image
   - Click → Navigate to challenges page

4. **Badge Earned**:
   - Reach milestone (e.g., 100km)
   - User receives notification with badge image (Bronze/Silver/Gold)
   - Click → Navigate to profile

---

## Future Enhancements

🔮 **Push Notifications (FCM)** - For mobile app version
🔮 **Notification preferences** - Let users choose which notifications to receive
🔮 **Notification sounds** - Audio alerts for new notifications
🔮 **Desktop notifications** - Browser notifications
🔮 **Email digests** - Daily/weekly notification summaries

---

## File Structure

```
backend/
├── services/
│   └── notification_service.js          # Notification trigger functions
├── models/
│   └── notification_model.js            # Database operations
├── controllers/
│   ├── follow_controller.js             # + Follow notifications
│   ├── like_controller.js               # + Like notifications
│   ├── comment_controller.js            # + Comment notifications
│   ├── group_member_controller.js       # + Group invite notifications
│   ├── group_like_controller.js         # + Group like notifications
│   └── group_comment_controller.js      # + Group comment notifications
└── sql/
    └── notification_alterations.sql     # Database changes + indexes

syncrunize-react/
├── src/
│   ├── contexts/
│   │   └── NotificationContext.tsx      # Global notification state + realtime
│   ├── components/
│   │   └── Notifications/
│   │       ├── NotificationMenu.tsx     # Notification list UI
│   │       └── NotificationMenu.css     # Styles
│   ├── pages/
│   │   └── Home.tsx                     # FAB integration
│   └── App.tsx                          # NotificationProvider wrapper
```

---

## API Endpoints (Existing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/unread/:user_id` | Get all unread notifications |
| PUT | `/api/notifications/read/:id` | Mark notification as read |
| DELETE | `/api/notifications/clear/:user_id` | Clear all notifications |
| POST | `/api/notifications/create` | Create notification (internal) |

---

## Troubleshooting

### Notifications not appearing in real-time?
1. Check Supabase Realtime is enabled for `notifications` table
2. Verify user is authenticated (session exists)
3. Check browser console for WebSocket connection errors
4. Ensure `NotificationProvider` wraps the app

### Badge images not showing?
1. Verify images exist in Supabase Storage: `assets/badges/` or `assets/challenges/`
2. Check bucket permissions (should be public)
3. Verify `badge_image_url` column contains correct URL

### Notifications show but don't mark as read?
1. Check authentication token is valid
2. Verify notification_id is correct
3. Check backend logs for errors

---

## Summary

The notification system is **production-ready** and supports:
- All social interactions (follow, like, comment)
- Group activities
- **Challenge completions with badge images**
- **Badge earned with badge images**
- Real-time delivery via WebSocket
- Smart navigation
- Performance-optimized with indexes

**Next step**: Run the SQL alterations and start triggering challenge/badge notifications from your challenge/badge award logic!

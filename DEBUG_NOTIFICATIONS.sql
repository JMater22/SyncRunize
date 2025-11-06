-- Run this in Supabase SQL Editor to check notifications

-- 1. Check all recent notifications
SELECT
  notification_id,
  user_id,
  actor_id,
  type,
  message,
  is_read,
  created_at,
  like_count,
  comment_count
FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check notifications by type
SELECT
  type,
  COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- 3. Check if actor details exist
SELECT
  n.notification_id,
  n.type,
  n.message,
  n.actor_id,
  u.username as actor_username,
  u.name as actor_name,
  n.created_at
FROM notifications n
LEFT JOIN users u ON n.actor_id = u.user_id
ORDER BY n.created_at DESC
LIMIT 10;

-- 4. Check for a specific user (replace 11 with your user_id)
SELECT
  notification_id,
  type,
  message,
  actor_id,
  is_read,
  created_at
FROM notifications
WHERE user_id = 11
ORDER BY created_at DESC;

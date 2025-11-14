-- ============================================
-- NOTIFICATION TABLE ALTERATIONS
-- Add support for challenge and badge notifications
-- ============================================

-- Add new columns for challenge and badge notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS challenge_id INTEGER NULL,
ADD COLUMN IF NOT EXISTS badge_name TEXT NULL,
ADD COLUMN IF NOT EXISTS badge_image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS like_count INTEGER NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER NULL DEFAULT 0;

-- Add foreign key constraint for challenge_id (safe re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_challenge_id_fkey'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_challenge_id_fkey
    FOREIGN KEY (challenge_id)
    REFERENCES challenges (challenge_id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Update the type check constraint to include new notification types
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
      'hazard_alert'::text,
      'traffic_alert'::text,
      'system'::text,
      'challenge_progress'::text,
      'badge_earned'::text
    ]
  )
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Index on user_id for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON public.notifications (user_id);

-- Index on user_id + is_read for filtering unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read
ON public.notifications (user_id, is_read);

-- Index on user_id + created_at for sorting by time
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
ON public.notifications (user_id, created_at DESC);

-- Composite index for the most common query (unread notifications sorted by time)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_time
ON public.notifications (user_id, is_read, created_at DESC);

-- Index on type for filtering by notification type
CREATE INDEX IF NOT EXISTS idx_notifications_type
ON public.notifications (type);

-- Index on actor_id for quick lookup of notifications from a specific user
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id
ON public.notifications (actor_id)
WHERE actor_id IS NOT NULL;

-- Index on post_id for finding notifications related to a specific post
CREATE INDEX IF NOT EXISTS idx_notifications_post_id
ON public.notifications (post_id)
WHERE post_id IS NOT NULL;

-- Index on group_id for finding notifications related to a specific group
CREATE INDEX IF NOT EXISTS idx_notifications_group_id
ON public.notifications (group_id)
WHERE group_id IS NOT NULL;

-- Index on challenge_id for finding notifications related to a specific challenge
CREATE INDEX IF NOT EXISTS idx_notifications_challenge_id
ON public.notifications (challenge_id)
WHERE challenge_id IS NOT NULL;

-- Index on created_at for general time-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON public.notifications (created_at DESC);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.notifications.challenge_id IS 'ID of the challenge if notification is related to challenge completion';
COMMENT ON COLUMN public.notifications.badge_name IS 'Name of the badge for badge_earned notifications (e.g., Bronze, Silver, Gold)';
COMMENT ON COLUMN public.notifications.badge_image_url IS 'URL of the badge or challenge image from Supabase storage';
COMMENT ON COLUMN public.notifications.like_count IS 'Number of likes in consolidated notification (Facebook-style)';
COMMENT ON COLUMN public.notifications.comment_count IS 'Number of comments in consolidated notification (Facebook-style)';

-- ============================================
-- ADDITIONAL RECOMMENDATIONS
-- ============================================

-- Consider adding a vacuum/analyze after creating indexes on large tables
-- VACUUM ANALYZE public.notifications;

-- Monitor index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'notifications'
-- ORDER BY idx_scan;

-- If certain indexes are never used, consider dropping them:
-- DROP INDEX IF EXISTS index_name;

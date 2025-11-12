-- Notifications table stores in-app and push notifications for users
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,

  -- Optional references to related entities
  post_id INTEGER REFERENCES public.posts(post_id) ON DELETE CASCADE,
  group_post_id INTEGER REFERENCES public.group_posts(group_post_id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES public.groups(group_id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
  report_id INTEGER REFERENCES public.hazards(report_id) ON DELETE CASCADE,

  -- Metadata
  distance_km DECIMAL(10,2),
  badge_name VARCHAR(100),
  badge_image_url TEXT,
  like_count INTEGER,
  comment_count INTEGER,

  -- Status tracking
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  push_status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.notifications IS 'Stores all user notifications including push notifications, likes, comments, challenges, and hazard alerts.';
COMMENT ON COLUMN public.notifications.type IS 'Types: follow, like, comment, group_like, group_comment, group_invite, challenge_progress, badge_earned, hazard_alert, traffic_alert';
COMMENT ON COLUMN public.notifications.push_status IS 'Status: pending, sent, failed, skipped';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who triggered the notification (e.g., who liked your post)';
COMMENT ON COLUMN public.notifications.report_id IS 'Reference to hazard/traffic report for alert notifications';

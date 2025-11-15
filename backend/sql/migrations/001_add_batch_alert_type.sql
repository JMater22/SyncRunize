-- Migration: Add batch_alert type to notifications table
-- Date: 2025-01-15
-- Description: Allows batch_alert as a valid notification type for combined hazard/cluster alerts

-- Drop the existing CHECK constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated CHECK constraint with batch_alert included
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'follow',
    'like',
    'comment',
    'group_like',
    'group_comment',
    'group_invite',
    'challenge_progress',
    'badge_earned',
    'hazard_alert',
    'traffic_alert',
    'batch_alert'  -- ✅ New type for batched alerts
  )
);

-- Update the comment to reflect the new type
COMMENT ON COLUMN public.notifications.type IS 'Types: follow, like, comment, group_like, group_comment, group_invite, challenge_progress, badge_earned, hazard_alert, traffic_alert, batch_alert';

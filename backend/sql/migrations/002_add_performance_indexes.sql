-- ========================================
-- PERFORMANCE OPTIMIZATION: Add Critical Indexes
-- ========================================
-- Purpose: Eliminate slow queries on foreign keys and frequently queried columns
-- Expected Impact: 50-70% faster query execution on posts, likes, comments, follows, groups
-- Created: 2025-01-16
-- ========================================

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Likes table indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id); -- For "is_liked" checks

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_followed ON follows(follower_id, followed_id); -- For follow checks

-- Group posts table indexes
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_created ON group_posts(group_id, created_at DESC);

-- Group likes table indexes
CREATE INDEX IF NOT EXISTS idx_group_likes_group_post_id ON group_likes(group_post_id);
CREATE INDEX IF NOT EXISTS idx_group_likes_user_id ON group_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_group_likes_user_post ON group_likes(user_id, group_post_id);

-- Group comments table indexes
CREATE INDEX IF NOT EXISTS idx_group_comments_group_post_id ON group_comments(group_post_id);
CREATE INDEX IF NOT EXISTS idx_group_comments_user_id ON group_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_comments_created_at ON group_comments(created_at DESC);

-- Group members table indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- User routes table indexes
CREATE INDEX IF NOT EXISTS idx_user_routes_user_id ON user_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routes_created_at ON user_routes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_routes_user_created ON user_routes(user_id, created_at DESC);

-- Hazard reports geospatial index (for bounding box queries)
CREATE INDEX IF NOT EXISTS idx_hazard_reports_lat_lng ON hazard_reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_status ON hazard_reports(status);

-- User challenges indexes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);

-- Device tokens indexes
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

-- ========================================
-- Verification Query (run after applying)
-- ========================================
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

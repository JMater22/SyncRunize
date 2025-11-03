-- ========================================
-- DATA CLEANUP SCRIPT
-- ========================================
-- Run this to FIX issues found in PRE_MIGRATION_CHECK.sql
-- Only run the sections that had COUNT > 0
-- ========================================

-- ========================================
-- FIX 1: Remove Orphaned Records
-- ========================================
-- IMPORTANT: This will DELETE data!
-- Make sure you have a backup first

-- Delete posts with non-existent users
DELETE FROM posts
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = posts.user_id);

-- Delete comments with non-existent users
DELETE FROM comments
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = comments.user_id);

-- Delete likes with non-existent users
DELETE FROM likes
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = likes.user_id);

-- Delete group_posts with non-existent users
DELETE FROM group_posts
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = group_posts.user_id);

-- Delete group_comments with non-existent users
DELETE FROM group_comments
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = group_comments.user_id);

-- Delete group_likes with non-existent users
DELETE FROM group_likes
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = group_likes.user_id);

-- Delete notifications with non-existent users
DELETE FROM notifications
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = notifications.user_id);

-- Delete user_routes with non-existent users
DELETE FROM user_routes
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = user_routes.user_id);

-- Set moderator_id to NULL for non-existent moderators
UPDATE moderation_logs
SET moderator_id = NULL
WHERE moderator_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = moderation_logs.moderator_id);

-- Delete user_statistics with non-existent users
DELETE FROM user_statistics
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = user_statistics.user_id);

-- For hazard_reports, you might want to keep them but set user_id to NULL
-- Option 1: Set to NULL (keep the hazard report)
UPDATE hazard_reports
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = hazard_reports.user_id);

-- Option 2: Delete them (uncomment if you prefer)
-- DELETE FROM hazard_reports
-- WHERE user_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM users WHERE users.user_id = hazard_reports.user_id);

-- ========================================
-- FIX 2: Remove Duplicate Likes
-- ========================================
-- Keep only the first like, delete duplicates

-- Remove duplicate likes on posts
DELETE FROM likes a
USING likes b
WHERE a.like_id > b.like_id
  AND a.user_id = b.user_id
  AND a.post_id = b.post_id;

-- Remove duplicate likes on group posts
DELETE FROM group_likes a
USING group_likes b
WHERE a.like_id > b.like_id
  AND a.user_id = b.user_id
  AND a.group_post_id = b.group_post_id;

-- ========================================
-- FIX 3: Remove Self-Follows
-- ========================================
DELETE FROM follows
WHERE follower_id = followed_id;

-- ========================================
-- FIX 4: Fix Invalid Data Values
-- ========================================
-- Fix invalid ages (set to NULL or a default)
UPDATE users
SET age = NULL
WHERE age IS NOT NULL AND (age < 13 OR age > 120);

-- Fix invalid weights (set to NULL)
UPDATE users
SET weight_kg = NULL
WHERE weight_kg IS NOT NULL AND weight_kg <= 0;

-- Fix invalid coordinates in hazard_reports
-- Option 1: Set to NULL (requires lat/lng to be nullable)
UPDATE hazard_reports
SET lat = NULL, lng = NULL
WHERE lat < -90 OR lat > 90 OR lng < -180 OR lng > 180;

-- Option 2: Delete invalid records (uncomment if you prefer)
-- DELETE FROM hazard_reports
-- WHERE lat < -90 OR lat > 90 OR lng < -180 OR lng > 180;

-- Fix invalid coordinates in official_incidents
UPDATE official_incidents
SET lat = NULL, lng = NULL
WHERE lat < -90 OR lat > 90 OR lng < -180 OR lng > 180;

-- Fix negative distances in user_routes
UPDATE user_routes
SET distance_km = ABS(distance_km)
WHERE distance_km < 0;

-- Fix negative distances in user_challenges
UPDATE user_challenges
SET total_distance_km = ABS(total_distance_km)
WHERE total_distance_km < 0;

-- Fix invalid progress percentage
UPDATE user_challenges
SET progress_percent = CASE
  WHEN progress_percent < 0 THEN 0
  WHEN progress_percent > 100 THEN 100
  ELSE progress_percent
END
WHERE progress_percent < 0 OR progress_percent > 100;

-- ========================================
-- VERIFICATION
-- ========================================
-- Run PRE_MIGRATION_CHECK.sql again to verify all issues are fixed
-- All counts should be 0 now
-- ========================================

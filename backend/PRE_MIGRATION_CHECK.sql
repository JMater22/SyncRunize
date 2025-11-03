-- ========================================
-- PRE-MIGRATION VALIDATION SCRIPT
-- ========================================
-- Run this BEFORE applying schema improvements
-- to identify any existing data issues
-- ========================================

-- ========================================
-- CHECK 1: Foreign Key Violations
-- ========================================
-- Find posts with non-existent users
SELECT 'posts with invalid user_id' as issue, COUNT(*) as count
FROM posts p
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.user_id);

-- Find comments with non-existent users
SELECT 'comments with invalid user_id' as issue, COUNT(*) as count
FROM comments c
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = c.user_id);

-- Find likes with non-existent users
SELECT 'likes with invalid user_id' as issue, COUNT(*) as count
FROM likes l
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = l.user_id);

-- Find group_posts with non-existent users
SELECT 'group_posts with invalid user_id' as issue, COUNT(*) as count
FROM group_posts gp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = gp.user_id);

-- Find group_comments with non-existent users
SELECT 'group_comments with invalid user_id' as issue, COUNT(*) as count
FROM group_comments gc
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = gc.user_id);

-- Find group_likes with non-existent users
SELECT 'group_likes with invalid user_id' as issue, COUNT(*) as count
FROM group_likes gl
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = gl.user_id);

-- Find hazard_reports with non-existent users
SELECT 'hazard_reports with invalid user_id' as issue, COUNT(*) as count
FROM hazard_reports hr
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = hr.user_id);

-- Find notifications with non-existent users
SELECT 'notifications with invalid user_id' as issue, COUNT(*) as count
FROM notifications n
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = n.user_id);

-- Find user_routes with non-existent users
SELECT 'user_routes with invalid user_id' as issue, COUNT(*) as count
FROM user_routes ur
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = ur.user_id);

-- Find moderation_logs with non-existent moderators
SELECT 'moderation_logs with invalid moderator_id' as issue, COUNT(*) as count
FROM moderation_logs ml
WHERE moderator_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = ml.moderator_id);

-- Find user_statistics with non-existent users
SELECT 'user_statistics with invalid user_id' as issue, COUNT(*) as count
FROM user_statistics us
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = us.user_id);

-- ========================================
-- CHECK 2: Duplicate Violations
-- ========================================
-- Find duplicate likes on posts
SELECT 'duplicate likes on posts' as issue, COUNT(*) as count
FROM (
  SELECT user_id, post_id, COUNT(*) as like_count
  FROM likes
  GROUP BY user_id, post_id
  HAVING COUNT(*) > 1
) duplicates;

-- Find duplicate likes on group posts
SELECT 'duplicate likes on group_posts' as issue, COUNT(*) as count
FROM (
  SELECT user_id, group_post_id, COUNT(*) as like_count
  FROM group_likes
  GROUP BY user_id, group_post_id
  HAVING COUNT(*) > 1
) duplicates;

-- Find self-follows
SELECT 'self-follows' as issue, COUNT(*) as count
FROM follows
WHERE follower_id = followed_id;

-- ========================================
-- CHECK 3: Data Validation Violations
-- ========================================
-- Find invalid ages
SELECT 'users with invalid age' as issue, COUNT(*) as count
FROM users
WHERE age IS NOT NULL AND (age < 13 OR age > 120);

-- Find invalid weights
SELECT 'users with invalid weight' as issue, COUNT(*) as count
FROM users
WHERE weight_kg IS NOT NULL AND weight_kg <= 0;

-- Find invalid coordinates in hazard_reports
SELECT 'hazard_reports with invalid lat' as issue, COUNT(*) as count
FROM hazard_reports
WHERE lat < -90 OR lat > 90;

SELECT 'hazard_reports with invalid lng' as issue, COUNT(*) as count
FROM hazard_reports
WHERE lng < -180 OR lng > 180;

-- Find invalid coordinates in official_incidents
SELECT 'official_incidents with invalid lat' as issue, COUNT(*) as count
FROM official_incidents
WHERE lat < -90 OR lat > 90;

SELECT 'official_incidents with invalid lng' as issue, COUNT(*) as count
FROM official_incidents
WHERE lng < -180 OR lng > 180;

-- Find invalid distances in user_routes
SELECT 'user_routes with negative distance' as issue, COUNT(*) as count
FROM user_routes
WHERE distance_km < 0;

-- Find invalid distances in user_challenges
SELECT 'user_challenges with negative distance' as issue, COUNT(*) as count
FROM user_challenges
WHERE total_distance_km < 0;

-- Find invalid progress percentage
SELECT 'user_challenges with invalid progress' as issue, COUNT(*) as count
FROM user_challenges
WHERE progress_percent < 0 OR progress_percent > 100;

-- ========================================
-- SUMMARY: Show all issues
-- ========================================
SELECT
  'SUMMARY' as section,
  'Run each check above individually to see counts' as message;

-- ========================================
-- INTERPRETATION:
-- ========================================
-- If COUNT = 0 → SAFE to apply that constraint
-- If COUNT > 0 → FIX the data first before applying constraint
--
-- Example fixes are provided in DATA_CLEANUP.sql
-- ========================================

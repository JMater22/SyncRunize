-- ========================================
-- RISKY MIGRATION SCRIPT
-- ========================================
-- ⚠️ WARNING: These can FAIL if bad data exists
-- ========================================
-- PREREQUISITES:
-- 1. Run PRE_MIGRATION_CHECK.sql first
-- 2. If any issues found, run DATA_CLEANUP.sql
-- 3. Verify all checks pass (COUNT = 0)
-- 4. BACKUP your database!
-- 5. Then run this script
-- ========================================

-- ========================================
-- PART 1: FOREIGN KEY CONSTRAINTS
-- ========================================
-- These enforce referential integrity
-- WILL FAIL if orphaned records exist

-- Posts
ALTER TABLE posts
  ADD CONSTRAINT posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Comments
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Likes
ALTER TABLE likes
  ADD CONSTRAINT likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Group Posts
ALTER TABLE group_posts
  ADD CONSTRAINT group_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Group Comments
ALTER TABLE group_comments
  ADD CONSTRAINT group_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Group Likes
ALTER TABLE group_likes
  ADD CONSTRAINT group_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Hazard Reports (SET NULL - keep hazard even if user deleted)
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE SET NULL;

-- Notifications
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- Moderation Logs (SET NULL - keep log even if moderator deleted)
ALTER TABLE moderation_logs
  ADD CONSTRAINT moderation_logs_moderator_id_fkey
  FOREIGN KEY (moderator_id) REFERENCES users(user_id)
  ON DELETE SET NULL;

-- User Routes
ALTER TABLE user_routes
  ADD CONSTRAINT user_routes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- User Statistics
ALTER TABLE user_statistics
  ADD CONSTRAINT user_statistics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

-- ========================================
-- PART 2: UNIQUE CONSTRAINTS
-- ========================================
-- Prevent duplicates
-- WILL FAIL if duplicates already exist

-- Prevent duplicate likes on posts
ALTER TABLE likes
  ADD CONSTRAINT likes_user_post_unique
  UNIQUE (user_id, post_id);

-- Prevent duplicate likes on group posts
ALTER TABLE group_likes
  ADD CONSTRAINT group_likes_user_post_unique
  UNIQUE (user_id, group_post_id);

-- Note: follows table might already have this constraint
-- If it fails, that's okay - it means it already exists
DO $$
BEGIN
  ALTER TABLE follows
    ADD CONSTRAINT follows_follower_followed_unique
    UNIQUE (follower_id, followed_id);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint follows_follower_followed_unique already exists, skipping';
END $$;

-- ========================================
-- PART 3: CHECK CONSTRAINTS
-- ========================================
-- Data validation
-- WILL FAIL if invalid data exists

-- Users: valid age range
ALTER TABLE users
  ADD CONSTRAINT users_age_valid
  CHECK (age IS NULL OR (age >= 13 AND age <= 120));

-- Users: positive weight
ALTER TABLE users
  ADD CONSTRAINT users_weight_valid
  CHECK (weight_kg IS NULL OR weight_kg > 0);

-- Prevent self-follows
ALTER TABLE follows
  ADD CONSTRAINT follows_no_self_follow
  CHECK (follower_id != followed_id);

-- Hazard Reports: valid latitude
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_lat_valid
  CHECK (lat >= -90 AND lat <= 90);

-- Hazard Reports: valid longitude
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_lng_valid
  CHECK (lng >= -180 AND lng <= 180);

-- Official Incidents: valid latitude
ALTER TABLE official_incidents
  ADD CONSTRAINT official_incidents_lat_valid
  CHECK (lat >= -90 AND lat <= 90);

-- Official Incidents: valid longitude
ALTER TABLE official_incidents
  ADD CONSTRAINT official_incidents_lng_valid
  CHECK (lng >= -180 AND lng <= 180);

-- User Routes: positive distance
ALTER TABLE user_routes
  ADD CONSTRAINT user_routes_distance_valid
  CHECK (distance_km >= 0);

-- User Challenges: positive distance
ALTER TABLE user_challenges
  ADD CONSTRAINT user_challenges_distance_valid
  CHECK (total_distance_km >= 0);

-- User Challenges: valid progress percentage
ALTER TABLE user_challenges
  ADD CONSTRAINT user_challenges_progress_valid
  CHECK (progress_percent >= 0 AND progress_percent <= 100);

-- ========================================
-- VERIFICATION
-- ========================================
SELECT
  '✅ Risky migration completed successfully!' as status,
  'All constraints added without errors' as message,
  'Your data is now protected with foreign keys and validation' as note;

-- ========================================
-- IF YOU SEE ERRORS:
-- ========================================
-- Error about "violates foreign key constraint"
--   → You have orphaned records
--   → Run DATA_CLEANUP.sql to fix
--
-- Error about "violates unique constraint"
--   → You have duplicate records
--   → Run DATA_CLEANUP.sql to fix
--
-- Error about "violates check constraint"
--   → You have invalid data values
--   → Run DATA_CLEANUP.sql to fix
-- ========================================

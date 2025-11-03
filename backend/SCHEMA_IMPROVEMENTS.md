# Supabase Schema Improvements & Recommendations

## Date: 2025-11-03

This document provides a comprehensive analysis of your current Supabase schema and recommends improvements for data integrity, performance, and security.

---

## 🔴 **CRITICAL: Missing Foreign Key Constraints**

Many tables have `user_id` columns but **NO foreign key constraints** to the `users` table. This can lead to orphaned records and data integrity issues.

### Missing Foreign Keys:

| Table | Column | Should Reference |
|-------|--------|------------------|
| `posts` | `user_id` | `users(user_id)` |
| `comments` | `user_id` | `users(user_id)` |
| `likes` | `user_id` | `users(user_id)` |
| `group_posts` | `user_id` | `users(user_id)` |
| `group_comments` | `user_id` | `users(user_id)` |
| `group_likes` | `user_id` | `users(user_id)` |
| `hazard_reports` | `user_id` | `users(user_id)` |
| `notifications` | `user_id` | `users(user_id)` |
| `moderation_logs` | `moderator_id` | `users(user_id)` |
| `user_routes` | `user_id` | `users(user_id)` |
| `user_statistics` | `user_id` | `users(user_id)` |
| `user_challenges` | `user_id` | `users(user_id)` |

### SQL to Add Foreign Keys:

```sql
-- Add foreign key constraints for data integrity
ALTER TABLE posts
  ADD CONSTRAINT posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE likes
  ADD CONSTRAINT likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE group_posts
  ADD CONSTRAINT group_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE group_comments
  ADD CONSTRAINT group_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE group_likes
  ADD CONSTRAINT group_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE moderation_logs
  ADD CONSTRAINT moderation_logs_moderator_id_fkey
  FOREIGN KEY (moderator_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE user_routes
  ADD CONSTRAINT user_routes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE user_statistics
  ADD CONSTRAINT user_statistics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

**Note**: `user_challenges` already has this constraint.

---

## ⚠️ **Missing Unique Constraints**

Prevent duplicate entries with unique constraints:

### 1. **Prevent Duplicate Likes**

```sql
-- Ensure a user can only like a post once
ALTER TABLE likes
  ADD CONSTRAINT likes_user_post_unique
  UNIQUE (user_id, post_id);

-- Ensure a user can only like a group post once
ALTER TABLE group_likes
  ADD CONSTRAINT group_likes_user_post_unique
  UNIQUE (user_id, group_post_id);
```

### 2. **Verify Follows Constraint**

```sql
-- Should already exist, but verify:
-- ALTER TABLE follows
--   ADD CONSTRAINT follows_follower_followed_unique
--   UNIQUE (follower_id, followed_id);

-- Prevent self-follows
ALTER TABLE follows
  ADD CONSTRAINT follows_no_self_follow
  CHECK (follower_id != followed_id);
```

---

## 🚀 **Performance: Missing Indexes**

Add indexes for frequently queried columns:

### Critical Indexes for Performance:

```sql
-- Posts - frequently queried by user
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Comments - queried by post and user
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Likes - queried by post and user
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Follows - queried by both follower and followed
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- Groups
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_user_id ON group_posts(user_id);

-- Hazard Reports - spatial queries
CREATE INDEX idx_hazard_reports_user_id ON hazard_reports(user_id);
CREATE INDEX idx_hazard_reports_status ON hazard_reports(status);
CREATE INDEX idx_hazard_reports_lat_lng ON hazard_reports(lat, lng);

-- User Routes
CREATE INDEX idx_user_routes_user_id ON user_routes(user_id);
CREATE INDEX idx_user_routes_created_at ON user_routes(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_is_read ON notifications(user_id, is_read);

-- User Challenges
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_completed ON user_challenges(completed);
```

### Composite Indexes for Common Queries:

```sql
-- Get unread notifications for a user (very common query)
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Get user's active challenges
CREATE INDEX idx_user_challenges_active
  ON user_challenges(user_id, updated_at DESC)
  WHERE completed = false;

-- Get active hazards in area
CREATE INDEX idx_hazard_reports_active
  ON hazard_reports(status, reported_at DESC)
  WHERE status = 'active';
```

---

## 📐 **Schema Design Improvements**

### 1. **Add `updated_at` Triggers**

Many tables have `updated_at` but no automatic trigger:

```sql
-- Create a reusable function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need it
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. **Data Type Consistency**

```sql
-- Standardize weight_kg from NUMERIC to DOUBLE PRECISION
ALTER TABLE users
  ALTER COLUMN weight_kg TYPE DOUBLE PRECISION;

-- Ensure all timestamps are timestamptz (with timezone) for consistency
-- This is important for global applications
ALTER TABLE posts
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE comments
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Repeat for other tables as needed...
```

### 3. **Add Missing Columns**

Your models expect these, but verify they exist:

```sql
-- Ensure users table has all needed columns
-- (Already exists in your schema, but documenting for completeness)

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT;
```

---

## 🔒 **Security: Row Level Security (RLS)**

Enable RLS for data protection:

```sql
-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies:

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = (
    SELECT auth_id FROM users WHERE user_id = posts.user_id
  ));

-- Users can read all posts (public feed)
CREATE POLICY "Anyone can view posts" ON posts
  FOR SELECT USING (true);

-- Users can update/delete only their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = (
    SELECT auth_id FROM users WHERE user_id = posts.user_id
  ));

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = (
    SELECT auth_id FROM users WHERE user_id = posts.user_id
  ));

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = (
    SELECT auth_id FROM users WHERE user_id = notifications.user_id
  ));

-- Add similar policies for other tables...
```

---

## 🗺️ **Spatial Query Optimization**

For hazard reports and location-based queries:

```sql
-- Enable PostGIS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a geography column for better spatial queries
ALTER TABLE hazard_reports
  ADD COLUMN geog GEOGRAPHY(Point, 4326);

-- Populate the geography column
UPDATE hazard_reports
  SET geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;

-- Create spatial index
CREATE INDEX idx_hazard_reports_geog ON hazard_reports USING GIST(geog);

-- Do the same for official_incidents
ALTER TABLE official_incidents
  ADD COLUMN geog GEOGRAPHY(Point, 4326);

UPDATE official_incidents
  SET geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;

CREATE INDEX idx_official_incidents_geog ON official_incidents USING GIST(geog);

-- Updated spatial query function
CREATE OR REPLACE FUNCTION find_hazards_near_location_postgis(
  p_lat FLOAT,
  p_lng FLOAT,
  p_radius_meters FLOAT
)
RETURNS TABLE (
  report_id INT,
  user_id INT,
  title VARCHAR,
  incident_type VARCHAR,
  description TEXT,
  lat FLOAT,
  lng FLOAT,
  trust_score FLOAT,
  agreement_score FLOAT,
  severity_weight FLOAT,
  status VARCHAR,
  image_url VARCHAR,
  reported_at TIMESTAMP,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hr.report_id,
    hr.user_id,
    hr.title,
    hr.incident_type,
    hr.description,
    hr.lat,
    hr.lng,
    hr.trust_score,
    hr.agreement_score,
    hr.severity_weight,
    hr.status,
    hr.image_url,
    hr.reported_at,
    ST_Distance(
      hr.geog,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_meters
  FROM hazard_reports hr
  WHERE ST_DWithin(
    hr.geog,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_radius_meters
  )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧹 **Clean Up / Remove**

### 1. **Empty Table**

```sql
-- This table appears to be empty/unused
-- DROP TABLE IF EXISTS synrunize_tables;
```

### 2. **Unused Table?**

```sql
-- user_statistics table exists but stats_model.js uses aggregation functions instead
-- If you're using real-time aggregation, you may not need this table
-- Consider dropping it or documenting its purpose:
-- DROP TABLE IF EXISTS user_statistics;
```

---

## 📊 **Data Validation Constraints**

Add CHECK constraints for data quality:

```sql
-- Ensure valid age range
ALTER TABLE users
  ADD CONSTRAINT users_age_valid
  CHECK (age IS NULL OR (age >= 13 AND age <= 120));

-- Ensure positive weight
ALTER TABLE users
  ADD CONSTRAINT users_weight_valid
  CHECK (weight_kg IS NULL OR weight_kg > 0);

-- Ensure valid coordinates
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_lat_valid
  CHECK (lat >= -90 AND lat <= 90);

ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_lng_valid
  CHECK (lng >= -180 AND lng <= 180);

ALTER TABLE official_incidents
  ADD CONSTRAINT official_incidents_lat_valid
  CHECK (lat >= -90 AND lat <= 90);

ALTER TABLE official_incidents
  ADD CONSTRAINT official_incidents_lng_valid
  CHECK (lng >= -180 AND lng <= 180);

-- Ensure positive distance
ALTER TABLE user_routes
  ADD CONSTRAINT user_routes_distance_valid
  CHECK (distance_km >= 0);

ALTER TABLE user_challenges
  ADD CONSTRAINT user_challenges_distance_valid
  CHECK (total_distance_km >= 0);

-- Ensure valid progress percentage
ALTER TABLE user_challenges
  ADD CONSTRAINT user_challenges_progress_valid
  CHECK (progress_percent >= 0 AND progress_percent <= 100);
```

---

## 📋 **Complete Migration Script**

Run this in order in your Supabase SQL Editor:

```sql
-- ========================================
-- STEP 1: Add Foreign Keys
-- ========================================
-- (See "Missing Foreign Keys" section above)

-- ========================================
-- STEP 2: Add Unique Constraints
-- ========================================
-- (See "Missing Unique Constraints" section above)

-- ========================================
-- STEP 3: Add Indexes
-- ========================================
-- (See "Performance: Missing Indexes" section above)

-- ========================================
-- STEP 4: Add Triggers
-- ========================================
-- (See "Add updated_at Triggers" section above)

-- ========================================
-- STEP 5: Add Validation Constraints
-- ========================================
-- (See "Data Validation Constraints" section above)

-- ========================================
-- STEP 6: Enable RLS (Optional but Recommended)
-- ========================================
-- (See "Security: Row Level Security" section above)

-- ========================================
-- STEP 7: Add Spatial Optimization (Optional)
-- ========================================
-- (See "Spatial Query Optimization" section above)
```

---

## ✅ **Priority Recommendations**

### **HIGH Priority (Do Now):**
1. ✅ Add missing foreign key constraints
2. ✅ Add unique constraints for likes and follows
3. ✅ Add indexes on user_id columns
4. ✅ Add data validation constraints

### **MEDIUM Priority (Do Soon):**
5. ⚠️ Add updated_at triggers
6. ⚠️ Enable Row Level Security
7. ⚠️ Add composite indexes for common queries
8. ⚠️ Standardize timestamp types to timestamptz

### **LOW Priority (Nice to Have):**
9. 💡 Add PostGIS for better spatial queries
10. 💡 Add full-text search indexes
11. 💡 Consider partitioning large tables (user_routes, hazard_reports)

---

## 🔍 **Testing After Changes**

After running migrations, test:

```sql
-- Test foreign key constraints
INSERT INTO posts (user_id, content) VALUES (99999, 'test');
-- Should fail if user 99999 doesn't exist

-- Test unique constraints
INSERT INTO likes (user_id, post_id) VALUES (1, 1);
INSERT INTO likes (user_id, post_id) VALUES (1, 1);
-- Should fail on second insert

-- Test data validation
INSERT INTO users (auth_id, email, age) VALUES (uuid_generate_v4(), 'test@test.com', 150);
-- Should fail if age > 120

-- Verify indexes
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 1;
-- Should use idx_posts_user_id
```

---

## 📝 **Summary**

| Category | Count | Status |
|----------|-------|--------|
| Missing Foreign Keys | 11 | ❌ Critical |
| Missing Unique Constraints | 3 | ⚠️ Important |
| Missing Indexes | 20+ | ⚠️ Important |
| Missing Triggers | 4 | 💡 Nice to have |
| Missing Validation | 10+ | ⚠️ Important |
| RLS Not Enabled | All tables | 🔒 Security |

---

**Created by**: Claude Code
**Date**: 2025-11-03
**Purpose**: Schema improvement recommendations

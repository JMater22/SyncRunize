# Schema Alignment Fixes

## Date: 2025-11-03

This document details all schema alignment fixes applied to ensure backend models match the Supabase database schema.

---

## ✅ Fixed Issues

### 1. **user_model.js - Primary Key Mismatch**

**Problem**: Model used `id` but schema has `user_id`

**Schema Definition**:
```sql
CREATE TABLE public.users (
  user_id integer NOT NULL PRIMARY KEY,
  ...
)
```

**Fixed Locations**:
- `models/user_model.js:23` - createUserProfile SELECT
- `models/user_model.js:34` - getUserByAuthId SELECT
- `models/user_model.js:49-50` - getPublicUserById SELECT and WHERE
- `models/user_model.js:75` - updateUserProfile SELECT
- `models/user_model.js:88` - deleteUserProfile SELECT

**Change**: All instances of `id` changed to `user_id`

---

### 2. **user_route_model.js - Primary Key Mismatch**

**Problem**: Model used `id` but schema has `route_id`

**Schema Definition**:
```sql
CREATE TABLE public.user_routes (
  route_id integer NOT NULL PRIMARY KEY,
  ...
)
```

**Fixed Locations**:
- `models/user_route_model.js:158` - getRouteById WHERE clause

**Change**: `.eq("id", routeId)` → `.eq("route_id", routeId)`

---

### 3. **stats_model.js - Column Name Mismatch**

**Problem**: PostgreSQL functions used `distance` but schema has `distance_km`

**Schema Definition**:
```sql
CREATE TABLE public.user_routes (
  ...
  distance_km double precision,
  ...
)
```

**Fixed Locations**:
- `models/stats_model.js:30` - get_user_stats function
- `models/stats_model.js:80` - get_current_period_stats function
- `backend/SUPABASE_MIGRATION.md:109` - SQL function documentation
- `backend/SUPABASE_MIGRATION.md:145` - SQL function documentation

**Change**: All `SUM(distance)` changed to `SUM(distance_km)`

---

## ✅ Verified Correct (No Changes Needed)

### 1. **users.username Column**

**Status**: ✅ Correct - Schema has both `name` AND `username` columns

**Schema Definition**:
```sql
CREATE TABLE public.users (
  user_id integer NOT NULL,
  name text,
  username text,
  profile_picture text,
  ...
)
```

**Usage**:
- `user_model.js` returns `name` for profile operations
- Other models JOIN with `users(username, profile_picture)` for display

**Note**: Both columns exist in schema. Ensure `username` is populated for JOIN queries to work.

---

### 2. **Foreign Key Names**

**Status**: ✅ Correct - Explicit FK names match schema

**Verified Constraints**:
- `follows_follower_id_fkey` → Matches schema
- `follows_followed_id_fkey` → Matches schema
- All other FK constraints align with schema definitions

**Files Using Explicit FKs**:
- `models/follow_model.js` - Uses `users!follows_follower_id_fkey(username, profile_picture)`

---

### 3. **All Other Primary Keys**

**Status**: ✅ Correct - All match schema

| Table | Primary Key in Schema | Model Usage | Status |
|-------|----------------------|-------------|--------|
| posts | post_id | post_id | ✅ |
| comments | comment_id | comment_id | ✅ |
| likes | like_id | (composite key) | ✅ |
| follows | follow_id | (composite key) | ✅ |
| challenges | challenge_id | challenge_id | ✅ |
| groups | group_id | group_id | ✅ |
| group_posts | group_post_id | group_post_id | ✅ |
| group_comments | comment_id | comment_id | ✅ |
| group_likes | like_id | (composite key) | ✅ |
| hazard_reports | report_id | report_id | ✅ |
| official_incidents | incident_id | incident_id | ✅ |
| notifications | notification_id | notification_id | ✅ |
| moderation_logs | log_id | (returns all) | ✅ |
| user_challenges | user_challenge_id | user_challenge_id | ✅ |
| badges | badge_id | badge_id | ✅ |

---

## 🚀 Deployment Checklist

Before deploying, ensure:

- [x] All model files updated with correct column names
- [x] PostgreSQL functions updated in stats_model.js comments
- [x] SUPABASE_MIGRATION.md SQL scripts corrected
- [ ] PostgreSQL functions created in Supabase SQL Editor (with corrected SQL)
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] `username` column populated in users table
- [ ] All API endpoints tested

---

## 📝 SQL Functions to Create

Use these corrected SQL scripts in **Supabase SQL Editor**:

### Function 1: get_user_stats
```sql
CREATE OR REPLACE FUNCTION get_user_stats(
  p_user_id INT,
  p_period TEXT DEFAULT 'month',
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  period_start TIMESTAMP,
  total_distance FLOAT,
  avg_pace FLOAT,
  total_calories FLOAT,
  runs_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC(p_period, created_at) AS period_start,
    SUM(distance_km) AS total_distance,  -- ✅ CORRECTED
    AVG(average_pace) AS avg_pace,
    SUM(estimated_calories) AS total_calories,
    COUNT(*) AS runs_count
  FROM user_routes
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    AND (p_start_date IS NOT NULL OR p_end_date IS NOT NULL OR created_at >= DATE_TRUNC(p_period, CURRENT_TIMESTAMP))
  GROUP BY period_start
  ORDER BY period_start ASC;
END;
$$ LANGUAGE plpgsql;
```

### Function 2: get_current_period_stats
```sql
CREATE OR REPLACE FUNCTION get_current_period_stats(
  p_user_id INT,
  p_period TEXT DEFAULT 'month'
)
RETURNS TABLE (
  total_distance FLOAT,
  avg_pace FLOAT,
  total_calories FLOAT,
  runs_count BIGINT,
  period_start TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(distance_km) AS total_distance,  -- ✅ CORRECTED
    AVG(average_pace) AS avg_pace,
    SUM(estimated_calories) AS total_calories,
    COUNT(*) AS runs_count,
    DATE_TRUNC(p_period, CURRENT_TIMESTAMP) AS period_start
  FROM user_routes
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC(p_period, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;
```

### Function 3: find_hazards_near_location
```sql
-- Enable PostGIS extensions first
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE OR REPLACE FUNCTION find_hazards_near_location(
  p_lat FLOAT,
  p_lng FLOAT,
  p_radius_km FLOAT
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
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hr.*,
    earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(hr.lat, hr.lng)) / 1000 AS distance_km
  FROM hazard_reports hr
  WHERE earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(hr.lat, hr.lng)) / 1000 < p_radius_km;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Schema Alignment Summary

| Issue Type | Count | Status |
|------------|-------|--------|
| Primary key mismatches | 2 | ✅ Fixed |
| Column name mismatches | 1 | ✅ Fixed |
| FK name issues | 0 | ✅ None found |
| Data type issues | 0 | ✅ None found |
| Missing columns | 0 | ✅ None found |

**Total files modified**: 4
- `models/user_model.js`
- `models/user_route_model.js`
- `models/stats_model.js`
- `backend/SUPABASE_MIGRATION.md`

---

## 🔍 Testing Commands

Test the fixes with these queries:

```bash
# Test user queries
curl http://localhost:5000/api/users/profile/{auth_id}

# Test route queries
curl http://localhost:5000/api/routes/{route_id}

# Test stats queries
curl http://localhost:5000/api/stats/{user_id}?period=month

# Test database connection
curl http://localhost:5000/test-db
```

---

**Fixed by**: Claude Code
**Date**: 2025-11-03
**Commit**: Schema alignment fixes

# Posts Table Redundancy Optimization Guide

## Issue Summary

The `posts` table currently stores route metrics directly (`distance_km`, `duration_seconds`, `average_pace`, `estimated_calories`, `route_name`, `snapshot_url`) even though it has a `route_id` foreign key reference to the `user_routes` table. This creates data redundancy and potential inconsistency.

## Current Schema (Redundant)

```sql
CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  route_id INTEGER REFERENCES user_routes(route_id),  -- Foreign key reference
  content TEXT,

  -- ⚠️ REDUNDANT: These are already in user_routes table
  route_name VARCHAR(255),
  distance_km DECIMAL(10, 2),
  duration_seconds INTEGER,
  average_pace DECIMAL(10, 2),
  estimated_calories DECIMAL(10, 2),
  snapshot_url TEXT,

  -- Other fields
  image_url TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Recommended Approach

### Option 1: Keep Redundant Fields (RECOMMENDED for now)

**Why this is recommended:**
- Maintains backward compatibility with existing posts
- Prevents data loss for posts where route may have been deleted
- Allows posts to exist independently of routes
- No migration complexity for existing data
- Query performance is actually better (no JOIN required)

**What we've implemented:**
- New optimized `createPostFromRouteId()` function that fetches route data (backend/models/post_model.js:214)
- Backend controller auto-detects route-based posts (backend/controllers/post_controller.js:118)
- Frontend PrePostPage properly fetches route data before posting (Mobile-App/ionic-app/src/pages/PrePostPage.tsx:90)

**Result:**
- New posts automatically get data from route (no redundancy sent from frontend)
- Existing posts continue to work without changes
- If a route is deleted, the post still displays correctly

### Option 2: Remove Redundant Fields (NOT RECOMMENDED)

**Why this is NOT recommended:**
- Breaking change for existing posts
- Complex migration for historical data
- Posts become dependent on routes existing
- If user deletes a route, the post loses all metrics

**If you still want to do this (not recommended):**

```sql
-- Step 1: Backup the posts table
CREATE TABLE posts_backup AS SELECT * FROM posts;

-- Step 2: Create a view that joins posts with routes
CREATE OR REPLACE VIEW posts_with_metrics AS
SELECT
  p.post_id,
  p.user_id,
  p.route_id,
  p.content,
  p.image_url,
  p.visibility,
  p.created_at,
  -- Fetch from user_routes
  r.route_name,
  r.distance_km,
  r.duration_seconds,
  r.average_pace,
  r.estimated_calories,
  r.snapshot_url,
  r.elevation_gain,
  r.elevation_loss
FROM posts p
LEFT JOIN user_routes r ON p.route_id = r.route_id;

-- Step 3: Drop redundant columns (DANGEROUS - only if you're sure)
ALTER TABLE posts
DROP COLUMN route_name,
DROP COLUMN distance_km,
DROP COLUMN duration_seconds,
DROP COLUMN average_pace,
DROP COLUMN estimated_calories,
DROP COLUMN snapshot_url;

-- Step 4: Update application code to use the view instead of the table
-- This requires extensive code changes in:
-- - backend/models/post_model.js (all queries)
-- - Frontend components that display posts
```

## Current Implementation Status

✅ **Completed:**
1. Created `createPostFromRouteId()` in backend/models/post_model.js (line 214)
2. Updated backend controller to auto-detect route posts (backend/controllers/post_controller.js:118)
3. Enhanced PrePostPage to ensure route data is loaded before posting (Mobile-App/ionic-app/src/pages/PrePostPage.tsx:90)
4. Added elevation tracking to user_routes table (see add_elevation_tracking.sql)

✅ **What This Means:**
- **Frontend no longer sends redundant data** - Only sends `route_id`, `content`, `image_url`, `visibility`
- **Backend fetches route data automatically** - Queries user_routes table for metrics
- **Snapshot is properly loaded** - PrePostPage waits for route data before allowing post creation
- **No breaking changes** - Existing posts continue to work
- **Future-proof** - When you're ready to optimize, you can use the view approach above

## Testing Checklist

Before deploying to production:

- [ ] Run elevation tracking migration: `backend/migrations/add_elevation_tracking.sql`
- [ ] Test recording a run with elevation data
- [ ] Verify run appears in Activities with correct metrics
- [ ] Navigate to PrePostPage and verify snapshot loads
- [ ] Create a post and verify it appears in feed
- [ ] Check that post displays correct metrics from route
- [ ] Verify existing posts still display correctly
- [ ] Test deleting a route and confirm post still shows (using cached data)

## Files Modified

### Backend:
1. **backend/models/user_route_model.js** (lines 35-38, 98-100)
   - Added elevation field parameters
   - Updated INSERT statement to include elevation data

2. **backend/models/post_model.js** (line 214)
   - New `createPostFromRouteId()` function
   - Fetches route data from user_routes table
   - Eliminates redundant parameters from frontend

3. **backend/controllers/post_controller.js** (lines 118-126)
   - Enhanced `/posts` endpoint to detect route_id
   - Auto-routes to optimized function

### Frontend:
4. **Mobile-App/ionic-app/src/pages/PrePostPage.tsx** (line 90)
   - Added route data validation before posting
   - Ensures snapshot and metrics are loaded

### Database:
5. **backend/migrations/add_elevation_tracking.sql** (NEW)
   - Adds elevation_gain, elevation_loss, elevation_multiplier columns

6. **backend/migrations/posts_redundancy_optimization.md** (THIS FILE)
   - Documentation and migration guide

## Recommended Action

**DO NOT run Option 2 migration**. The current implementation (Option 1) is optimal:
- No data loss
- Better performance (no JOINs)
- Backward compatible
- Frontend no longer sends redundant data
- Backend fetches fresh data from routes

If you want to clean up the schema in the future, use a VIEW-based approach that maintains compatibility.

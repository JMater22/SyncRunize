-- Migration: Add route_status column to user_routes table
-- Purpose: Distinguish between generated, saved, and completed routes
-- Date: 2025-11-05

-- Step 1: Add the route_status column with CHECK constraint
ALTER TABLE user_routes
ADD COLUMN route_status VARCHAR(20) DEFAULT 'completed'
CHECK (route_status IN ('generated', 'saved', 'completed'));

-- Step 2: Backfill existing routes as 'completed' (they represent actual runs)
UPDATE user_routes
SET route_status = 'completed'
WHERE route_status IS NULL OR route_status = '';

-- Step 3: Make route_status NOT NULL after backfill
ALTER TABLE user_routes
ALTER COLUMN route_status SET NOT NULL;

-- Step 4: Create index for efficient filtering by user and status
CREATE INDEX idx_user_routes_status ON user_routes(user_id, route_status, created_at DESC);

-- Step 5: Create index for activities filtering (only completed routes)
CREATE INDEX idx_user_routes_completed ON user_routes(user_id, created_at DESC)
WHERE route_status = 'completed';

-- Verify the migration
SELECT
    route_status,
    COUNT(*) as count,
    ROUND(CAST(AVG(distance_km) AS numeric), 2) as avg_distance
FROM user_routes
GROUP BY route_status;

-- Show sample data
SELECT route_id, user_id, route_name, route_status, created_at
FROM user_routes
ORDER BY created_at DESC
LIMIT 5;

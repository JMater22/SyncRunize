-- Migration: Add elevation tracking fields to user_routes table
-- Purpose: Support professional-grade run tracking with elevation data (Strava/Nike standard)
-- Date: 2025-11-12

-- Step 1: Add elevation columns
ALTER TABLE user_routes
ADD COLUMN elevation_gain DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN elevation_loss DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN elevation_multiplier DECIMAL(5, 3) DEFAULT NULL;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN user_routes.elevation_gain IS 'Total elevation gained during run in meters (MapBox Terrain-RGB)';
COMMENT ON COLUMN user_routes.elevation_loss IS 'Total elevation lost during run in meters';
COMMENT ON COLUMN user_routes.elevation_multiplier IS 'Calorie adjustment factor based on elevation (1.0 = flat, >1.0 = uphill)';

-- Step 3: Create index for elevation-based queries (optional, for future features)
CREATE INDEX idx_user_routes_elevation ON user_routes(elevation_gain DESC)
WHERE elevation_gain IS NOT NULL;

-- Verify the migration
SELECT
    COUNT(*) as total_routes,
    COUNT(elevation_gain) as routes_with_elevation,
    ROUND(CAST(AVG(elevation_gain) AS numeric), 2) as avg_elevation_gain,
    ROUND(CAST(MAX(elevation_gain) AS numeric), 2) as max_elevation_gain
FROM user_routes;

-- Show sample data with elevation
SELECT route_id, route_name, distance_km, elevation_gain, elevation_loss, elevation_multiplier, created_at
FROM user_routes
ORDER BY created_at DESC
LIMIT 5;

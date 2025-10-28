// models/user_route_model.js
import pool from "../utils/db.js";
import { generateRouteSnapshot } from "../utils/map_snapshot.js";
import { haversineDistance } from "../utils/geo_utils.js";


/**
 * Estimate calories burned based on average pace and duration
 */
export const estimateCalories = (paceMinPerKm, durationSec, weightKg = 70) => {
  const durationHrs = durationSec / 3600;

  let MET;
  if (paceMinPerKm >= 8) {
    MET = 7.0;
  } else if (paceMinPerKm >= 7) {
    MET = 8.3;
  } else if (paceMinPerKm >= 6) {
    MET = 9.8;
  } else if (paceMinPerKm >= 5) {
    MET = 11.5;
  } else {
    MET = 13.5;
  }

  return +(MET * weightKg * durationHrs).toFixed(2);
};

/**
 * Create new route record with automatic snapshot generation
 */
export const createRoute = async (data) => {
  const {
    user_id,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    chosen_path,
    duration_seconds,
    average_pace,
    risk_score = 0,
    route_name = 'Unnamed Route',
    weight_kg = 70,
  } = data;

  // 1️⃣ Compute total distance from the path
  let distanceKm = 0;
  for (let i = 1; i < chosen_path.length; i++) {
    const prev = chosen_path[i - 1];
    const curr = chosen_path[i];
    distanceKm += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }

  const estimated_calories = estimateCalories(
    average_pace, 
    duration_seconds, 
    weight_kg
  );

  // Parse chosen_path if it's a string
  let pathArray;
  try {
    pathArray = typeof chosen_path === 'string' 
      ? JSON.parse(chosen_path) 
      : chosen_path;
    
    console.log('📍 Parsed path array:', pathArray);
    console.log('📍 Path array length:', pathArray?.length);
    console.log('📍 First point:', pathArray?.[0]);
  } catch (parseError) {
    console.error('❌ Failed to parse chosen_path:', parseError);
    pathArray = chosen_path;
  }

  // Generate snapshot URL (will use OSM or Google based on env variable)
  let snapshot_url = null;
  try {
    console.log('🗺️ Attempting to generate snapshot...');
    console.log('🗺️ Provider:', process.env.MAP_SNAPSHOT_PROVIDER || 'osm');
    
    snapshot_url = generateRouteSnapshot(pathArray, {
      width: 800,
      height: 600,
      lineColor: '0080ff',
    });
    
    console.log('✅ Snapshot URL generated:', snapshot_url);
  } catch (error) {
    console.error('❌ Failed to generate route snapshot:', error.message);
    console.error('❌ Full error:', error);
    // Continue without snapshot - don't block route creation
  }

  const pathJson = JSON.stringify(pathArray);

  const result = await pool.query(
    `INSERT INTO user_routes 
      (user_id, start_lat, start_lng, end_lat, end_lng, chosen_path, distance_km,
       duration_seconds, average_pace, risk_score, estimated_calories, 
       route_name, snapshot_url, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
     RETURNING *`,
    [
      user_id,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      pathJson,
      distanceKm,
      duration_seconds,
      average_pace,
      risk_score,
      estimated_calories,
      route_name,
      snapshot_url,
    ]
  );

  return result.rows[0];
};

/**
 * Get user routes
 */
export const getUserRoutes = async (userId, filters = {}) => {
  const { limit = 20, offset = 0, start_date, end_date } = filters;

  let query = `SELECT * FROM user_routes WHERE user_id = $1`;
  const values = [userId];
  let paramIndex = 2;

  if (start_date) {
    query += ` AND created_at >= $${paramIndex++}`;
    values.push(start_date);
  }

  if (end_date) {
    query += ` AND created_at <= $${paramIndex++}`;
    values.push(end_date);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Get route by ID
 */
export const getRouteById = async (routeId) => {
  const result = await pool.query(
    `SELECT * FROM user_routes WHERE id = $1`,
    [routeId]
  );
  return result.rows[0];
};
// models/user_route_model.js
import { supabase } from "../utils/supabase.js";
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
    route_name = "Unnamed Route",
    weight_kg = 70,
    visibility = "private" // ✅ NEW: default
  } = data;

  // Compute distance
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

  // Parse path
  let pathArray;
  try {
    pathArray = typeof chosen_path === "string" ? JSON.parse(chosen_path) : chosen_path;
  } catch {
    pathArray = chosen_path;
  }

  // Generate snapshot
  let snapshot_url = null;
  try {
    snapshot_url = generateRouteSnapshot(pathArray, {
      width: 800,
      height: 600,
      lineColor: "0080ff",
    });
  } catch (error) {
    console.error("Snapshot generation failed:", error);
  }

  const { data: result, error } = await supabase
    .from("user_routes")
    .insert({
      user_id,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      chosen_path: JSON.stringify(pathArray),
      distance_km: distanceKm,
      duration_seconds,
      average_pace,
      risk_score,
      estimated_calories,
      route_name,
      snapshot_url,
      visibility, // ✅ included
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

/**
 * Get user routes
 */
export const getUserRoutes = async (userId, filters = {}) => {
  console.log('========== MODEL getUserRoutes START ==========');
  console.log('Received userId:', userId);
  console.log('Received filters:', filters);
  
  const { limit = 20, offset = 0, start_date, end_date } = filters;
  
  console.log('Parsed filters:', { limit, offset, start_date, end_date });

  let query = supabase
    .from("user_routes")
    .select("*")
    .eq("user_id", userId);

  console.log('Base query created for user_id:', userId);

  if (start_date) {
    query = query.gte("created_at", start_date);
    console.log('Added start_date filter:', start_date);
  }

  if (end_date) {
    query = query.lte("created_at", end_date);
    console.log('Added end_date filter:', end_date);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  console.log('Query configured with order and range');
  console.log('Executing Supabase query...');

  const { data, error } = await query;
  
  console.log('Query executed');
  console.log('Error:', error);
  console.log('Data:', data);
  
  if (error) {
    console.error('Supabase error details:', error);
    throw error;
  }
  
  console.log('Returning', data.length, 'routes');
  return data;
};


/**
 * Get route by ID
 */
export const getRouteById = async (routeId) => {
  const { data, error } = await supabase
    .from("user_routes")
    .select("*")
    .eq("id", routeId)
    .single();
  
  if (error) throw error;
  return data;
};


export const deleteRouteById = async (routeId) => {
  if (!routeId) throw new Error("Route ID is required");

  const { data, error } = await supabase
    .from("user_routes")
    .delete()
    .eq("route_id", routeId)
    .select()
    .single(); // returns the deleted row

  if (error) {
    console.error("Failed to delete route:", error);
    throw error;
  }

  console.log(`Route ${routeId} deleted successfully`, data);
  return data;
};

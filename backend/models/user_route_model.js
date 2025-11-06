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
    visibility = "private", // ✅ NEW: default
    route_status = "generated" // ✅ NEW: default to 'generated' for route creation
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
      route_status, // ✅ NEW: include route_status
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

/**
 * Get user routes
 * @param {number} userId - User ID
 * @param {object} filters - Filter options
 * @param {number} filters.limit - Maximum number of routes to return
 * @param {number} filters.offset - Offset for pagination
 * @param {string} filters.start_date - Filter by start date
 * @param {string} filters.end_date - Filter by end date
 * @param {string} filters.route_status - Filter by route status ('generated', 'saved', 'completed')
 * @param {boolean} filters.activities_only - If true, only return completed routes (for activities view)
 */
export const getUserRoutes = async (userId, filters = {}) => {
  console.log('========== MODEL getUserRoutes START ==========');
  console.log('Received userId:', userId);
  console.log('Received filters:', filters);

  const {
    limit = 1000, // Increased default limit to 1000 for better user experience
    offset = 0,
    start_date,
    end_date,
    route_status,
    activities_only = false,
    visibility
  } = filters;

  console.log('Parsed filters:', { limit, offset, start_date, end_date, route_status, activities_only });

  let query = supabase
    .from("user_routes")
    .select("*")
    .eq("user_id", userId);

  console.log('Base query created for user_id:', userId);

  // ✅ NEW: Filter for activities view - only show completed routes
  if (activities_only) {
    query = query.eq("route_status", "completed");
    console.log('Applied activities_only filter: route_status = completed');
  } else if (route_status) {
    // Allow explicit route_status filtering
    query = query.eq("route_status", route_status);
    console.log('Applied route_status filter:', route_status);
  }

  if (start_date) {
    query = query.gte("created_at", start_date);
    console.log('Added start_date filter:', start_date);
  }

  if (end_date) {
    query = query.lte("created_at", end_date);
    console.log('Added end_date filter:', end_date);
  }
  if (visibility) {
    query = query.eq('visibility', visibility);
    console.log('Applied visibility filter:', visibility);
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
    .eq("route_id", routeId)
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

/**
 * Update route status
 * @param {number} routeId - Route ID
 * @param {number} userId - User ID (for security check)
 * @param {string} status - New status ('generated', 'saved', 'completed')
 */
export const updateRouteStatus = async (routeId, userId, status) => {
  const validStatuses = ['generated', 'saved', 'completed'];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const { data, error } = await supabase
    .from("user_routes")
    .update({ route_status: status })
    .eq("route_id", routeId)
    .eq("user_id", userId) // Security: ensure user owns this route
    .select()
    .single();

  if (error) {
    console.error("Failed to update route status:", error);
    throw error;
  }

  console.log(`Route ${routeId} status updated to '${status}'`);
  return data;
};



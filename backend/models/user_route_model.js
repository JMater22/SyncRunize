// models/user_route_model.js
import { supabase } from "../utils/supabase.js";
import { generateRouteSnapshot } from "../utils/map_snapshot.js";
import { haversineDistance } from "../utils/geo_utils.js";


/**
 * Estimate running calories using distance-based heuristic (~1.036 kcal per kg per km)
 * NOTE: This is a simple fallback. Frontend uses MET-based calculation which is more accurate.
 */
export const estimateCalories = (distanceKm, weightKg) => {
  const safeDistance = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70;
  const KCAL_PER_KG_PER_KM = 1.036;
  return +(safeWeight * safeDistance * KCAL_PER_KG_PER_KM).toFixed(1);
};

/**
 * Calculate distance from GPS path using Haversine formula
 * NOTE: This is less accurate than frontend's Kalman-filtered calculation
 */
export const calculateDistanceFromPath = (pathArray) => {
  let distanceKm = 0;
  if (Array.isArray(pathArray)) {
    for (let i = 1; i < pathArray.length; i++) {
      const prev = pathArray[i - 1];
      const curr = pathArray[i];
      if (prev && curr && Number.isFinite(prev.lat) && Number.isFinite(prev.lng) && Number.isFinite(curr.lat) && Number.isFinite(curr.lng)) {
        distanceKm += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      }
    }
  }
  return distanceKm;
};

/**
 * Validate route metrics for physically impossible values
 * ✅ FIX: Enhanced with route name, coordinate bounds, path validation, and cross-validation
 * Returns { isValid: boolean, reason?: string }
 */
export const validateRouteMetrics = (metrics) => {
  const {
    distance_km, duration_seconds, average_pace, estimated_calories, elevation_gain,
    route_name, chosen_path, start_lat, start_lng, end_lat, end_lng
  } = metrics;

  // ✅ FIX: Route name validation (security: prevent SQL injection, ensure reasonable length)
  if (route_name !== undefined && route_name !== null) {
    if (typeof route_name !== 'string') {
      return { isValid: false, reason: 'Route name must be a string' };
    }
    if (route_name.length === 0 || route_name.length > 255) {
      return { isValid: false, reason: `Route name length ${route_name.length} invalid (expected 1-255 characters)` };
    }
  }

  // ✅ FIX: Coordinate bounds validation helper
  const validateCoordinate = (lat, lng, label) => {
    if (lat !== undefined && lat !== null) {
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return { isValid: false, reason: `${label} latitude ${lat} invalid (expected -90 to 90)` };
      }
    }
    if (lng !== undefined && lng !== null) {
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return { isValid: false, reason: `${label} longitude ${lng} invalid (expected -180 to 180)` };
      }
    }
    return { isValid: true };
  };

  // ✅ FIX: Validate start coordinates
  const startCheck = validateCoordinate(start_lat, start_lng, 'Start');
  if (!startCheck.isValid) return startCheck;

  // ✅ FIX: Validate end coordinates
  const endCheck = validateCoordinate(end_lat, end_lng, 'End');
  if (!endCheck.isValid) return endCheck;

  // ✅ FIX: Path validation (security: prevent DoS with huge arrays)
  if (chosen_path !== undefined && chosen_path !== null) {
    let pathArray;
    try {
      pathArray = typeof chosen_path === 'string' ? JSON.parse(chosen_path) : chosen_path;
    } catch (err) {
      return { isValid: false, reason: 'chosen_path must be valid JSON array' };
    }

    if (!Array.isArray(pathArray)) {
      return { isValid: false, reason: 'chosen_path must be an array' };
    }

    if (pathArray.length < 2) {
      return { isValid: false, reason: `Path has ${pathArray.length} points (minimum 2 required)` };
    }

    // ✅ FIX: Prevent DoS attacks with massive path arrays
    if (pathArray.length > 50000) {
      return { isValid: false, reason: `Path has ${pathArray.length} points (maximum 50000 allowed)` };
    }

    // ✅ FIX: Validate each coordinate in path
    for (let i = 0; i < pathArray.length; i++) {
      const point = pathArray[i];
      if (!point || typeof point !== 'object') {
        return { isValid: false, reason: `Path point ${i} is invalid` };
      }
      const pointCheck = validateCoordinate(point.lat, point.lng, `Path point ${i}`);
      if (!pointCheck.isValid) return pointCheck;
    }
  }

  // Distance validation: 0-500km (ultra marathon max)
  if (distance_km !== undefined && distance_km !== null) {
    if (!Number.isFinite(distance_km) || distance_km < 0 || distance_km > 500) {
      return { isValid: false, reason: `Invalid distance: ${distance_km}km (expected 0-500km)` };
    }
  }

  // Duration validation: 0-24 hours (86400 seconds)
  if (duration_seconds !== undefined && duration_seconds !== null) {
    if (!Number.isFinite(duration_seconds) || duration_seconds < 0 || duration_seconds > 86400) {
      return { isValid: false, reason: `Invalid duration: ${duration_seconds}s (expected 0-86400s)` };
    }
  }

  // ✅ FIX: Cross-validation - distance vs duration consistency check
  if (distance_km > 0 && duration_seconds > 0) {
    const impliedSpeedMps = (distance_km * 1000) / duration_seconds; // meters per second

    // Check for impossibly fast speeds (faster than Usain Bolt's 12.4 m/s sprint)
    if (impliedSpeedMps > 13) {
      return {
        isValid: false,
        reason: `Implied speed ${impliedSpeedMps.toFixed(2)} m/s is impossible (${distance_km}km in ${duration_seconds}s)`
      };
    }

    // Check for impossibly slow speeds (slower than 1 m/s = very slow walking)
    const impliedPace = (duration_seconds / 60) / distance_km; // min/km
    if (impliedPace > 25) {
      return {
        isValid: false,
        reason: `Implied pace ${impliedPace.toFixed(2)} min/km is too slow for running (expected < 25 min/km)`
      };
    }
  }

  // Pace validation: 2:00-20:00 min/km (human running range)
  if (average_pace !== undefined && average_pace !== null && average_pace > 0) {
    if (!Number.isFinite(average_pace) || average_pace < 2 || average_pace > 20) {
      return { isValid: false, reason: `Invalid pace: ${average_pace} min/km (expected 2-20 min/km)` };
    }
  }

  // Calories validation: 0-10,000 kcal (reasonable max)
  if (estimated_calories !== undefined && estimated_calories !== null) {
    if (!Number.isFinite(estimated_calories) || estimated_calories < 0 || estimated_calories > 10000) {
      return { isValid: false, reason: `Invalid calories: ${estimated_calories}kcal (expected 0-10000kcal)` };
    }
  }

  // Elevation validation: gain should not exceed distance × 1000m (extreme case: 45° slope entire route)
  if (elevation_gain !== undefined && elevation_gain !== null && distance_km !== undefined && distance_km > 0) {
    const maxElevation = distance_km * 1000;
    if (!Number.isFinite(elevation_gain) || elevation_gain < 0 || elevation_gain > maxElevation) {
      return { isValid: false, reason: `Invalid elevation gain: ${elevation_gain}m for ${distance_km}km distance` };
    }
  }

  return { isValid: true };
};

/**
 * Create new route record with automatic snapshot generation
 *
 * PROFESSIONAL APPROACH - "Trust but Verify":
 * - Frontend provides accurate calculations (Kalman-filtered GPS, MET-based calories, elevation-adjusted)
 * - Backend validates and accepts frontend values as primary
 * - Backend calculates fallbacks only for missing/invalid data
 * - This ensures: Single source of truth, data consistency, defense in depth
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
    weight_kg = data.weight_kg || 0,
    visibility = "private",
    route_status = "generated",
    risk_score = 0,
    route_name = data.route_name || "Unnamed Route",
    // Professional elevation tracking (MapBox Terrain-RGB)
    elevation_gain = data.elevation_gain || null,
    elevation_loss = data.elevation_loss || null,
    elevation_multiplier = data.elevation_multiplier || null
  } = data;

  // Parse path
  let pathArray;
  try {
    pathArray = typeof chosen_path === "string" ? JSON.parse(chosen_path) : chosen_path;
  } catch {
    pathArray = chosen_path;
  }

  // ========== HYBRID APPROACH: Frontend First, Backend Fallback ==========

  // Calculate backend values as fallback
  const calculatedDistance = calculateDistanceFromPath(pathArray);
  const calculatedPace = calculatedDistance > 0 && duration_seconds > 0
    ? (duration_seconds / 60) / calculatedDistance
    : 0;
  const calculatedCalories = estimateCalories(calculatedDistance, weight_kg);

  // Use frontend values if provided and valid, otherwise use calculated fallback
  // Frontend values are MORE accurate (Kalman filtering, MET-based calories, elevation adjustment)
  const frontendDistance = data.distance_km;
  const frontendPace = data.average_pace;
  const frontendCalories = data.estimated_calories;

  // Determine final values using nullish coalescing (prefer frontend)
  let finalDistance = frontendDistance ?? calculatedDistance;
  let finalPace = frontendPace ?? calculatedPace;
  let finalCalories = frontendCalories ?? calculatedCalories;
  let dataSource = 'unknown';

  // ✅ FIX: Validate all route data including name, coordinates, and path
  const validation = validateRouteMetrics({
    distance_km: frontendDistance,
    duration_seconds,
    average_pace: frontendPace,
    estimated_calories: frontendCalories,
    elevation_gain,
    route_name,
    chosen_path,
    start_lat,
    start_lng,
    end_lat,
    end_lng
  });

  if (!validation.isValid) {
    // Frontend data invalid, use backend calculation
    console.warn(`[Routes] Frontend metrics invalid: ${validation.reason}. Using backend calculation.`);
    finalDistance = calculatedDistance;
    finalPace = calculatedPace;
    finalCalories = calculatedCalories;
    dataSource = 'backend_fallback_invalid';
  } else if (frontendDistance !== undefined && frontendDistance !== null) {
    // Frontend provided valid data
    dataSource = 'frontend_primary';
  } else {
    // Frontend didn't provide data, using backend calculation
    dataSource = 'backend_fallback_missing';
  }

  // Generate snapshot
  let snapshot_url = null;
  try {
    // ✅ FIX: Enhanced logging for snapshot generation debugging
    const provider = process.env.MAP_SNAPSHOT_PROVIDER || 'mapbox';
    console.log('[Routes] Generating route snapshot...', {
      provider,
      pathLength: pathArray.length,
      mapboxTokenPresent: !!process.env.MAPBOX_ACCESS_TOKEN
    });

    snapshot_url = generateRouteSnapshot(pathArray, {
      width: 800,
      height: 600,
      lineColor: "#008000",
    });

    console.log('[Routes] Snapshot generation result:', {
      success: !!snapshot_url,
      url: snapshot_url ? snapshot_url.substring(0, 100) + '...' : 'null'
    });
  } catch (error) {
    console.error("[Routes] Snapshot generation failed:", {
      error: error.message,
      provider: process.env.MAP_SNAPSHOT_PROVIDER || 'mapbox',
      stack: error.stack
    });
  }

  // ========== Database Insert with Final Values ==========
  const { data: result, error } = await supabase
    .from("user_routes")
    .insert({
      user_id,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      chosen_path: JSON.stringify(pathArray),
      distance_km: finalDistance,
      duration_seconds,
      average_pace: finalPace > 0 ? +finalPace.toFixed(2) : 0,
      risk_score,
      estimated_calories: finalCalories,
      route_name,
      snapshot_url,
      visibility,
      route_status,
      // Professional elevation tracking
      elevation_gain: elevation_gain !== null ? +elevation_gain : null,
      elevation_loss: elevation_loss !== null ? +elevation_loss : null,
      elevation_multiplier: elevation_multiplier !== null ? +elevation_multiplier : null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Professional logging with data source tracking
  console.log('[Routes] ✅ Route created successfully', {
    route_id: result?.route_id,
    user_id,
    route_status,
    data_source: dataSource,
    metrics: {
      distance_km: result?.distance_km,
      average_pace: result?.average_pace,
      estimated_calories: result?.estimated_calories,
      elevation_gain: result?.elevation_gain,
      elevation_loss: result?.elevation_loss,
      elevation_multiplier: result?.elevation_multiplier,
    },
    frontend_vs_calculated: dataSource === 'frontend_primary' ? {
      distance_diff: frontendDistance ? (frontendDistance - calculatedDistance).toFixed(3) : 'N/A',
      calories_diff: frontendCalories ? (frontendCalories - calculatedCalories).toFixed(1) : 'N/A',
    } : undefined,
  });

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
 * Validate and parse route ID to prevent injection
 */
const validateRouteId = (routeId) => {
  if (!routeId) throw new Error("Route ID is required");

  const parsed = Number(routeId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid route ID format");
  }

  return parsed;
};

/**
 * Get route by ID
 */
export const getRouteById = async (routeId) => {
  // ✅ SECURITY: Validate route ID before use
  const validatedId = validateRouteId(routeId);

  const { data, error } = await supabase
    .from("user_routes")
    .select("*")
    .eq("route_id", validatedId)
    .single();

  if (error) throw error;
  return data;
};


export const deleteRouteById = async (routeId) => {
  // ✅ SECURITY: Validate route ID before use
  const validatedId = validateRouteId(routeId);

  const { data, error } = await supabase
    .from("user_routes")
    .delete()
    .eq("route_id", validatedId)
    .select()
    .single(); // returns the deleted row

  if (error) {
    console.error("Failed to delete route:", error);
    throw error;
  }

  console.log(`Route ${validatedId} deleted successfully`, data);
  return data;
};

/**
 * Update route status
 * @param {number} routeId - Route ID
 * @param {number} userId - User ID (for security check)
 * @param {string} status - New status ('generated', 'saved', 'completed')
 */
export const updateRouteStatus = async (routeId, userId, status) => {
  // ✅ SECURITY: Validate route ID before use
  const validatedId = validateRouteId(routeId);

  const validStatuses = ['generated', 'saved', 'completed'];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const { data, error } = await supabase
    .from("user_routes")
    .update({ route_status: status })
    .eq("route_id", validatedId)
    .eq("user_id", userId) // Security: ensure user owns this route
    .select()
    .single();

  if (error) {
    console.error("Failed to update route status:", error);
    throw error;
  }

  console.log(`Route ${validatedId} status updated to '${status}'`);
  return data;
};



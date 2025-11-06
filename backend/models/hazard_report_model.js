// models/hazard_report_model.js
import { supabase } from "../utils/supabase.js";

/**
 * Create a new hazard report
 */
export const createHazardReport = async (data) => {
  const {
    user_id,
    incident_type,
    title,
    description,
    lat,
    lng,
    image_url = null,
    severity_weight = 0.5
  } = data;

  const { data: result, error } = await supabase
    .from("hazard_reports")
    .insert({
      user_id,
      incident_type,
      title,
      description,
      lat,
      lng,
      image_url,
      severity_weight,
      status: 'active',
      trust_score: 0.5,
      agreement_score: 0.0,
      reported_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

/**
 * Get hazard reports within a bounding box
 * Used to display hazards on the map
 */
export const getHazardsInBounds = async (bounds) => {
  const { minLat, maxLat, minLng, maxLng, status = 'active' } = bounds;

  let query = supabase
    .from("hazard_reports")
    .select(`
      *,
      users (
        user_id,
        username,
        profile_picture
      )
    `)
    .gte("lat", minLat)
    .lte("lat", maxLat)
    .gte("lng", minLng)
    .lte("lng", maxLng)
    .eq("status", status)
    .order("reported_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Get hazard reports near a point (for route safety calculation)
 */
export const getHazardsNearPoint = async (lat, lng, radiusKm = 0.5) => {
  // Simple bounding box calculation
  // 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const { data, error } = await supabase
    .from("hazard_reports")
    .select("*")
    .gte("lat", lat - latDelta)
    .lte("lat", lat + latDelta)
    .gte("lng", lng - lngDelta)
    .lte("lng", lng + lngDelta)
    .eq("status", "active");

  if (error) throw error;
  return data;
};

/**
 * Get a single hazard report by ID
 */
export const getHazardById = async (reportId) => {
  const { data, error } = await supabase
    .from("hazard_reports")
    .select(`
      *,
      users (
        user_id,
        username,
        profile_picture,
        created_at
      )
    `)
    .eq("report_id", reportId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get user's hazard reports
 */
export const getUserHazardReports = async (userId, filters = {}) => {
  const { limit = 20, offset = 0, status } = filters;

  let query = supabase
    .from("hazard_reports")
    .select("*")
    .eq("user_id", userId)
    .order("reported_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Update hazard report status (for moderation)
 */
export const updateHazardStatus = async (reportId, status, moderatorId = null) => {
  const validStatuses = ['active', 'resolved', 'removed', 'pending'];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const { data, error } = await supabase
    .from("hazard_reports")
    .update({ status })
    .eq("report_id", reportId)
    .select()
    .single();

  if (error) throw error;

  // Log moderation action if moderator is provided
  if (moderatorId) {
    await supabase
      .from("moderation_logs")
      .insert({
        report_id: reportId,
        moderator_id: moderatorId,
        action: `status_changed_to_${status}`,
        created_at: new Date().toISOString()
      });
  }

  return data;
};

/**
 * Delete hazard report
 */
export const deleteHazardReport = async (reportId, userId) => {
  const { data, error } = await supabase
    .from("hazard_reports")
    .delete()
    .eq("report_id", reportId)
    .eq("user_id", userId) // Security: ensure user owns the report
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get incident types with severity weights
 */
export const getIncidentTypes = async () => {
  const { data, error } = await supabase
    .from("incident_severity")
    .select("*")
    .order("severity_weight", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Update hazard trust and agreement scores
 * (Called by algorithm after evaluating nearby reports)
 */
export const updateHazardScores = async (reportId, scores) => {
  const { trust_score, agreement_score } = scores;

  const { data, error } = await supabase
    .from("hazard_reports")
    .update({
      trust_score,
      agreement_score
    })
    .eq("report_id", reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

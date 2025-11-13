// models/hazard_model.js
import { supabase } from "../utils/supabase.js";
import fs from "fs";
import path from "path";


// 🧩 Create a new hazard report with optional image
export const create = async (data) => {
  try {
    const {
      user_id,
      title,
      incident_type,
      description,
      lat,
      lng,
      trust_score = 0,
      agreement_score = 0,
      severity_weight = 0,
      status = "active",
      image_url = null, // ← Optional image URL
    } = data;

    const { data: result, error } = await supabase
      .from("hazard_reports")
      .insert([{
        user_id,
        title,
        incident_type,
        description,
        lat,
        lng,
        trust_score,
        agreement_score,
        severity_weight,
        status,
        image_url
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating hazard:", error.message);
    throw error;
  }
};

/**
 * Get all hazards for a specific user (owner)
 */
export const findByUser = async (user_id) => {
  const { data, error } = await supabase
    .from("hazard_reports")
    .select("*")
    .eq("user_id", user_id)
    .order("reported_at", { ascending: false });

  if (error) throw error;
  return data || [];
};


export const findByTitle = async (title) => {
  const { data, error } = await supabase
    .from("hazard_reports")
    .select("*")
    .ilike("title", `%${title}%`);

  if (error) throw error;
  return data || [];
};


export const updateHazard = async (report_id, user_id, updates) => {
  const {
    title,
    incident_type,
    description,
    lat,
    lng,
    severity_weight,
    image_url,
    status
  } = updates;

  try {
    // 1. Fetch existing record (to check ownership and previous image_url)
    const { data: existing, error: fetchError } = await supabase
      .from("hazard_reports")
      .select("image_url")
      .eq("report_id", report_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !existing) {
      return null; // not found or not owned by user
    }

    const oldImageUrl = existing.image_url;

    // 2. Build update object (only include non-null values)
    const updateData = {};
    if (title !== null && title !== undefined) updateData.title = title;
    if (incident_type !== null && incident_type !== undefined) updateData.incident_type = incident_type;
    if (description !== null && description !== undefined) updateData.description = description;
    if (lat !== null && lat !== undefined) updateData.lat = lat;
    if (lng !== null && lng !== undefined) updateData.lng = lng;
    if (severity_weight !== null && severity_weight !== undefined) updateData.severity_weight = severity_weight;
    if (image_url !== null && image_url !== undefined) updateData.image_url = image_url;
    if (status !== null && status !== undefined) updateData.status = status;

    // 3. Update the DB row
    const { data: result, error: updateError } = await supabase
      .from("hazard_reports")
      .update(updateData)
      .eq("report_id", report_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. If a new image_url was provided and there was an old one — remove old file
    if (image_url && oldImageUrl) {
      try {
        const relativePath = oldImageUrl.startsWith("/") ? oldImageUrl.slice(1) : oldImageUrl;
        const oldPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn("⚠️ Failed to delete old image file:", err.message);
      }
    }

    return result;
  } catch (error) {
    console.error("Error updating hazard:", error.message);
    throw error;
  }
};

/**
 * Delete hazard owned by user (SOFT DELETE). Returns updated row object on success, otherwise null.
 * ✅ IMPROVED: Changes status to 'deleted' instead of removing row permanently.
 * Preserves data for trust score history and audit trail. Images are kept for recovery.
 */
export const deleteHazard = async (report_id, user_id) => {
  try {
    // ✅ SOFT DELETE: Update status instead of deleting row
    const { data: result, error: updateError } = await supabase
      .from("hazard_reports")
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq("report_id", report_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ✅ KEEP IMAGE: Don't delete image file (preserve for audit trail and potential recovery)
    // Images can be cleaned up later via scheduled job for old deleted hazards
    // Example cleanup: DELETE images where deleted_at < NOW() - INTERVAL '90 days'

    return result;
  } catch (error) {
    console.error("Error soft-deleting hazard:", error.message);
    throw error;
  }
};

//I modified this part
// 🧭 Retrieve hazards near a location (within radius in km)
// Using Supabase with RPC function or fetch all and filter client-side
export const findHazardsNearLocation = async (lat, lng, radiusKm) => {
  try {
    // ✅ FIX: Calculate bounding box to filter at database level (dramatically faster)
    // 1 degree of latitude ≈ 111 km, so calculate lat/lng delta for the radius
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    // Fetch only hazards within bounding box (reduces from 1000s to ~5-10 records)
    const { data: hazards, error } = await supabase
      .from("hazard_reports")
      .select(`
        *,
        users:user_id (
          username,
          profile_picture
        )
      `)
      .eq("status", "active")
      .gte("lat", lat - latDelta)  // ✅ FIX: Filter by latitude range
      .lte("lat", lat + latDelta)
      .gte("lng", lng - lngDelta)  // ✅ FIX: Filter by longitude range
      .lte("lng", lng + lngDelta);

    if (error) throw error;

    if (!hazards || hazards.length === 0) {
      return [];
    }

    // Calculate precise distance using Haversine formula and filter
    const hazardsWithDistance = hazards.map(hazard => {
      const distance_km = calculateDistance(lat, lng, hazard.lat, hazard.lng);
      return {
        ...hazard,
        distance_km
      };
    }).filter(hazard => hazard.distance_km < radiusKm);  // Precise radius filter

    // Sort by distance
    hazardsWithDistance.sort((a, b) => a.distance_km - b.distance_km);

    return hazardsWithDistance;
  } catch (error) {
    console.error("❌ Error finding hazards near location:", error.message);
    throw error;
  }
};

// Helper function: Haversine formula to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// ⚙️ Update hazard scores or status. This is for the algorithm updation
export const modifyHazard = async (id, updates) => {
  try {
    const { trust_score, agreement_score, status, image_url } = updates;  // ✅ FIX: Added image_url

    if (status && !["active", "resolved", "hidden"].includes(status)) {
      throw new Error("Invalid hazard status");
    }

    // Build update object (only include defined values)
    const updateData = {};
    if (trust_score !== null && trust_score !== undefined) updateData.trust_score = trust_score;
    if (agreement_score !== null && agreement_score !== undefined) updateData.agreement_score = agreement_score;
    if (status !== null && status !== undefined) updateData.status = status;
    if (image_url !== null && image_url !== undefined) updateData.image_url = image_url;  // ✅ FIX: Added image_url to update

    const { data, error } = await supabase
      .from("hazard_reports")
      .update(updateData)
      .eq("report_id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error modifying hazard:", error.message);
    throw error;
  }
};


export default {
  create,
  findByUser,
  findByTitle,
  updateHazard,
  deleteHazard,
  findHazardsNearLocation,
  modifyHazard,
};



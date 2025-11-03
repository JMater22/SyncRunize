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
      image_url = null,
    } = data;

    const { data: result, error } = await supabase
      .from("hazard_reports")
      .insert({
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
        image_url,
        reported_at: new Date().toISOString(),
      })
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

  // 2. Build update object with only provided values
  const updateData = {};
  if (title !== undefined && title !== null) updateData.title = title;
  if (incident_type !== undefined && incident_type !== null) updateData.incident_type = incident_type;
  if (description !== undefined && description !== null) updateData.description = description;
  if (lat !== undefined && lat !== null) updateData.lat = lat;
  if (lng !== undefined && lng !== null) updateData.lng = lng;
  if (severity_weight !== undefined && severity_weight !== null) updateData.severity_weight = severity_weight;
  if (image_url !== undefined && image_url !== null) updateData.image_url = image_url;
  if (status !== undefined && status !== null) updateData.status = status;
  updateData.reported_at = new Date().toISOString();

  const { data: result, error: updateError } = await supabase
    .from("hazard_reports")
    .update(updateData)
    .eq("report_id", report_id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (updateError) throw updateError;

  // 3. If a new image_url was provided and there was an old one — remove old file
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
};

/**
 * Delete hazard owned by user. Returns deleted row object on success, otherwise null.
 * Also removes image file from disk if present.
 */
export const deleteHazard = async (report_id, user_id) => {
  // 1) Get image_url (to delete file later)
  const { data: existing, error: fetchError } = await supabase
    .from("hazard_reports")
    .select("image_url")
    .eq("report_id", report_id)
    .eq("user_id", user_id)
    .single();

  if (fetchError || !existing) return null;

  const imageUrl = existing.image_url;

  // 2) Delete row and return deleted row
  const { data: result, error: deleteError } = await supabase
    .from("hazard_reports")
    .delete()
    .eq("report_id", report_id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (deleteError) throw deleteError;

  // 3) Delete image file if it existed
  if (imageUrl) {
    try {
      const relativePath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
      const imgPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    } catch (err) {
      console.warn("⚠️ Failed to delete image after deleting DB row:", err.message);
    }
  }

  return result;
};

//I modified this part
// 🧭 Retrieve hazards near a location (within radius in km)
// TODO: This requires PostGIS extension and a PostgreSQL function in Supabase
// For now, using RPC to call a custom function 'find_hazards_near_location'
// You need to create this function in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION find_hazards_near_location(p_lat FLOAT, p_lng FLOAT, p_radius_km FLOAT)
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
*/
export const findHazardsNearLocation = async (lat, lng, radiusKm) => {
  const { data, error } = await supabase.rpc('find_hazards_near_location', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm
  });

  if (error) throw error;
  return data || [];
};

// ⚙️ Update hazard scores or status. This is for the algorithm updation
export const modifyHazard = async (id, updates) => {
  const { trust_score, agreement_score, status } = updates;
  if (status && !["active", "resolved", "hidden"].includes(status)) {
    throw new Error("Invalid hazard status");
  }

  const updateData = {};
  if (trust_score !== undefined && trust_score !== null) updateData.trust_score = trust_score;
  if (agreement_score !== undefined && agreement_score !== null) updateData.agreement_score = agreement_score;
  if (status !== undefined && status !== null) updateData.status = status;
  updateData.reported_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("hazard_reports")
    .update(updateData)
    .eq("report_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
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



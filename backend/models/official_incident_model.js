import { supabase } from "../utils/supabase.js";

// TODO: For spatial queries with lat/lng/radius, you may need to create a PostgreSQL function in Supabase
// For now, implementing basic filtering with Supabase client
export const findIncidents = async (startDate, endDate, lat, lng, radius) => {
  let query = supabase.from("official_incidents").select("*");

  // Apply date filter if both startDate and endDate are provided
  if (startDate && endDate) {
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  // If lat, lng, and radius are provided, filter in-memory (or use RPC for PostGIS)
  // This is a simple haversine calculation - consider creating a PostgreSQL function for better performance
  if (lat && lng && radius) {
    const filtered = (data || []).filter(incident => {
      const distance = 6371 * Math.acos(
        Math.cos(toRadians(lat)) * Math.cos(toRadians(incident.lat)) *
        Math.cos(toRadians(incident.lng) - toRadians(lng)) +
        Math.sin(toRadians(lat)) * Math.sin(toRadians(incident.lat))
      );
      return distance < radius;
    });
    return filtered;
  }

  return data || [];
};

// Helper function for haversine calculation
const toRadians = (degrees) => degrees * (Math.PI / 180);

export const modifyIncident = async (id, updates) => {
  const { severity_weight } = updates;

  const updateData = {};
  if (severity_weight !== undefined && severity_weight !== null) {
    updateData.severity_weight = severity_weight;
  }
  updateData.date = new Date().toISOString();

  const { data, error } = await supabase
    .from("official_incidents")
    .update(updateData)
    .eq("incident_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeIncident = async (id) => {
  const { error } = await supabase
    .from("official_incidents")
    .delete()
    .eq("incident_id", id);

  if (error) throw error;
  return true;
};

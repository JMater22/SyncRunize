// models/saved_route_model.js
import { supabase } from "../utils/supabase.js";

export const saveRoute = async (user_id, route_id) => {
  const { data, error } = await supabase
    .from("saved_routes")
    .insert([{ user_id, route_id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const unsaveRoute = async (user_id, route_id) => {
  const { error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("user_id", user_id)
    .eq("route_id", route_id);

  if (error) throw new Error(error.message);
  return { success: true };
};

export const getSavedRoutesByUser = async (user_id) => {
  const { data, error } = await supabase
    .from("saved_routes")
    .select(`
      route_id,
      saved_at,
      user_routes (
        route_id,
        route_name,
        distance_km,
        snapshot_url,
        is_shared,
        created_at
      )
    `)
    .eq("user_id", user_id)
    .order("saved_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const isRouteSaved = async (user_id, route_id) => {
  const { data, error } = await supabase
    .from("saved_routes")
    .select("saved_id")
    .eq("user_id", user_id)
    .eq("route_id", route_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
};

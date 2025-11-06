import { supabase } from "../utils/supabase.js";

export const getUnSavedPublicRoutes = async (userId) => {
  // 1️⃣ Get all saved route IDs for this user
  const { data: savedRoutes, error: savedError } = await supabase
    .from("saved_routes")
    .select("route_id")
    .eq("user_id", userId);

  if (savedError) throw savedError;

  const savedRouteIds = (savedRoutes || []).map((r) => r.route_id);

  // 2️⃣ Build base query
  let query = supabase
    .from("user_routes")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  // 3️⃣ Only apply exclusion if array is not empty
  if (savedRouteIds.length > 0) {
    query = query.not("route_id", "in", `(${savedRouteIds.join(",")})`);
    // ✅ Supabase expects "(1,2,3)" — this ensures proper format
  }

  // 4️⃣ Execute query
  const { data: routes, error } = await query;
  if (error) throw error;

  return routes;
};

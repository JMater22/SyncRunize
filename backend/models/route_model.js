
import { supabase } from "../utils/supabase.js";


export const getUnSavedPublicRoutes = async (userId) => {

  let savedRouteIds = [];



  if (userId) {

    const { data: savedRoutes, error: savedError } = await supabase

      .from("saved_routes")

      .select("route_id")

      .eq("user_id", userId);



    if (savedError) throw savedError;



    savedRouteIds = (savedRoutes || []).map((r) => r.route_id);

  }



  let query = supabase

    .from("user_routes")

    .select("*")

    .eq("visibility", "public")

    .order("created_at", { ascending: false });



  if (userId && savedRouteIds.length > 0) {

    query = query.not("route_id", "in", `(${savedRouteIds.join(",")})`);

  }



  const { data: routes, error } = await query;

  if (error) throw error;



  return routes;

};


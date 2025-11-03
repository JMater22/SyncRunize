// models/badge_model.js
import { supabase } from "../utils/supabase.js";

export const getBadgeByChallenge = async (challengeId) => {
  const { data, error } = await supabase
    .from("challenge_badges")
    .select(`
      badges(*)
    `)
    .eq("challenge_id", challengeId)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data?.badges || null;
};

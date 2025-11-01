// models/challenge_model.js
import { supabase } from "../utils/supabase.js";

export const getAllChallenges = async () => {
  const { data, error } = await supabase
    .from("challenges")
    .select("challenge_id, slug, name, description, target_distance_km, duration_days, intensity")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getChallengeById = async (challengeId) => {
  const { data, error } = await supabase
    .from("challenges")
    .select("challenge_id, slug, name, description, target_distance_km, duration_days, intensity")
    .eq("challenge_id", challengeId)
    .single();
  
  if (error) throw error;
  return data;
};
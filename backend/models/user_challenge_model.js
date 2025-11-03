// models/user_challenge_model.js
import { supabase } from "../utils/supabase.js";

export const createUserChallenge = async (userId, challengeId) => {
  const { data, error } = await supabase
    .from("user_challenges")
    .insert({
      user_id: userId,
      challenge_id: challengeId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUserChallenge = async (userChallengeId) => {
  const { error } = await supabase
    .from("user_challenges")
    .delete()
    .eq("user_challenge_id", userChallengeId);

  if (error) throw error;
};

export const getUserChallenges = async (userId) => {
  const { data, error } = await supabase
    .from("user_challenges")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
};

// NOTE: This uses increment operations - might need PostgreSQL function for atomic updates
export const updateProgress = async (userChallengeId, { add_distance, add_runs }) => {
  // Fetch current values
  const { data: current, error: fetchError } = await supabase
    .from("user_challenges")
    .select("total_distance_km, total_runs")
    .eq("user_challenge_id", userChallengeId)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from("user_challenges")
    .update({
      total_distance_km: (current.total_distance_km || 0) + add_distance,
      total_runs: (current.total_runs || 0) + add_runs,
      updated_at: new Date().toISOString(),
    })
    .eq("user_challenge_id", userChallengeId)
    .select()
    .single();

  console.log("📊 Updating progress for:", { userChallengeId, add_distance, add_runs });

  if (error) throw error;
  return data;
};

export const setProgress = async (userChallengeId, fields) => {
  const {
    total_distance_km,
    total_runs,
    progress_percent,
    completed,
    awarded_badge_id,
  } = fields;

  const { data, error } = await supabase
    .from("user_challenges")
    .update({
      total_distance_km,
      total_runs,
      progress_percent,
      completed,
      awarded_badge_id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_challenge_id", userChallengeId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

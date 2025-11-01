// models/user_challenge_model.js
import { supabase } from "../utils/supabase.js";

export const createUserChallenge = async (userId, challengeId) => {
  const { data, error } = await supabase
    .from("user_challenges")
    .insert({ user_id: userId, challenge_id: challengeId })
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
    .select(`
      *,
      challenges:challenge_id (
        challenge_id,
        slug,
        name,
        description,
        target_distance_km,
        frequency_type,
        frequency_value,
        duration_days,
        intensity,
        created_at,
        image_url
      ),
      badges:awarded_badge_id (
        badge_id,
        code,
        name,
        tier,
        image_url,
        description
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(item => ({
    ...item,
    challenge_name: item.challenges?.name || null,
    challenge_slug: item.challenges?.slug || null,
    challenge_description: item.challenges?.description || null,
    challenge_image: item.challenges?.image_url || null,
    challenge_duration_days: item.challenges?.duration_days || null,
    badge_id: item.badges?.badge_id || null,
    badge_name: item.badges?.name || null,
    badge_image: item.badges?.image_url || null,
    badge_tier: item.badges?.tier || null,
    badges: undefined,
    challenges: undefined
  }));
};

export const updateProgress = async (userChallengeId, { add_distance, add_runs }) => {
  // First, get the current values
  const { data: current, error: fetchError } = await supabase
    .from("user_challenges")
    .select("total_distance_km, total_runs")
    .eq("user_challenge_id", userChallengeId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Then update with the new values
  const { data, error } = await supabase
    .from("user_challenges")
    .update({
      total_distance_km: (current.total_distance_km || 0) + add_distance,
      total_runs: (current.total_runs || 0) + add_runs,
      updated_at: new Date().toISOString()
    })
    .eq("user_challenge_id", userChallengeId)
    .select()
    .single();
  
  if (error) throw error;
  
  console.log("📊 Updating progress for:", { userChallengeId, add_distance, add_runs });
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
      updated_at: new Date().toISOString()
    })
    .eq("user_challenge_id", userChallengeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};




// Add this to models/user_challenge_model.js

/**
 * Get user challenges with badge details (including image_url and tier)
 */
export const getUserChallengesWithBadge = async (userId) => {
  const { data, error } = await supabase
    .from("user_challenges")
    .select(`
      *,
      badges:awarded_badge_id (
        badge_id,
        code,
        name,
        tier,
        image_url,
        description
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  
  // Transform the data to flatten badge info and handle null badges
  return data.map(challenge => ({
    ...challenge,
    badge_id: challenge.badges?.badge_id || null,
    badge_code: challenge.badges?.code || null,
    badge_name: challenge.badges?.name || null,
    badge_tier: challenge.badges?.tier || null,
    badge_image_url: challenge.badges?.image_url || null,
    badge_description: challenge.badges?.description || null,
    // Remove the nested badges object for cleaner response
    badges: undefined
  }));
};

/**
 * Get a single user challenge with badge details
 */
export const getUserChallengeWithBadge = async (userChallengeId) => {
  const { data, error } = await supabase
    .from("user_challenges")
    .select(`
      *,
      badges:awarded_badge_id (
        badge_id,
        code,
        name,
        tier,
        image_url,
        description
      )
    `)
    .eq("user_challenge_id", userChallengeId)
    .single();
  
  if (error) throw error;
  
  // Flatten badge info
  return {
    ...data,
    badge_id: data.badges?.badge_id || null,
    badge_code: data.badges?.code || null,
    badge_name: data.badges?.name || null,
    badge_tier: data.badges?.tier || null,
    badge_image_url: data.badges?.image_url || null,
    badge_description: data.badges?.description || null,
    badges: undefined
  };
};
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

export const deleteUserChallengeByUserAndChallenge = async (userId, challengeId) => {
  const { error } = await supabase
    .from("user_challenges")
    .delete()
    .eq("user_id", userId)
    .eq("challenge_id", challengeId);

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

  // Calculate current date for expiration check
  const currentDate = new Date();
  const expiredChallengeIds = [];

  // Check each challenge for expiration
  const filteredData = data.filter(item => {
    // Skip if challenge is already completed
    if (item.completed) return true;

    // Check if challenge has duration
    const durationDays = item.challenges?.duration_days;
    if (!durationDays) return true; // No duration = no expiration

    // Calculate days since user joined the challenge
    const joinedDate = new Date(item.created_at);
    const daysSinceJoined = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));

    // Check if challenge has expired
    if (daysSinceJoined > durationDays) {
      console.log(`⏰ Challenge expired: ${item.challenges?.name} (joined ${daysSinceJoined} days ago, duration: ${durationDays} days)`);
      expiredChallengeIds.push(item.user_challenge_id);
      return false; // Filter out expired challenge
    }

    return true; // Keep non-expired challenge
  });

  // Auto-remove expired challenges from database
  if (expiredChallengeIds.length > 0) {
    console.log(`🗑️ Auto-removing ${expiredChallengeIds.length} expired challenge(s)...`);
    const { error: deleteError } = await supabase
      .from("user_challenges")
      .delete()
      .in("user_challenge_id", expiredChallengeIds);

    if (deleteError) {
      console.error("❌ Failed to auto-remove expired challenges:", deleteError);
    } else {
      console.log(`✅ Successfully removed ${expiredChallengeIds.length} expired challenge(s)`);
    }
  }

  return filteredData.map(item => {
    // Calculate remaining days for active challenges
    let daysRemaining = null;
    if (!item.completed && item.challenges?.duration_days) {
      const joinedDate = new Date(item.created_at);
      const daysSinceJoined = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));
      daysRemaining = item.challenges.duration_days - daysSinceJoined;
      // Ensure it's not negative (should be filtered already, but just in case)
      daysRemaining = Math.max(0, daysRemaining);
    }

    return {
      ...item,
      challenge_name: item.challenges?.name || null,
      challenge_slug: item.challenges?.slug || null,
      challenge_description: item.challenges?.description || null,
      challenge_image: item.challenges?.image_url || null,
      challenge_duration_days: item.challenges?.duration_days || null,
      days_remaining: daysRemaining,
      badge_id: item.badges?.badge_id || null,
      badge_name: item.badges?.name || null,
      badge_image: item.badges?.image_url || null,
      badge_tier: item.badges?.tier || null,
      badges: undefined,
      challenges: undefined
    };
  });
};



export const getAllChallengesWithStatus = async (userId) => {
  // 1️⃣ Fetch all challenges
  const { data: challenges, error: challengesError } = await supabase
    .from("challenges")
    .select(`
      challenge_id,
      slug,
      name,
      description,
      target_distance_km,
      frequency_type,
      frequency_value,
      duration_days,
      intensity,
      image_url,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (challengesError) throw challengesError;

  // 2️⃣ Fetch user_challenges of this user (include progress info and created_at for expiration check)
  const { data: userChallenges, error: userError } = await supabase
    .from("user_challenges")
    .select("user_challenge_id, challenge_id, completed, progress_percent, created_at")
    .eq("user_id", userId);

  if (userError) throw userError;

  // Check for expired challenges and remove them
  const currentDate = new Date();
  const expiredChallengeIds = [];

  userChallenges.forEach((uc) => {
    // Skip if already completed
    if (uc.completed) return;

    // Find the challenge to get duration
    const challenge = challenges.find(ch => ch.challenge_id === uc.challenge_id);
    if (!challenge || !challenge.duration_days) return;

    // Calculate days since joined
    const joinedDate = new Date(uc.created_at);
    const daysSinceJoined = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));

    // Check if expired
    if (daysSinceJoined > challenge.duration_days) {
      console.log(`⏰ [getAllChallengesWithStatus] Challenge expired: ${challenge.name} (joined ${daysSinceJoined} days ago, duration: ${challenge.duration_days} days)`);
      expiredChallengeIds.push(uc.user_challenge_id);
    }
  });

  // Auto-remove expired challenges from database
  if (expiredChallengeIds.length > 0) {
    console.log(`🗑️ [getAllChallengesWithStatus] Auto-removing ${expiredChallengeIds.length} expired challenge(s)...`);
    const { error: deleteError } = await supabase
      .from("user_challenges")
      .delete()
      .in("user_challenge_id", expiredChallengeIds);

    if (deleteError) {
      console.error("❌ Failed to auto-remove expired challenges:", deleteError);
    } else {
      console.log(`✅ Successfully removed ${expiredChallengeIds.length} expired challenge(s)`);
    }
  }

  // 3️⃣ Build a lookup map for fast matching (exclude expired challenges)
  const expiredSet = new Set(expiredChallengeIds);
  const joinedMap = new Map();
  userChallenges.forEach((uc) => {
    // Skip expired challenges
    if (expiredSet.has(uc.user_challenge_id)) return;

    joinedMap.set(uc.challenge_id, {
      joined: true,
      completed: uc.completed,
      progress_percent: uc.progress_percent ?? 0,
    });
  });

  // 4️⃣ Merge user progress/status into challenges
  const challengesWithStatus = challenges.map((ch) => {
    const userStatus = joinedMap.get(ch.challenge_id);
    return {
      ...ch,
      joined: userStatus?.joined ?? false,
      completed: userStatus?.completed ?? false,
      progress_percent: userStatus?.progress_percent ?? 0,
    };
  });

  return challengesWithStatus;
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
      challenges:challenge_id (
        challenge_id,
        name,
        slug,
        duration_days
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

  // Calculate current date for expiration check
  const currentDate = new Date();
  const expiredChallengeIds = [];

  // Check each challenge for expiration
  const filteredData = data.filter(item => {
    // Skip if challenge is already completed
    if (item.completed) return true;

    // Check if challenge has duration
    const durationDays = item.challenges?.duration_days;
    if (!durationDays) return true; // No duration = no expiration

    // Calculate days since user joined the challenge
    const joinedDate = new Date(item.created_at);
    const daysSinceJoined = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));

    // Check if challenge has expired
    if (daysSinceJoined > durationDays) {
      console.log(`⏰ [getUserChallengesWithBadge] Challenge expired: ${item.challenges?.name} (joined ${daysSinceJoined} days ago, duration: ${durationDays} days)`);
      expiredChallengeIds.push(item.user_challenge_id);
      return false; // Filter out expired challenge
    }

    return true; // Keep non-expired challenge
  });

  // Auto-remove expired challenges from database
  if (expiredChallengeIds.length > 0) {
    console.log(`🗑️ [getUserChallengesWithBadge] Auto-removing ${expiredChallengeIds.length} expired challenge(s)...`);
    const { error: deleteError } = await supabase
      .from("user_challenges")
      .delete()
      .in("user_challenge_id", expiredChallengeIds);

    if (deleteError) {
      console.error("❌ Failed to auto-remove expired challenges:", deleteError);
    } else {
      console.log(`✅ Successfully removed ${expiredChallengeIds.length} expired challenge(s)`);
    }
  }

  // Transform the data to flatten badge info and handle null badges
  return filteredData.map(challenge => {
    // Calculate remaining days for active challenges
    let daysRemaining = null;
    if (!challenge.completed && challenge.challenges?.duration_days) {
      const joinedDate = new Date(challenge.created_at);
      const daysSinceJoined = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));
      daysRemaining = challenge.challenges.duration_days - daysSinceJoined;
      daysRemaining = Math.max(0, daysRemaining);
    }

    return {
      ...challenge,
      challenge_name: challenge.challenges?.name || null,
      challenge_slug: challenge.challenges?.slug || null,
      challenge_duration_days: challenge.challenges?.duration_days || null,
      days_remaining: daysRemaining,
      badge_id: challenge.badges?.badge_id || null,
      badge_code: challenge.badges?.code || null,
      badge_name: challenge.badges?.name || null,
      badge_tier: challenge.badges?.tier || null,
      badge_image_url: challenge.badges?.image_url || null,
      badge_description: challenge.badges?.description || null,
      // Remove the nested badges object for cleaner response
      badges: undefined,
      challenges: undefined
    };
  });
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

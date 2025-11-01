// controllers/user_route_controller.js
import * as RouteModel from "../models/user_route_model.js";
import * as UserChallengeModel from "../models/user_challenge_model.js";
import * as ChallengeModel from "../models/challenge_model.js";
import { computeProgressPercent, awardBadgeIfQualified } from "../services/award_service.js";
import { supabase } from '../utils/supabase.js';

export const getUserIdFromAuth = async (req, res) => {
  try {
    // 1. Get the auth user id from Supabase auth
    const { user } = await supabase.auth.getUser(); // or req.user if you already have session

    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const authId = user.id; // Supabase auth ID

    // 2. Query your "users" table to get the user_id
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', authId) // make sure your users table has auth_id column
      .single(); // expecting only one result

    if (error) throw error;

    return res.json({ user_id: data.user_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
/**
 * Create a new route and auto-update active challenges & badges
 */

export const fetchUserIdFromAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.split(' ')[1];
  if (!token) throw new Error("Invalid Authorization header");

  // Pass token to getUser
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', user.id)
    .single();

  if (error) throw error;

  return data.user_id;
};


export const createRoute = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);

    // 1️⃣ Create the route (includes distance & snapshot)
    const newRoute = await RouteModel.createRoute({
      ...req.body,
      user_id: userId,
    });

    // 2️⃣ Fetch all active (not completed) user challenges
    const userChallenges = await UserChallengeModel.getUserChallenges(userId);
    const activeChallenges = userChallenges.filter((uc) => !uc.completed);

    const updates = [];

    for (const uc of activeChallenges) {
      const challenge = await ChallengeModel.getChallengeById(uc.challenge_id);
      if (!challenge) {
        console.warn(`⚠️ No challenge found for ID ${uc.challenge_id}`);
        continue;
      }

      console.log(`📊 Updating progress for userChallenge ${uc.user_challenge_id}`);
      console.log(`➡️  Current total_distance_km: ${uc.total_distance_km}, challenge target: ${challenge.target_distance_km}`);

      // Step 1: Update cumulative distance & runs
      const updatedProgress = await UserChallengeModel.updateProgress(uc.user_challenge_id, {
        add_distance: newRoute.distance_km,
        add_runs: 1,
      });

      console.log("✅ After updateProgress:", updatedProgress);

      // Step 2: Compute new percent
      const recomputed = computeProgressPercent(updatedProgress, challenge);
      console.log("🏁 Recomputed progress:", recomputed);

      // Step 3: Award badge if newly completed
      let awardedBadge = null;
      if (recomputed.completed && !updatedProgress.completed) {
        awardedBadge = await awardBadgeIfQualified(updatedProgress, challenge);
        console.log("🎖️ Badge awarded:", awardedBadge);
      }

      // Step 4: Save recomputed fields
      const final = await UserChallengeModel.setProgress(uc.user_challenge_id, {
        total_distance_km: updatedProgress.total_distance_km,
        total_runs: updatedProgress.total_runs,
        progress_percent: recomputed.percent,
        completed: recomputed.completed,
        awarded_badge_id: awardedBadge
          ? awardedBadge.badge_id
          : updatedProgress.awarded_badge_id,
      });

      console.log("💾 Final progress saved:", final);

      updates.push({
        challenge_id: uc.challenge_id,
        progress_percent: final.progress_percent,
        completed: final.completed,
        awarded_badge: awardedBadge || null,
      });
    }

    res.status(201).json({
      message: "✅ Route saved successfully and challenges updated.",
      route: newRoute,
      challenges_updated: updates,
    });
  } catch (err) {
    console.error("❌ Route creation failed:", err);
    res.status(500).json({ error: "Failed to save route or update challenges" });
  }
};



/**
 * Fetch all user routes
 */
export const getUserRoutes = async (req, res) => {
  try {
    console.log('========== getUserRoutes START ==========');
    console.log('req.user:', req.user);
    console.log('req.query:', req.query);
    
    const userId = req.user.id;
    console.log('Using userId:', userId);
    
    if (!userId) {
      throw new Error('User ID is undefined or null');
    }
    
    const filters = req.query;
    console.log('Filters to apply:', filters);
    
    const routes = await RouteModel.getUserRoutes(userId, filters);
    console.log('Routes fetched successfully:', routes.length, 'routes');
    
    res.json(routes);
  } catch (err) {
    console.error("❌ Fetching user routes failed:");
    console.error("Error Type:", err.constructor.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    console.error("Full Error Object:", err);
    
    res.status(500).json({ 
      error: "Failed to fetch user routes",
      details: err.message,
      type: err.constructor.name
    });
  }
};

export const getUserRoutesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId; // Get from URL parameter
    const filters = req.query;
    
    console.log('Fetching routes for user:', userId);
    
    const routes = await RouteModel.getUserRoutes(userId, filters);
    
    console.log('Routes found:', routes.length);
    
    res.json(routes);
  } catch (err) {
    console.error("❌ Fetching user routes failed:", err);
    res.status(500).json({ error: "Failed to fetch user routes", details: err.message });
  }
};

/**
 * Get a specific route by ID
 */
export const getRouteById = async (req, res) => {
  try {
    const route = await RouteModel.getRouteById(req.params.id);
    if (!route) return res.status(404).json({ error: "Route not found" });
    res.json(route);
  } catch (err) {
    console.error("❌ Fetching route failed:", err);
    res.status(500).json({ error: "Failed to fetch route" });
  }
};


export const getUserChallengesWithBadge = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const challenges = await UserChallengeModel.getUserChallengesWithBadge(userId);
    
    res.status(200).json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error("Error fetching user challenges with badges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user challenges",
      error: error.message
    });
  }
};

/**
 * Get a single user challenge with badge details
 * GET /api/user-challenges/detail/:userChallengeId
 */
export const getUserChallengeWithBadge = async (req, res) => {
  try {
    const { userChallengeId } = req.params;
    
    const challenge = await UserChallengeModel.getUserChallengeWithBadge(userChallengeId);
    
    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error("Error fetching user challenge with badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user challenge",
      error: error.message
    });
  }
};
//getUsser
export const getUserChallenges = async (req, res) => {
  const { userId } = req.params; // get userId from URL
  try {
    const challenges = await UserChallengeModel.getUserChallenges(userId); // call model function
    return res.status(200).json({ challenges });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Controller
export const deleteRoute = async (req, res) => {
  const routeId = parseInt(req.params.routeId); // match the route param
  try {
    const deleted = await RouteModel.deleteRouteById(routeId);
    return res.status(200).json({ message: "Deleted successfully", deleted });
  } catch (error) {
    console.error("Delete route error:", error);
    return res.status(500).json({ error: error.message });
  }
};

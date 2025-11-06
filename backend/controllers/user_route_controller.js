// controllers/user_route_controller.js
import * as RouteModel from "../models/user_route_model.js";
import * as UserChallengeModel from "../models/user_challenge_model.js";
import * as ChallengeModel from "../models/challenge_model.js";
import { computeProgressPercent, awardBadgeIfQualified } from "../services/award_service.js";
import * as NotificationService from "../services/notification_service.js";
import { supabase } from '../utils/supabase.js';

export const getUserIdFromAuth = async (_req, res) => {
  try {
    // 1. Get the auth user id from Supabase auth
    const { user } = await supabase.auth.getUser(); // or _req.user if you already have session

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


/**
 * Generate a new route (temporary - status: 'generated')
 * This creates a route without updating challenges/badges
 * Use this when user is just exploring/creating routes
 */
export const generateRoute = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);

    // ✅ Validate visibility
    const allowedVisibilities = ["public", "private"];
    let visibility = req.body.visibility || "private";
    if (!allowedVisibilities.includes(visibility)) {
      return res.status(400).json({ error: "Invalid visibility value. Must be 'public' or 'private'." });
    }

    // ✅ Create route with status 'generated'
    const newRoute = await RouteModel.createRoute({
      ...req.body,
      user_id: userId,
      visibility,
      route_status: "generated" // NEW: mark as generated (temporary)
    });

    res.status(201).json({
      message: "✅ Route generated successfully",
      route: newRoute,
    });
  } catch (err) {
    console.error("❌ Route generation failed:", err);
    res.status(500).json({ error: "Failed to generate route" });
  }
};

/**
 * Complete a run (creates route with status: 'completed')
 * This is the original createRoute functionality
 * Updates challenges and awards badges
 */
export const completeRun = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);

    // ✅ Validate visibility
    const allowedVisibilities = ["public", "private"];
    let visibility = req.body.visibility || "private";
    if (!allowedVisibilities.includes(visibility)) {
      return res.status(400).json({ error: "Invalid visibility value. Must be 'public' or 'private'." });
    }

    // ✅ Create route with status 'completed'
    const newRoute = await RouteModel.createRoute({
      ...req.body,
      user_id: userId,
      visibility,
      route_status: "completed" // NEW: mark as completed run
    });

    // (Keep your existing challenge update logic as is)
    const userChallenges = await UserChallengeModel.getUserChallenges(userId);
    const activeChallenges = userChallenges.filter((uc) => !uc.completed);
    const updates = [];

    for (const uc of activeChallenges) {
      const challenge = await ChallengeModel.getChallengeById(uc.challenge_id);
      if (!challenge) continue;

      const updatedProgress = await UserChallengeModel.updateProgress(uc.user_challenge_id, {
        add_distance: newRoute.distance_km,
        add_runs: 1,
      });

      const recomputed = computeProgressPercent(updatedProgress, challenge);

      let awardedBadge = null;
      if (recomputed.completed && !updatedProgress.completed) {
        awardedBadge = await awardBadgeIfQualified(updatedProgress, challenge);
      }

      const final = await UserChallengeModel.setProgress(uc.user_challenge_id, {
        total_distance_km: updatedProgress.total_distance_km,
        total_runs: updatedProgress.total_runs,
        progress_percent: recomputed.percent,
        completed: recomputed.completed,
        awarded_badge_id: awardedBadge
          ? awardedBadge.badge_id
          : updatedProgress.awarded_badge_id,
      });

      // Notify on completion and badge earned
      try {
        if (recomputed.completed && !updatedProgress.completed) {
          await NotificationService.notifyChallengeComplete(
            userId,
            uc.challenge_id,
            challenge.name,
            awardedBadge?.image_url || null
          );
        }
        if (awardedBadge) {
          await NotificationService.notifyBadgeEarned(
            userId,
            awardedBadge.name,
            awardedBadge.image_url || null
          );
        }
      } catch (e) {
        console.error('[Notif.error] challenge notifications failed:', e?.message || e);
      }

      updates.push({
        challenge_id: uc.challenge_id,
        progress_percent: final.progress_percent,
        completed: final.completed,
        awarded_badge: awardedBadge || null,
      });
    }

    res.status(201).json({
      message: "✅ Run completed successfully and challenges updated.",
      route: newRoute,
      challenges_updated: updates,
    });
  } catch (err) {
    console.error("❌ Run completion failed:", err);
    res.status(500).json({ error: "Failed to complete run or update challenges" });
  }
};

/**
 * Save a generated route (updates status from 'generated' to 'saved')
 * Also adds to saved_routes table
 */
export const saveGeneratedRoute = async (req, res) => {
  try {
    const userId = await fetchUserIdFromAuth(req);
    const { routeId } = req.params;

    if (!routeId) {
      return res.status(400).json({ error: "Route ID is required" });
    }

    // Update route status to 'saved'
    const updatedRoute = await RouteModel.updateRouteStatus(
      parseInt(routeId),
      userId,
      'saved'
    );

    res.status(200).json({
      message: "✅ Route saved successfully",
      route: updatedRoute,
    });
  } catch (err) {
    console.error("❌ Save route failed:", err);
    res.status(500).json({ error: err.message || "Failed to save route" });
  }
};

/**
 * Legacy createRoute - kept for backward compatibility
 * Defaults to 'completed' status
 */
export const createRoute = async (req, res) => {
  // Default to completing a run for backward compatibility
  return completeRun(req, res);
};



/**
 * Fetch all user routes
 * Supports filtering by route_status and activities_only flag
 */
export const getUserRoutes = async (req, res) => {
  try {
    console.log('========== getUserRoutes START ==========');
    console.log('req.user:', req.user);
    console.log('req.query:', req.query);

    const userId = req.user.user_id; // ✅ Integer from users table
    console.log('Using userId:', userId);

    if (!userId) {
      throw new Error('User ID is undefined or null');
    }

    // ✅ NEW: Parse filters including activities_only and route_status
    const filters = {
      ...req.query,
      // Convert string 'true'/'false' to boolean for activities_only
      activities_only: req.query.activities_only === 'true',
    };
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

    // ✅ NEW: Parse filters including activities_only
    const filters = {
      ...req.query,
      // Convert string 'true'/'false' to boolean for activities_only
      activities_only: req.query.activities_only === 'true',
    };

    console.log('Fetching routes for user:', userId);
    console.log('Filters:', filters);

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

// controllers/user_route_controller.js
import * as RouteModel from "../models/user_route_model.js";
import * as UserChallengeModel from "../models/user_challenge_model.js";
import * as ChallengeModel from "../models/challenge_model.js";
import { computeProgressPercent, awardBadgeIfQualified } from "../services/award_service.js";

/**
 * Create a new route and auto-update active challenges & badges
 */
export const createRoute = async (req, res) => {
  try {
    const userId = req.user.userId;

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
    const userId = req.user.userId;
    const filters = req.query;
    const routes = await RouteModel.getUserRoutes(userId, filters);
    res.json(routes);
  } catch (err) {
    console.error("❌ Fetching user routes failed:", err);
    res.status(500).json({ error: "Failed to fetch user routes" });
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

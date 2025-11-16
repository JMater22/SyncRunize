// controllers/challenge_controller.js
import * as ChallengeModel from "../models/challenge_model.js";
import * as UserChallengeModel from "../models/user_challenge_model.js";
import { deleteCache } from "../utils/redis.js";

// GET /api/challenges → all challenges
export const getAllChallenges = async (req, res) => {
  try {
    const challenges = await ChallengeModel.getAllChallenges();
    res.json(challenges);
  } catch (err) {
    console.error("❌ Fetching challenges failed:", err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
};

// POST /api/user-challenges/join → join a challenge
// POST /api/user-challenges/:userId/join
// POST /api/user-challenges/:userId/join
// POST /api/user-challenges/:userId/join
export const joinChallenge = async (req, res) => {
  try {
    const { userId } = req.params;                // from route params
    const { challenge_id } = req.body;           // from body

    // basic validation
    if (!userId || !challenge_id) {
      return res.status(400).json({ error: "userId (param) and challenge_id (body) are required" });
    }

    const parsedUserId = Number(userId);
    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({ error: "invalid userId" });
    }

    // Check if already joined using your model method
    const existing = await UserChallengeModel.getUserChallenges(parsedUserId);
    if (existing.some(uc => uc.challenge_id === challenge_id)) {
      return res.status(400).json({ error: "Challenge already joined" });
    }

    // Insert new user_challenge using your model (createUserChallenge(userId, challengeId))
    const user_challenge = await UserChallengeModel.createUserChallenge(parsedUserId, challenge_id);

    // Invalidate cache for this user's challenges
    await deleteCache([
      `challenges:status:${parsedUserId}`,
      `challenges:progress:${parsedUserId}`,
      `challenges:all:${parsedUserId}`
    ]);

    return res.status(201).json({ message: "Challenge joined", user_challenge });
  } catch (err) {
    console.error("❌ Joining challenge failed:", err);
    return res.status(500).json({ error: "Failed to join challenge" });
  }
};

// DELETE /api/user-challenges/:userChallengeId/leave
export const leaveChallenge = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;

    if (!userId || !challengeId) {
      return res.status(400).json({ error: "userId and challengeId are required" });
    }

    await UserChallengeModel.deleteUserChallengeByUserAndChallenge(userId, challengeId);

    // Invalidate cache for this user's challenges
    await deleteCache([
      `challenges:status:${userId}`,
      `challenges:progress:${userId}`,
      `challenges:all:${userId}`
    ]);

    return res.json({ message: "Challenge left successfully" });
  } catch (err) {
    console.error("❌ Leaving challenge failed:", err);
    return res.status(500).json({ error: "Failed to leave challenge" });
  }
};




// GET /api/challenges/user/:userId → fetch all challenges user joined
export const getUserChallengesProgress = async (req, res) => {
  try {
    const userId = req.user.user_id; // ✅ Integer from users table

    // Fetch all user challenges for this user
    const userChallenges = await UserChallengeModel.getUserChallenges(userId);

    // Optionally, fetch challenge details for each
    const challengesWithProgress = await Promise.all(
      userChallenges.map(async (uc) => {
        const challenge = await ChallengeModel.getChallengeById(uc.challenge_id);

        return {
          user_challenge_id: uc.user_challenge_id,
          challenge_id: uc.challenge_id,
          challenge_name: challenge.name,
          challenge_description: challenge.description,
          total_distance_km: uc.total_distance_km,
          total_runs: uc.total_runs,
          progress_percent: uc.progress_percent,
          completed: uc.completed,
          awarded_badge_id: uc.awarded_badge_id,
        };
      })
    );

    res.json(challengesWithProgress);
  } catch (err) {
    console.error("❌ Fetching user challenges failed:", err);
    res.status(500).json({ error: "Failed to fetch user challenges" });
  }
};



export const getAllChallengesWithStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const parsedId = Number(userId);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const challenges = await UserChallengeModel.getAllChallengesWithStatus(parsedId);

    return res.status(200).json({
      user_id: parsedId,
      total: challenges.length,
      challenges,
    });
  } catch (err) {
    console.error("❌ Error fetching challenges with status:", err);
    return res.status(500).json({ error: "Failed to retrieve challenges" });
  }
};
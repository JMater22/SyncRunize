// controllers/challenge_controller.js
import * as ChallengeModel from "../models/challenge_model.js";
import * as UserChallengeModel from "../models/user_challenge_model.js";

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
export const joinChallenge = async (req, res) => {
  try {
    const userId = req.user.userId; // from auth middleware
    const { challenge_id } = req.body;

    // Check if already joined
    const existing = await UserChallengeModel.getUserChallenges(userId);
    if (existing.some(uc => uc.challenge_id === challenge_id)) {
      return res.status(400).json({ error: "Challenge already joined" });
    }

    // Insert new user_challenge
    const user_challenge = await UserChallengeModel.createUserChallenge(userId, challenge_id);

    res.status(201).json({ message: "Challenge joined", user_challenge });
  } catch (err) {
    console.error("❌ Joining challenge failed:", err);
    res.status(500).json({ error: "Failed to join challenge" });
  }
};

// DELETE /api/user-challenges/:userChallengeId → leave challenge
    export const leaveChallenge = async (req, res) => {
    try {
        const { user_challenge_id } = req.body;
        await UserChallengeModel.deleteUserChallenge(user_challenge_id);
        res.json({ message: "Challenge left successfully" });
    } catch (err) {
        console.error("❌ Leaving challenge failed:", err);
        res.status(500).json({ error: "Failed to leave challenge" });
    }
    };

// GET /api/challenges/user/:userId → fetch all challenges user joined
export const getUserChallengesProgress = async (req, res) => {
  try {
    const userId = req.user.userId; // or req.user.userId if authenticated

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

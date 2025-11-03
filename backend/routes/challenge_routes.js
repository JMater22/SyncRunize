import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as ChallengeController from "../controllers/challenge_controller.js";

const router = express.Router();

// Existing routes
router.get("/", authenticate, ChallengeController.getAllChallenges);
router.post("/:userId/join", ChallengeController.joinChallenge);
router.delete("/:userId/leave/:challengeId", ChallengeController.leaveChallenge);

// ✅ NEW: get joined challenges for a user
router.get("/user/", authenticate, ChallengeController.getUserChallengesProgress);


// ✅ New: Retrieve all challenges with join/in-progress status
router.get("/:userId/all", ChallengeController.getAllChallengesWithStatus);
export default router;

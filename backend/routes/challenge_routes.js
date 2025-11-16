import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as ChallengeController from "../controllers/challenge_controller.js";
import {
  cacheAllChallenges,
  cacheUserChallengesWithStatus,
  cacheUserChallengesProgress,
} from "../middleware/cache_middleware.js";

const router = express.Router();

// Existing routes
router.get("/", authenticate, cacheAllChallenges, ChallengeController.getAllChallenges);
router.post("/:userId/join", authenticate, ChallengeController.joinChallenge);
router.delete("/:userId/leave/:challengeId", authenticate, ChallengeController.leaveChallenge);

// ✅ NEW: get joined challenges for a user
router.get("/user/", authenticate, cacheUserChallengesProgress, ChallengeController.getUserChallengesProgress);


// ✅ New: Retrieve all challenges with join/in-progress status
router.get("/:userId/all", authenticate, cacheUserChallengesWithStatus, ChallengeController.getAllChallengesWithStatus);
export default router;

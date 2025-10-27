import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import * as ChallengeController from "../controllers/challenge_controller.js";

const router = express.Router();

// Existing routes
router.get("/", authenticate, ChallengeController.getAllChallenges);
router.post("/join", authenticate, ChallengeController.joinChallenge);
router.delete("/:userChallengeId", authenticate, ChallengeController.leaveChallenge);

// ✅ NEW: get joined challenges for a user
router.get("/user/", authenticate, ChallengeController.getUserChallengesProgress);

export default router;

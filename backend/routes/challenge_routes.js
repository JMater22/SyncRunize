import express from "express";
import {
  getChallenges,
  updateChallenge,
  deleteChallenge,
} from "../controllers/challenge_controller.js";

const router = express.Router();

// Retrieve all active challenges
router.get("/", getChallenges);

// Update challenge (distance, pace, etc.)
router.put("/:id", updateChallenge);

// Delete challenge
router.delete("/:id", deleteChallenge);

export default router;

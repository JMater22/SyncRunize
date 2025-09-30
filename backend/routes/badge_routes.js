import express from "express";
import {
  getUserBadges,
  deleteBadge,
} from "../controllers/badge_controller.js";

const router = express.Router();

// Retrieve badges earned by user
router.get("/user/:userId", getUserBadges);

// Delete badge (admin only, rare)
router.delete("/:id", deleteBadge);

export default router;

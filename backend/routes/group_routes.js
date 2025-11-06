import express from "express";
import * as GroupController from "../controllers/group_controller.js";
import { authenticate, optionalAuth } from "../utils/auth_middleware.js";

const router = express.Router();

// Public, but with optional auth to enforce private visibility rules
router.get("/", optionalAuth, GroupController.getAllGroups);
router.get("/:groupId", optionalAuth, GroupController.getGroupById);

// Protected
router.post("/create/:userId", GroupController.createGroup);
router.put("/:groupId", authenticate, GroupController.updateGroup);
router.delete("/:groupId", authenticate, GroupController.deleteGroup);


// ✅ GET weekly leaderboard
// GET /api/groups/:groupId/leaderboard/weekly?week=current|last
router.get("/:groupId/leaderboard/weekly", GroupController.getWeeklyLeaderboard);

// ✅ GET last week's leaders (top 3 for distance and time)
// GET /api/groups/:groupId/leaderboard/last-week/leaders
router.get("/:groupId/leaderboard/last-week/leaders", GroupController.getLastWeekLeaders);


export default router;

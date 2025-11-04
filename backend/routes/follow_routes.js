import express from "express";
import * as FollowController from "../controllers/follow_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();


// Public: get counts
router.get("/:userId/followers/count", FollowController.getFollowerCount);
router.get("/:userId/following/count", FollowController.getFollowingCount);
router.get("/:userId/counts", FollowController.getFollowCounts); // Get both at once


// Public: view followers/following
router.get("/:userId/followers", FollowController.getFollowers);
router.get("/:userId/following", FollowController.getFollowing);

// Protected: follow/unfollow
router.post("/:userId/follow", authenticate, FollowController.followUser);
router.delete("/:userId/unfollow", authenticate, FollowController.unfollowUser); // ⚠️ Changed from /follow to /unfollow

// ✅ NEW: Check follow status and toggle
router.get("/status/:userId", authenticate, FollowController.getFollowStatus);
router.post("/:userId/toggle", authenticate, FollowController.toggleFollow);

export default router;
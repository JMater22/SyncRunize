import express from "express";
import * as FollowController from "../controllers/follow_controller.js";
import { authenticate } from "../utils/auth_middleware.js";
import {
  cacheFollowCounts,
  cacheFollowers,
  cacheFollowing,
  cacheFollowStatus,
} from "../middleware/cache_middleware.js";

const router = express.Router();


// Public: get counts with caching
router.get("/:userId/followers/count", cacheFollowCounts, FollowController.getFollowerCount);
router.get("/:userId/following/count", cacheFollowCounts, FollowController.getFollowingCount);
router.get("/:userId/counts", cacheFollowCounts, FollowController.getFollowCounts); // Get both at once


// Public: view followers/following with caching
router.get("/:userId/followers", cacheFollowers, FollowController.getFollowers);
router.get("/:userId/following", cacheFollowing, FollowController.getFollowing);

// Protected: follow/unfollow
router.post("/:userId/follow", authenticate, FollowController.followUser);
router.delete("/:userId/unfollow", authenticate, FollowController.unfollowUser); // ⚠️ Changed from /follow to /unfollow

// ✅ NEW: Check follow status and toggle with caching
router.get("/status/:userId", authenticate, cacheFollowStatus, FollowController.getFollowStatus);
router.post("/:userId/toggle", authenticate, FollowController.toggleFollow);

export default router;
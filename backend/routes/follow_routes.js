import express from "express";
import * as FollowController from "../controllers/follow_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public: view followers/following
router.get("/:userId/followers", FollowController.getFollowers);
router.get("/:userId/following", FollowController.getFollowing);

// Protected: follow/unfollow
router.post("/:userId/follow", authenticate, FollowController.followUser);
router.delete("/:userId/follow", authenticate, FollowController.unfollowUser);

export default router;

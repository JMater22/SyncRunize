import express from "express";
import * as LikeController from "../controllers/like_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public: get like count
router.get("/:postId", LikeController.getLikesCount);

// Protected: like / unlike
router.post("/:postId", authenticate, LikeController.likePost);
router.delete("/:postId", authenticate, LikeController.unlikePost);

// ✅ NEW: Toggle like (like/unlike in one call)
router.post("/:postId/toggle", authenticate, LikeController.toggleLike);

export default router;

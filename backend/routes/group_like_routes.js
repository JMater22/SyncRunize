import express from "express";
import * as GroupLikeController from "../controllers/group_like_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ==================== GROUP LIKE ROUTES ====================

// ✅ GET like count
// GET /api/group-likes/:groupPostId/likes
router.get("/:groupPostId/likes", GroupLikeController.countLikes);

// ✅ POST like
// POST /api/group-likes/:groupPostId/likes
router.post("/:groupPostId/likes", authenticate, GroupLikeController.addLike);

// ✅ DELETE unlike
// DELETE /api/group-likes/:groupPostId/likes
router.delete("/:groupPostId/likes", authenticate, GroupLikeController.removeLike);

// ✅ POST toggle like (recommended - simpler for frontend)
// POST /api/group-likes/:groupPostId/toggle
router.post("/:groupPostId/toggle", authenticate, GroupLikeController.toggleLike);

export default router;
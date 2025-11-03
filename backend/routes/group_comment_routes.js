import express from "express";
import * as GroupCommentController from "../controllers/group_comment_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ==================== GROUP COMMENT ROUTES ====================

// ✅ GET comments for a post
// GET /api/group-comments/:groupPostId/comments
router.get("/:groupPostId/comments", GroupCommentController.getComments);

// ✅ GET comment count for a post
// GET /api/group-comments/:groupPostId/count
router.get("/:groupPostId/count", GroupCommentController.getCommentCount);

// ✅ CREATE comment
// POST /api/group-comments/:groupPostId/comments
router.post("/:groupPostId/comments", authenticate, GroupCommentController.createComment);

// ✅ UPDATE comment
// PUT /api/group-comments/:groupPostId/comments/:commentId
router.put("/:groupPostId/comments/:commentId", authenticate, GroupCommentController.updateComment);

// ✅ DELETE comment
// DELETE /api/group-comments/:groupPostId/comments/:commentId
router.delete("/:groupPostId/comments/:commentId", authenticate, GroupCommentController.deleteComment);

export default router;
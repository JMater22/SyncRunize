import express from "express";
import * as GroupCommentController from "../controllers/group_comment_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Comments
router.get("/:groupPostId/comments", GroupCommentController.getComments);
router.post("/:groupPostId/comments", authenticate, GroupCommentController.createComment);
router.put("/:groupPostId/comments/:commentId", authenticate, GroupCommentController.updateComment);
router.delete("/:groupPostId/comments/:commentId", authenticate, GroupCommentController.deleteComment);

export default router;

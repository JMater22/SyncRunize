import express from "express";
import * as CommentController from "../controllers/comment_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public: Get comments for a post
router.get("/:postId", CommentController.getComments);

// Protected: CRUD
router.post("/:postId", authenticate, CommentController.createComment);
router.put("/:id", authenticate, CommentController.updateComment);
router.delete("/:id", authenticate, CommentController.deleteComment);

export default router;

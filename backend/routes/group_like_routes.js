import express from "express";
import * as GroupLikeController from "../controllers/group_like_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Likes
router.get("/:groupPostId/likes", GroupLikeController.countLikes);
router.post("/:groupPostId/likes", authenticate, GroupLikeController.addLike);
router.delete("/:groupPostId/likes", authenticate, GroupLikeController.removeLike);

export default router;

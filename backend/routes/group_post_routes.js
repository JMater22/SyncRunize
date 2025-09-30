import express from "express";
import * as GroupPostController from "../controllers/group_post_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Group posts
router.get("/:groupId/posts", GroupPostController.getGroupPosts);
router.post("/:groupId/posts", authenticate, GroupPostController.createGroupPost);
router.put("/:groupId/posts/:postId", authenticate, GroupPostController.updateGroupPost);
router.delete("/:groupId/posts/:postId", authenticate, GroupPostController.deleteGroupPost);

export default router;

import express from "express";
import * as GroupPostController from "../controllers/group_post_controller.js";
import { authenticate } from "../utils/auth_middleware.js";
import { cacheGroupPosts } from "../middleware/cache_middleware.js";

const router = express.Router();

// ==================== GROUP POST ROUTES ====================

// ✅ OPTIMIZED: GET all posts in a group with caching
// GET /api/group-posts/:groupId?limit=20&offset=0&userId=5
router.get("/:groupId", cacheGroupPosts, GroupPostController.getGroupPosts);

// ✅ CREATE post in group
// POST /api/group-posts/:groupId
router.post("/:groupId", authenticate, GroupPostController.createGroupPost);

// ✅ UPDATE post
// PUT /api/group-posts/:groupId/posts/:postId
router.put("/:groupId/posts/:postId", authenticate, GroupPostController.updateGroupPost);

// ✅ DELETE post
// DELETE /api/group-posts/:groupId/posts/:postId
router.delete("/:groupId/posts/:postId", authenticate, GroupPostController.deleteGroupPost);

export default router;
import express from "express";
import * as PostController from "../controllers/post_controller.js";
import { authenticate, optionalAuth } from "../utils/auth_middleware.js";

const router = express.Router();

// Public: Get posts (legacy)
router.get("/", PostController.getPosts);

// ✅ NEW: Protected routes for personalized feed
router.get("/feed", authenticate, PostController.getFeed);
router.get("/my", authenticate, PostController.getMyPosts);
router.get("/user/:userId", optionalAuth, PostController.getUserPosts); // Optional auth for privacy filtering

// ✅ NEW: Create post from route
router.post("/from-route", authenticate, PostController.createPostFromRoute);

// Protected: CRUD (original)
// Get a single post by id (public)
router.get("/:id", PostController.getPostById);
router.post("/", authenticate, PostController.createPost);
router.put("/:id", authenticate, PostController.updatePost);
router.delete("/:id", authenticate, PostController.deletePost);

export default router;

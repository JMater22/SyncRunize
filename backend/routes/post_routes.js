import express from "express";
import * as PostController from "../controllers/post_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public: Get posts
router.get("/", PostController.getPosts);

// Protected: CRUD
router.post("/", authenticate, PostController.createPost);
router.put("/:id", authenticate, PostController.updatePost);
router.delete("/:id", authenticate, PostController.deletePost);

export default router;

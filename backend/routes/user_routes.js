// routes/user_routes.js
import express from "express";
import * as UserController from "../controllers/user_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ✅ Public route — anyone can view another user's public profile
router.get("/public/:id", UserController.getPublicProfile);

// ✅ Protected routes — require Supabase session token
router.post("/register", authenticate, UserController.createUserProfile);
router.get("/me", authenticate, UserController.getMyProfile);
router.put("/update-me", authenticate, UserController.updateProfile);
router.delete("/delete-me", authenticate, UserController.deleteProfile);

// ✅ Settings endpoints (organized by category)
router.put("/settings/account", authenticate, UserController.updateAccountSettings);
router.put("/settings/privacy", authenticate, UserController.updatePrivacySettings);
router.put("/settings/password", authenticate, UserController.updatePassword);

// Search users
router.get("/search", authenticate, UserController.searchUsers);

// Get user by ID (protected - for viewing other user profiles)
router.get("/:id", authenticate, UserController.getPublicProfile);

export default router;

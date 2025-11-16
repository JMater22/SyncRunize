// routes/user_routes.js
import express from "express";
import * as UserController from "../controllers/user_controller.js";
import { authenticate } from "../utils/auth_middleware.js";
import { cacheUserProfile, cachePublicProfile } from "../middleware/cache_middleware.js";

const router = express.Router();

// ✅ OPTIMIZED: Public route with caching
router.get("/public/:id", cachePublicProfile, UserController.getPublicProfile);

// ✅ Protected routes — require Supabase session token
router.post("/register", authenticate, UserController.createUserProfile);
router.get("/me", authenticate, cacheUserProfile, UserController.getMyProfile);
router.put("/update-me", authenticate, UserController.updateProfile);
router.delete("/delete-me", authenticate, UserController.deleteProfile);

// ✅ Settings endpoints (organized by category)
router.put("/settings/account", authenticate, UserController.updateAccountSettings);
router.put("/settings/privacy", authenticate, UserController.updatePrivacySettings);
router.put("/settings/password", authenticate, UserController.updatePassword);

// Search users
router.get("/search", authenticate, UserController.searchUsers);

// ✅ OPTIMIZED: Get user by ID with caching
router.get("/:id", authenticate, cachePublicProfile, UserController.getPublicProfile);

export default router;

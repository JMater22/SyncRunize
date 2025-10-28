import express from "express";
import * as UserController from "../controllers/user_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// Protected
router.get("/:id", authenticate, UserController.getProfile);
router.put("/:id", authenticate, UserController.updateProfile);
router.delete("/:id", authenticate, UserController.deleteUser);

export default router;

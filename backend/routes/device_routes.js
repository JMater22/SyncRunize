import express from "express";
import { authenticate } from "../utils/auth_middleware.js";
import { registerDeviceToken, unregisterDeviceToken } from "../controllers/device_controller.js";

const router = express.Router();

router.post("/register", authenticate, registerDeviceToken);
router.post("/unregister", authenticate, unregisterDeviceToken);

export default router;


import express from "express";
import * as GroupController from "../controllers/group_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Public
router.get("/", GroupController.getAllGroups);
router.get("/:groupId", GroupController.getGroupById);

// Protected
router.post("/create/:userId", GroupController.createGroup);
router.put("/:groupId", authenticate, GroupController.updateGroup);
router.delete("/:groupId", authenticate, GroupController.deleteGroup);

export default router;

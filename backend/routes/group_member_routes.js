import express from "express";
import * as GroupMemberController from "../controllers/group_member_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// Members
router.get("/:groupId/members", GroupMemberController.getGroupMembers);
router.post("/:groupId/members", authenticate, GroupMemberController.addMember);
router.put("/:groupId/members/:userId", authenticate, GroupMemberController.updateRole);
router.delete("/:groupId/members/:userId", authenticate, GroupMemberController.removeMember);

export default router;

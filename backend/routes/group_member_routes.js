import express from "express";
import * as GroupMemberController from "../controllers/group_member_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

// ✅ Check if user is a member of a group
// GET /api/group-members/:groupId/check/:userId
router.get("/:groupId/check/:userId", authenticate, GroupMemberController.checkMembership);

router.get("/:userId/joined-groups", GroupMemberController.getJoinedGroupsByUser);
// Members
router.get("/:groupId/members", GroupMemberController.getGroupMembers);
router.post("/:groupId/addMembers", authenticate,GroupMemberController.addMember);
router.put("/:groupId/members/:userId", authenticate, GroupMemberController.updateRole);
router.delete("/:groupId/members/:userId", authenticate, GroupMemberController.removeMember);



 // Invite user to group
router.post("/:groupId/invite", authenticate, GroupMemberController.inviteUserToGroup);
export default router;

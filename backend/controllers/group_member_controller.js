import * as GroupMemberModel from "../models/group_member_model.js";

// Get all members of a specific group
export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await GroupMemberModel.getGroupMembers(groupId);
    res.json(members);
  } catch (err) {
    console.error("❌ Error fetching members:", err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

// Add member (either self join or admin add)
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId: bodyUserId, role } = req.body || {};
    const loggedInUserId = req.user?.userId;

    const targetUserId = bodyUserId || loggedInUserId;
    if (!targetUserId) {
      return res.status(400).json({ error: "No user ID specified or authenticated" });
    }

    const finalRole = role || "member";

    const member = await GroupMemberModel.addMember(groupId, targetUserId, finalRole);
    res.status(201).json({
      message: bodyUserId
        ? "✅ Member added by admin"
        : "✅ User joined the group successfully",
      data: member,
    });
  } catch (err) {
    console.error("❌ Add member error:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// Update member role
export const updateRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;

    const member = await GroupMemberModel.updateRole(groupId, userId, role);
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Remove member (leave or kick)
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const result = await GroupMemberModel.removeMember(groupId, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
};

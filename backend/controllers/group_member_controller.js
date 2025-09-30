import * as GroupMemberModel from "../models/group_member_model.js";

// GET members
export const getGroupMembers = async (req, res) => {
  try {
    const members = await GroupMemberModel.getGroupMembers(req.params.groupId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

// POST add member
export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const member = await GroupMemberModel.addMember(req.params.groupId, userId, role);
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to add member" });
  }
};

// PUT update role
export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const member = await GroupMemberModel.updateRole(req.params.groupId, req.params.userId, role);
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
};

// DELETE member
export const removeMember = async (req, res) => {
  try {
    const result = await GroupMemberModel.removeMember(req.params.groupId, req.params.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
};

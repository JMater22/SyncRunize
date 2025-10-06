import * as GroupModel from "../models/group_model.js";

// GET all groups
export const getAllGroups = async (req, res) => {
  try {
    const groups = await GroupModel.getAllGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

// GET group by id
export const getGroupById = async (req, res) => {
  try {
    const group = await GroupModel.getGroupById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group" });
  }
};

// POST create group
export const createGroup = async (req, res) => {
  try {
    const { name, description, group_picture } = req.body;
    const userId = req.user?.userId; // Extracted from JWT (ensure authenticate middleware)

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: user not authenticated" });
    }

    const defaultPicture = "https://i.pinimg.com/736x/43/a5/4b/43a54b5ac213b39d702b16a503738437.jpg"; // replace with your hosted image

    // 1️⃣ Create the group
    const group = await GroupModel.createGroup({
      name,
      description,
      group_picture: group_picture || defaultPicture,
      created_by: userId,
    });

    // 2️⃣ Add the creator as admin in group_members
    await GroupMemberModel.addMember(group.group_id, userId, "admin");

    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (err) {
    console.error("❌ Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
};

// PUT update group
export const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await GroupModel.updateGroup(req.params.groupId, name, description);
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to update group" });
  }
};

// DELETE group
export const deleteGroup = async (req, res) => {
  try {
    const result = await GroupModel.deleteGroup(req.params.groupId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group" });
  }
};

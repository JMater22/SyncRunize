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
    const { name, description } = req.body;
    const createdBy = req.user.userId; // from JWT
    const group = await GroupModel.createGroup(name, description, createdBy);
    res.status(201).json(group);
  } catch (err) {
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

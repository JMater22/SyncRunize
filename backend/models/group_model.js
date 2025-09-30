import pool from "../utils/db.js";

// Get all groups
export const getAllGroups = async () => {
  const result = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
  return result.rows;
};

// Get a group by ID
export const getGroupById = async (groupId) => {
  const result = await pool.query("SELECT * FROM groups WHERE group_id = $1", [groupId]);
  return result.rows[0];
};

// Create group
export const createGroup = async (name, description, createdBy) => {
  const result = await pool.query(
    `INSERT INTO groups (name, description, created_by)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, description, createdBy]
  );
  return result.rows[0];
};

// Update group
export const updateGroup = async (groupId, name, description) => {
  const result = await pool.query(
    `UPDATE groups SET name=$1, description=$2 WHERE group_id=$3 RETURNING *`,
    [name, description, groupId]
  );
  return result.rows[0];
};

// Delete group
export const deleteGroup = async (groupId) => {
  await pool.query("DELETE FROM groups WHERE group_id = $1", [groupId]);
  return { message: "Group deleted" };
};

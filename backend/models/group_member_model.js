import pool from "../utils/db.js";

// List members
export const getGroupMembers = async (groupId) => {
  const result = await pool.query(
    `SELECT gm.user_id, gm.role, u.username, u.profile_picture
     FROM group_members gm
     JOIN users u ON gm.user_id = u.user_id
     WHERE gm.group_id = $1`,
    [groupId]
  );
  return result.rows;
};

// Add member
export const addMember = async (groupId, userId, role = "member") => {
  const result = await pool.query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, $3) ON CONFLICT (group_id, user_id) DO NOTHING RETURNING *`,
    [groupId, userId, role]
  );
  return result.rows[0];
};

// Update role
export const updateRole = async (groupId, userId, role) => {
  const result = await pool.query(
    `UPDATE group_members SET role=$1 WHERE group_id=$2 AND user_id=$3 RETURNING *`,
    [role, groupId, userId]
  );
  return result.rows[0];
};

// Remove member
export const removeMember = async (groupId, userId) => {
  await pool.query(`DELETE FROM group_members WHERE group_id=$1 AND user_id=$2`, [
    groupId,
    userId,
  ]);
  return { message: "Member removed" };
};

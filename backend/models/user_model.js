// models/user_model.js
import pool from "../utils/db.js";

// Create user profile (after signup)
export const createUserProfile = async (
  auth_id,
  name,
  email,
  gender = null,
  age = null,
  weight_kg = null
) => {
  const query = `
    INSERT INTO users (auth_id, name, email, gender, age, weight_kg)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, auth_id, name, email, gender, age, weight_kg, created_at;
  `;
  const result = await pool.query(query, [auth_id, name, email, gender, age, weight_kg]);
  return result.rows[0];
};

// Get profile by Supabase auth_id (protected)
export const getUserByAuthId = async (auth_id) => {
  const query = `
    SELECT id, auth_id, name, email, gender, age, weight_kg, created_at
    FROM users
    WHERE auth_id = $1;
  `;
  const result = await pool.query(query, [auth_id]);
  return result.rows[0];
};

// Get public user profile by ID (DO NOT include weight_kg)
export const getPublicUserById = async (id) => {
  const query = `
    SELECT id, name, gender, age, created_at
    FROM users
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update own profile (by auth_id)
export const updateUserProfile = async (auth_id, updates) => {
  const { name = null, gender = null, age = null, weight_kg = null } = updates;

  const query = `
    UPDATE users
    SET
      name = COALESCE($1, name),
      gender = COALESCE($2, gender),
      age = COALESCE($3, age),
      weight_kg = COALESCE($4, weight_kg),
      -- update timestamp (optional column)
      created_at = created_at
    WHERE auth_id = $5
    RETURNING id, auth_id, name, email, gender, age, weight_kg, created_at;
  `;

  const result = await pool.query(query, [name, gender, age, weight_kg, auth_id]);
  return result.rows[0];
};

// Delete own profile (by auth_id)
export const deleteUserProfile = async (auth_id) => {
  const query = `
    DELETE FROM users
    WHERE auth_id = $1
    RETURNING id, auth_id;
  `;
  const result = await pool.query(query, [auth_id]);
  return result.rows[0];
};

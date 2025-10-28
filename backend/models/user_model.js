import pool from "../utils/db.js";

export const createUser = async (email, hashedPassword, username) => {
  const result = await pool.query(
    `INSERT INTO users (email, hashed_password, username) 
     VALUES ($1, $2, $3) RETURNING user_id, email, username, profile_picture`,
    [email, hashedPassword, username]
  );
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT user_id, email, username, profile_picture FROM users WHERE user_id = $1`,
    [id]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

export const updateUser = async (id, { username, profile_picture, hashedPassword }) => {
  const result = await pool.query(
    `UPDATE users 
     SET username = COALESCE($1, username),
         profile_picture = COALESCE($2, profile_picture),
         hashed_password = COALESCE($3, hashed_password)
     WHERE user_id = $4
     RETURNING user_id, email, username, profile_picture`,
    [username, profile_picture, hashedPassword, id]
  );
  return result.rows[0];
};

export const deleteUser = async (id) => {
  const result = await pool.query(
    `DELETE FROM users WHERE user_id = $1 RETURNING user_id`,
    [id]
  );
  return result.rows[0];
};

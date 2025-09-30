import pool from "../utils/db.js";

// Retrieve all challenges
export const findChallenges = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM challenges ORDER BY start_date DESC`
  );
  return rows;
};

// Update challenge details
export const modifyChallenge = async (id, updates) => {
  const { title, description, target_distance, target_pace, end_date } = updates;

  const { rows } = await pool.query(
    `UPDATE challenges
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         target_distance = COALESCE($3, target_distance),
         target_pace = COALESCE($4, target_pace),
         end_date = COALESCE($5, end_date)
     WHERE challenge_id = $6
     RETURNING *`,
    [title, description, target_distance, target_pace, end_date, id]
  );

  return rows[0];
};

// Delete challenge
export const removeChallenge = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM challenges WHERE challenge_id = $1`,
    [id]
  );
  return rowCount > 0;
};

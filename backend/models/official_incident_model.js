import pool from "../utils/db.js";

export const findIncidents = async (startDate, endDate, lat, lng, radius) => {
  let query = `SELECT * FROM official_incidents WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (startDate && endDate) {
    query += ` AND date BETWEEN $${idx++} AND $${idx++}`;
    params.push(startDate, endDate);
  }
  if (lat && lng && radius) {
    query += ` AND (6371 * acos(
      cos(radians($${idx})) * cos(radians(lat)) *
      cos(radians(lng) - radians($${idx + 1})) +
      sin(radians($${idx})) * sin(radians(lat))
    )) < $${idx + 2}`;
    params.push(lat, lng, radius);
    idx += 3;
  }

  const { rows } = await pool.query(query, params);
  return rows;
};

export const modifyIncident = async (id, updates) => {
  const { severity_weight } = updates;
  const { rows } = await pool.query(
    `UPDATE official_incidents
     SET severity_weight = COALESCE($1, severity_weight),
         date = CURRENT_TIMESTAMP
     WHERE incident_id = $2
     RETURNING *`,
    [severity_weight, id]
  );
  return rows[0];
};

export const removeIncident = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM official_incidents WHERE incident_id = $1`,
    [id]
  );
  return rowCount > 0;
};

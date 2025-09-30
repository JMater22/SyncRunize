import pool from "../utils/db.js";

// Retrieve hazards near a location within a radius (meters ~ rough haversine)
export const findHazardsNearLocation = async (lat, lng, radius) => {
  const query = `
    SELECT *, 
      ( 6371 * acos(
        cos(radians($1)) * cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      ) ) AS distance_km
    FROM hazard_reports
    WHERE status = 'active'
    HAVING (6371 * acos(
        cos(radians($1)) * cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      )) < $3
    ORDER BY distance_km ASC;
  `;
  const { rows } = await pool.query(query, [lat, lng, radius]);
  return rows;
};

// Update hazard report fields
export const modifyHazard = async (id, updates) => {
  const { trust_score, agreement_score, status } = updates;
  const { rows } = await pool.query(
    `UPDATE hazard_reports
     SET trust_score = COALESCE($1, trust_score),
         agreement_score = COALESCE($2, agreement_score),
         status = COALESCE($3, status),
         reported_at = CURRENT_TIMESTAMP
     WHERE report_id = $4
     RETURNING *`,
    [trust_score, agreement_score, status, id]
  );
  return rows[0];
};

// Delete hazard
export const removeHazard = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM hazard_reports WHERE report_id = $1`,
    [id]
  );
  return rowCount > 0;
};

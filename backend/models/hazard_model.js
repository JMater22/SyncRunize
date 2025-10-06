// models/hazard_model.js
import pool from "../utils/db.js";

// 🧩 Create a new hazard report
export const create = async (data) => {
  const {
    user_id,
    incident_type,   // ← matches your DB column name
    description,
    lat,
    lng,
    trust_score = 0,
    agreement_score = 0,
    severity_weight = 0,
    status = "active",
  } = data;

  const result = await pool.query(
    `INSERT INTO hazard_reports 
      (user_id, incident_type, description, lat, lng, trust_score, agreement_score, severity_weight, status, reported_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [user_id, incident_type, description, lat, lng, trust_score, agreement_score, severity_weight, status]
  );

  return result.rows[0];
};

// 🧭 Retrieve hazards near a location (within radius in km)
export const findHazardsNearLocation = async (lat, lng, radiusKm) => {
  const query = `
    SELECT *,
      (6371 * acos(
        cos(radians($1)) * cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      )) AS distance_km
    FROM hazard_reports
    WHERE status = 'active'
    AND (
      6371 * acos(
        cos(radians($1)) * cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      )
    ) < $3
    ORDER BY distance_km ASC;
  `;

  const { rows } = await pool.query(query, [lat, lng, radiusKm]);
  return rows;
};

// ⚙️ Update hazard scores or status
export const modifyHazard = async (id, updates) => {
  const { trust_score, agreement_score, status } = updates;
  const { rows } = await pool.query(
    `UPDATE hazard_reports
     SET trust_score = COALESCE($1, trust_score),
         agreement_score = COALESCE($2, agreement_score),
         status = COALESCE($3, status),
         reported_at = NOW()
     WHERE report_id = $4
     RETURNING *`,
    [trust_score, agreement_score, status, id]
  );
  return rows[0];
};

// ❌ Delete a hazard report
export const removeHazard = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM hazard_reports WHERE report_id = $1`,
    [id]
  );
  return rowCount > 0;
};

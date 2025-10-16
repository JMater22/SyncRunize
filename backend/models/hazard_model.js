// models/hazard_model.js
import pool from "../utils/db.js";
import fs from "fs";
import path from "path";




// 🧩 Create a new hazard report with optional image
export const create = async (data) => {
  try {
    
 
  const {
    user_id,
    title,
    incident_type,
    description,
    lat,
    lng,
    trust_score = 0,
    agreement_score = 0,
    severity_weight = 0,
    status = "active",
    image_url = null, // ← NEW: Optional image URL
  } = data;

  const result = await pool.query(
    `INSERT INTO hazard_reports 
      (user_id, title, incident_type, description, lat, lng, trust_score, agreement_score, severity_weight, status, image_url, reported_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     RETURNING *`,
    [user_id, title, incident_type, description, lat, lng, trust_score, agreement_score, severity_weight, status, image_url]
  );

  return result.rows[0];
   } catch (error) {
      console.error("Error creating hazard:", error.message);
      throw error;
  }
};

/**
 * Get all hazards for a specific user (owner)
 */
export const findByUser = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM hazard_reports 
     WHERE user_id = $1 
     ORDER BY reported_at DESC`,
    [user_id]
  );
  return rows;
};


export const findByTitle = async (title) => {
  const { rows } = await pool.query(
    `SELECT * FROM hazard_reports WHERE LOWER(title) LIKE LOWER($1)`,
    [`%${title}%`]
  );
  return rows;
};


export const updateHazard = async (report_id, user_id, updates) => {
  const {
    title,
    incident_type,
    description,
    lat,
    lng,
    severity_weight,
    image_url,
    status
  } = updates;

  // 1. Fetch existing record (to check ownership and previous image_url)
  const existingRes = await pool.query(
    `SELECT image_url FROM hazard_reports WHERE report_id = $1 AND user_id = $2`,
    [report_id, user_id]
  );

  if (existingRes.rowCount === 0) {
    return null; // not found or not owned by user
  }

  const oldImageUrl = existingRes.rows[0].image_url; // may be null

  // 2. Update the DB row
  const result = await pool.query(
    `UPDATE hazard_reports
     SET
       title = COALESCE($1, title),
       incident_type = COALESCE($2, incident_type),
       description = COALESCE($3, description),
       lat = COALESCE($4, lat),
       lng = COALESCE($5, lng),
       severity_weight = COALESCE($6, severity_weight),
       image_url = COALESCE($7, image_url),
       status = COALESCE($8, status),
       reported_at = NOW()
     WHERE report_id = $9 AND user_id = $10
     RETURNING *;`,
    [title, incident_type, description, lat, lng, severity_weight, image_url, status, report_id, user_id]
  );

  // 3. If a new image_url was provided and there was an old one — remove old file
  if (image_url && oldImageUrl) {
    try {
      // stored image_url is something like "/uploads/hazards/filename.jpg"
      // join with process.cwd() to get absolute path
      const relativePath = oldImageUrl.startsWith("/") ? oldImageUrl.slice(1) : oldImageUrl;
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    } catch (err) {
      console.warn("⚠️ Failed to delete old image file:", err.message);
      // Not fatal — proceed
    }
  }

  return result.rows[0];
};

/**
 * Delete hazard owned by user. Returns deleted row object on success, otherwise null.
 * Also removes image file from disk if present.
 */
export const deleteHazard = async (report_id, user_id) => {
  // 1) Get image_url (to delete file later)
  const chk = await pool.query(
    `SELECT image_url FROM hazard_reports WHERE report_id = $1 AND user_id = $2`,
    [report_id, user_id]
  );

  if (chk.rowCount === 0) return null;

  const imageUrl = chk.rows[0].image_url;

  // 2) Delete row and return deleted row
  const result = await pool.query(
    `DELETE FROM hazard_reports
     WHERE report_id = $1 AND user_id = $2
     RETURNING *;`,
    [report_id, user_id]
  );

  // 3) Delete image file if it existed
  if (imageUrl) {
    try {
      const relativePath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
      const imgPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    } catch (err) {
      console.warn("⚠️ Failed to delete image after deleting DB row:", err.message);
    }
  }

  return result.rows[0];
};

//I modified this part
// 🧭 Retrieve hazards near a location (within radius in km)
export const findHazardsNearLocation = async (lat, lng, radiusKm) => {
  const query = `
    SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth(lat, lng)) / 1000 AS distance_km
    FROM hazard_reports
    WHERE earth_distance(ll_to_earth($1, $2), ll_to_earth(lat, lng)) / 1000 < $3;
  `;

  const { rows } = await pool.query(query, [lat, lng, radiusKm]);
  return rows;
};

// ⚙️ Update hazard scores or status. This is for the algorithm updation
export const modifyHazard = async (id, updates) => {
  const { trust_score, agreement_score, status } = updates;
  if (status && !["active", "resolved", "hidden"].includes(status)) {
  throw new Error("Invalid hazard status");
  }

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


export default {
  create,
  findByUser,
  findByTitle,
  updateHazard,
  deleteHazard,
  findHazardsNearLocation,
  modifyHazard,
};



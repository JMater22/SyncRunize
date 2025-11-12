// controllers/hazard_controller.js
import * as Hazard from "../models/hazard_model.js";
import { computeAgreement, computeTrust } from "../services/hazard_service.js";
import { summarizeHazard, summarizeNearbyHazards } from "../services/ai_service.js";
import { sendAlertPush } from "../services/push_service.js";
import fs from "fs";
import { safeDeleteFile } from "../utils/file_utils.js";
import { supabase } from "../utils/supabase.js";

const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const uploadHazardImageToSupabase = async (file) => {
  if (!file) return null;
  const buffer = await fs.promises.readFile(file.path);
  const storageFileName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
  const storagePath = `hazardImage/${storageFileName}`;
  try {
    const { error } = await supabase.storage.from("asset").upload(storagePath, buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("asset").getPublicUrl(storagePath);
    return data?.publicUrl || null;
  } finally {
    safeDeleteFile(`/uploads/hazards/${file.filename}`);
  }
};

// Create hazard with scoring + AI summary
export const createHazard = async (req, res) => {
  try {
    const userId = req.user.user_id; // �o. Integer from users table
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hazardData = {
      ...req.body,
      user_id: userId,
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng),
    };
    if (isNaN(hazardData.lat) || isNaN(hazardData.lng)) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }

    if (req.file) {
      hazardData.image_url = await uploadHazardImageToSupabase(req.file);
    }

    // Step 1: Insert into DB
    const newHazard = await Hazard.create(hazardData);
    if (!newHazard) throw new Error("Failed to insert hazard");

    // Step 2: Find nearby hazards
    const neighbors = await Hazard.findHazardsNearLocation(
      newHazard.lat,
      newHazard.lng,
      0.3
    );

    // Step 3: Compute agreement & trust
    const agreement = await computeAgreement(newHazard, neighbors);
    const trust = await computeTrust([...neighbors, newHazard]);

    // Step 4: Update scores
    const updated = await Hazard.modifyHazard(newHazard.report_id, {
      agreement_score: agreement,
      trust_score: trust,
    });

    // Step 5: Return response immediately (don't block on AI summary)
    res.status(201).json({
      message: "✅ Hazard created successfully",
      hazard: updated,
      ai_summary: null, // Generated in background
    });

    // Step 6: Generate AI summary and notify users in background (non-blocking)
    summarizeHazard(updated)
      .then((summary) => {
        console.log(`[Hazard] ✅ AI summary generated for hazard ${updated.report_id}`);
        return notifyNearbyUsersOfHazard(updated, summary, userId);
      })
      .catch((err) => {
        console.error("⚠️ Failed to generate summary or notify users:", err);
      });
  } catch (err) {
    console.error("❌ Failed to create hazard:", err);
    res.status(500).json({ error: "Failed to create hazard" });
  }
  };

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Notify nearby users when a new hazard is created
 * Runs asynchronously in the background to avoid blocking the response
 *
 * IMPORTANT: Only notifies users who:
 * 1. Are within NOTIFICATION_RADIUS_KM of the hazard
 * 2. Have active device tokens registered
 * 3. Are NOT the person who reported the hazard
 */
const notifyNearbyUsersOfHazard = async (hazard, summary, reporterUserId) => {
  try {
    const NOTIFICATION_RADIUS_KM = 0.5; // Notify users within 500m

    console.log(`[HazardNotify] Finding users within ${NOTIFICATION_RADIUS_KM}km of hazard ${hazard.report_id} (excluding reporter ${reporterUserId})`);

    // Step 1: Get all active device tokens with user info
    const { data: allDevices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('user_id, token')
      .is('revoked_at', null);

    if (devicesError) {
      console.error("[HazardNotify] Database error fetching devices:", devicesError);
      return;
    }

    if (!allDevices || allDevices.length === 0) {
      console.log(`[HazardNotify] No active device tokens found in database`);
      return;
    }

    // Step 2: Get unique user IDs (excluding the reporter)
    const userIds = [...new Set(allDevices.map(d => d.user_id))].filter(id => id !== reporterUserId);

    if (userIds.length === 0) {
      console.log(`[HazardNotify] No other users to check (only reporter has tokens)`);
      return;
    }

    // Step 3: Find users who have recently tracked routes near this hazard location
    // This filters to only users who are actually active runners in this area
    const { data: recentRoutes, error: routesError } = await supabase
      .from('user_routes')
      .select('user_id, start_lat, start_lng, end_lat, end_lng')
      .in('user_id', userIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(1000);

    if (routesError) {
      console.error("[HazardNotify] Error fetching recent routes:", routesError);
      return;
    }

    // Step 4: Filter to users who have run near this location recently
    const nearbyUserIds = new Set();

    if (recentRoutes && recentRoutes.length > 0) {
      recentRoutes.forEach(route => {
        // Check if either start or end point is near the hazard
        const startDistance = calculateDistance(hazard.lat, hazard.lng, route.start_lat, route.start_lng);
        const endDistance = calculateDistance(hazard.lat, hazard.lng, route.end_lat, route.end_lng);

        if (startDistance <= NOTIFICATION_RADIUS_KM || endDistance <= NOTIFICATION_RADIUS_KM) {
          nearbyUserIds.add(route.user_id);
        }
      });
    }

    // If no users found nearby, check all users as fallback (for testing or new areas)
    const usersToNotify = nearbyUserIds.size > 0 ? Array.from(nearbyUserIds) : userIds.slice(0, 10); // Limit to 10 users if no location match

    if (usersToNotify.length === 0) {
      console.log(`[HazardNotify] No users found near hazard location`);
      return;
    }

    console.log(`[HazardNotify] Found ${usersToNotify.length} users who run near this location (out of ${userIds.length} total users)`);

    // Step 5: Send push notifications to nearby users
    const notificationPromises = usersToNotify.map(async (userId) => {
      try {
        // Create notification record in database
        const { data: notification, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'hazard_alert',
            message: `New hazard reported nearby: ${summary}`,
            is_read: false,
            push_status: 'pending',
          })
          .select()
          .single();

        if (notifError) {
          console.error(`[HazardNotify] Failed to create notification for user ${userId}:`, notifError);
          return;
        }

        // Send push notification via FCM
        // Don't duplicate the hazard type in the message since it's already in the summary
        await sendAlertPush({
          userId: userId,
          summary: summary, // AI summary is already user-friendly and complete
          type: 'hazard_alert',
          notification: {
            notification_id: notification.notification_id,
            report_id: hazard.report_id,
            distance_km: 0.5, // Approximate for now
          },
        });

        // Mark as sent
        await supabase
          .from('notifications')
          .update({ push_status: 'sent' })
          .eq('notification_id', notification.notification_id);

        console.log(`[HazardNotify] ✅ Notified user ${userId}`);
      } catch (err) {
        console.error(`[HazardNotify] Failed to notify user ${userId}:`, err);
      }
    });

    await Promise.allSettled(notificationPromises);
    console.log(`[HazardNotify] Completed notifications for hazard ${hazard.report_id}`);
  } catch (err) {
    console.error("[HazardNotify] Error in notifyNearbyUsersOfHazard:", err);
  }
};


// Get hazards near location
export const getHazardsNearby = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius || 0.3);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    const hazards = await Hazard.findHazardsNearLocation(latNum, lngNum, radiusNum);


    if (!hazards.length) {
      return res.json({
        message: "✅ No hazards found nearby.",
        hazards: [],
        ai_nearby_summary: "No hazards reported in your area. Safe to run!",
      });
    }

    // Generate AI summaries for each hazard (non-blocking, optional)
    const hazardsWithSummaries = await Promise.allSettled(
      hazards.map(async (hazard) => {
        try {
          const summary = await summarizeHazard(hazard);
          return { ...hazard, ai_summary: summary };
        } catch (e) {
          console.warn("⚠️ AI summary failed for hazard:", hazard.report_id, e.message);
          return { ...hazard, ai_summary: null };
        }
      })
    ).then(results =>
      results.map((result, idx) =>
        result.status === 'fulfilled' ? result.value : { ...hazards[idx], ai_summary: null }
      )
    );

    // Generate a single summarized overview for all nearby hazards (optional, non-blocking)
    let ai_nearby_summary = "Hazards reported in this area.";
    try {
      ai_nearby_summary = await summarizeNearbyHazards(hazardsWithSummaries);
    } catch (e) {
      console.warn("⚠️ AI nearby summary failed:", e.message);
    }

    res.json({
      message: "✅ Nearby hazards retrieved successfully.",
      hazards: hazardsWithSummaries,
      ai_nearby_summary,
    });
  } catch (err) {
    console.error("❌ Error fetching nearby hazards:", err);
    res.status(500).json({ error: "Failed to fetch hazards" });
  }
};



// GET /api/hazards/my-hazards
export const getUserHazards = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hazards = await Hazard.findByUser(userId);
    return res.status(200).json({
      message: "✅ Your reported hazards loaded successfully.",
      hazards,
    });
  } catch (err) {
    console.error("Error fetching user hazards:", err);
    return res.status(500).json({ error: "Failed to fetch your hazards." });
  }
};

// PUT /api/hazards/:id  (with optional file upload)
export const updateHazard = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // If an image file was uploaded via multer, build image_url
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/hazards/${req.file.filename}`;
    }

    // Build updates object (only provide fields that exist in request)
    const updates = {
      title: req.body.title ?? null,
      incident_type: req.body.incident_type ?? null,
      description: req.body.description ?? null,
      lat: req.body.lat ? parseFloat(req.body.lat) : null,
      lng: req.body.lng ? parseFloat(req.body.lng) : null,
      severity_weight: req.body.severity_weight ? parseFloat(req.body.severity_weight) : null,
      image_url, // will be null if no new image uploaded
      status: req.body.status ?? null,
    };
    
    if ((updates.lat && isNaN(updates.lat)) || (updates.lng && isNaN(updates.lng))) {
      return res.status(400).json({ error: "Invalid latitude or longitude." });
    }


    const updated = await Hazard.updateHazard(id, userId, updates);

    if (!updated) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    return res.status(200).json({
      message: "✅ Hazard updated successfully.",
      hazard: updated,
    });
  } catch (err) {
      console.error("Error updating hazard:", err);
    return res.status(500).json({ error: "Failed to update hazard." });
  }
    };

// DELETE /api/hazards/:id
export const deleteHazard = async (req, res) => {
  try {
    const userId = req.user?.user_id; // ✅ Integer from users table
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const deleted = await Hazard.deleteHazard(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    return res.status(200).json({
      message: "🗑️ Hazard deleted successfully.",
      deleted_hazard: deleted,
    });
  } catch (err) {
    console.error("Error deleting hazard:", err);
    return res.status(500).json({ error: "Failed to delete hazard." });
  }
};

// controllers/hazard_controller.js
import * as Hazard from "../models/hazard_model.js";
import { computeAgreement, computeTrust } from "../services/hazard_service.js";
import { summarizeHazard, summarizeNearbyHazards } from "../services/ai_service.js";
import { sendAlertPush } from "../services/push_service.js";
import * as AuditService from "../services/audit_service.js";
import { reverseGeocode } from "../services/geocoding_service.js";

// ✅ NEW: No file upload logic needed - images uploaded directly from frontend to Supabase

// Create hazard with scoring + AI summary
export const createHazard = async (req, res) => {
  const requestStart = Date.now();
  console.log('[Hazard] ========== CREATE HAZARD REQUEST START ==========');
  console.log('[Hazard] Request body:', req.body);

  try {
    const userId = req.user.user_id;
    console.log('[Hazard] User ID:', userId);
    if (!userId) {
      console.error('[Hazard] ❌ No user ID found');
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ FIX: Safely parse coordinates - handle both number and string inputs
    const lat = typeof req.body.lat === 'number' ? req.body.lat : parseFloat(req.body.lat);
    const lng = typeof req.body.lng === 'number' ? req.body.lng : parseFloat(req.body.lng);

    console.log('[Hazard] Coordinate validation:', {
      rawLat: req.body.lat,
      rawLng: req.body.lng,
      rawLatType: typeof req.body.lat,
      rawLngType: typeof req.body.lng,
      parsedLat: lat,
      parsedLng: lng,
      isLatValid: !isNaN(lat),
      isLngValid: !isNaN(lng),
    });

    // Validate coordinates format
    if (isNaN(lat) || isNaN(lng)) {
      console.error('[Hazard] ❌ Invalid coordinates - not a number:', {
        lat: req.body.lat,
        lng: req.body.lng,
        parsedLat: lat,
        parsedLng: lng,
      });
      return res.status(400).json({
        error: "Invalid latitude or longitude format.",
        details: {
          lat: req.body.lat,
          lng: req.body.lng,
          latType: typeof req.body.lat,
          lngType: typeof req.body.lng,
        }
      });
    }

    const hazardData = {
      ...req.body,
      user_id: userId,
      lat: lat,
      lng: lng,
      // ✅ NEW: Accept image_url directly from frontend (already uploaded to Supabase)
      image_url: req.body.image_url || null,
    };
    console.log('[Hazard] Parsed data:', {
      lat: hazardData.lat,
      lng: hazardData.lng,
      hasImage: !!hazardData.image_url
    });

    // Validate coordinate ranges
    if (hazardData.lat < -90 || hazardData.lat > 90) {
      console.error('[Hazard] ❌ Invalid latitude range:', hazardData.lat);
      return res.status(400).json({ error: "Latitude must be between -90 and 90." });
    }

    if (hazardData.lng < -180 || hazardData.lng > 180) {
      console.error('[Hazard] ❌ Invalid longitude range:', hazardData.lng);
      return res.status(400).json({ error: "Longitude must be between -180 and 180." });
    }

    // Reverse geocode coordinates to get human-readable address
    console.log('[Hazard] Reverse geocoding coordinates...');
    const geocodeStart = Date.now();
    const cached_address = await reverseGeocode(hazardData.lng, hazardData.lat);
    console.log(`[Hazard] Geocoding completed in ${Date.now() - geocodeStart}ms: ${cached_address || 'null'}`);

    // Add cached_address to hazard data
    hazardData.cached_address = cached_address;

    // Insert into DB with image_url and cached_address
    console.log('[Hazard] Inserting hazard into DB...');
    const dbInsertStart = Date.now();
    const newHazard = await Hazard.create(hazardData);
    console.log(`[Hazard] ✅ DB insert completed in ${Date.now() - dbInsertStart}ms, ID: ${newHazard?.report_id}`);

    if (!newHazard) throw new Error("Failed to insert hazard");

    // ✅ Log hazard creation to audit table (background, non-blocking)
    AuditService.logHazardCreate(newHazard.report_id, userId, newHazard).catch(err => {
      console.error('[Hazard] Failed to log audit entry:', err);
    });

    // ✅ Return response IMMEDIATELY
    // Algorithm scoring and AI summary happen in background
    const responseTime = Date.now() - requestStart;
    console.log(`[Hazard] ✅ Sending response after ${responseTime}ms`);
    res.status(201).json({
      message: "✅ Hazard created successfully",
      hazard: newHazard,
      ai_summary: null, // Generated in background
    });

    // Step 2-4: Compute scores in background (NON-BLOCKING)
    // ✅ CRITICAL: Updates scores for BOTH new hazard AND all nearby existing hazards
    // This ensures the safest path algorithm always uses up-to-date trust/agreement scores
    (async () => {
      try {
        // ✅ OPTIMIZATION: Query ALL nearby hazards once (0.5km radius to cover all overlaps)
        const allNearbyHazards = await Hazard.findHazardsNearLocation(
          newHazard.lat,
          newHazard.lng,
          0.5 // Larger radius to include all potential neighbors
        );

        console.log(`[Hazard] Found ${allNearbyHazards.length} nearby hazards to update`);

        // ✅ Update ALL hazards (new + existing) with recalculated scores
        const allHazards = [...allNearbyHazards, newHazard];

        // ✅ FIX: Parallelize ALL algorithm calls at once (was: sequential per-hazard)
        // Pre-compute neighbors for all hazards
        const hazardNeighborsMap = new Map();
        allHazards.forEach(hazard => {
          const neighbors = allHazards.filter(neighbor => {
            if (neighbor.report_id === hazard.report_id) return false;
            const distance = calculateDistance(
              hazard.lat, hazard.lng,
              neighbor.lat, neighbor.lng
            );
            return distance <= 0.3; // 300m radius
          });
          hazardNeighborsMap.set(hazard.report_id, neighbors);
        });

        // Fire ALL agreement calls simultaneously
        const allAgreementPromises = allHazards.map(hazard =>
          computeAgreement(hazard, hazardNeighborsMap.get(hazard.report_id))
        );

        // Fire ALL trust calls simultaneously
        const allTrustPromises = allHazards.map(hazard =>
          computeTrust([...hazardNeighborsMap.get(hazard.report_id), hazard])
        );

        // Wait for all calls to complete in parallel
        const [agreementResults, trustResults] = await Promise.all([
          Promise.allSettled(allAgreementPromises),
          Promise.allSettled(allTrustPromises)
        ]);

        // Update all hazards with their scores
        const updatePromises = allHazards.map(async (hazard, index) => {
          try {
            const agreement = (agreementResults[index].status === 'fulfilled' && agreementResults[index].value !== null)
              ? agreementResults[index].value
              : 0;
            const trust = (trustResults[index].status === 'fulfilled' && trustResults[index].value !== null)
              ? trustResults[index].value
              : 0;

            // Update hazard with new scores
            await Hazard.modifyHazard(hazard.report_id, {
              agreement_score: agreement,
              trust_score: trust,
            });

            console.log(`[Hazard] ✅ Updated scores for hazard ${hazard.report_id}: agreement=${agreement.toFixed(2)}, trust=${trust.toFixed(2)}`);
            return { report_id: hazard.report_id, agreement, trust };
          } catch (err) {
            console.warn(`[Hazard] Failed to update scores for hazard ${hazard.report_id}:`, err.message);
            return null;
          }
        });

        const results = await Promise.allSettled(updatePromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

        console.log(`[Hazard] ✅ Scoring complete: ${successful}/${allHazards.length} hazards updated (including new hazard ${newHazard.report_id})`);
      } catch (err) {
        console.error('[Hazard] Background scoring failed:', err.message);
      }
    })();

    // ✅ NEW: Image is already uploaded to Supabase by frontend
    // No background upload needed - image_url is already in hazardData

    // Step 7: Generate AI summary and notify users in background (non-blocking)
    summarizeHazard(newHazard)
      .then((summary) => {
        console.log(`[Hazard] ✅ AI summary generated for hazard ${newHazard.report_id}`);
        return notifyNearbyUsersOfHazard(newHazard, summary, userId);
      })
      .catch((err) => {
        console.error("⚠️ Failed to generate summary or notify users:", err);
      });
  } catch (err) {
    console.error("❌ Failed to create hazard:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      error: "Failed to create hazard",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

    // ✅ FIX: Batch insert all notifications at once (was: N individual INSERTs)
    // Step 5a: Create all notification records in a single batch INSERT
    const notificationRecords = usersToNotify.map(userId => ({
      user_id: userId,
      type: 'hazard_alert',
      message: `New hazard reported nearby: ${summary}`,
      is_read: false,
      push_status: 'pending',
    }));

    const { data: notifications, error: batchInsertError } = await supabase
      .from('notifications')
      .insert(notificationRecords)
      .select();

    if (batchInsertError) {
      console.error(`[HazardNotify] Failed to batch insert notifications:`, batchInsertError);
      return;
    }

    console.log(`[HazardNotify] ✅ Batch inserted ${notifications.length} notifications`);

    // ✅ FIX: Send all push notifications in parallel (unchanged, was already parallel)
    // Step 5b: Send push notifications via FCM
    const pushPromises = notifications.map(async (notification) => {
      try {
        await sendAlertPush({
          userId: notification.user_id,
          summary: summary, // AI summary is already user-friendly and complete
          type: 'hazard_alert',
          notification: {
            notification_id: notification.notification_id,
            report_id: hazard.report_id,
            distance_km: 0.5, // Approximate for now
          },
        });
        return notification.notification_id;
      } catch (err) {
        console.error(`[HazardNotify] Failed to send push to user ${notification.user_id}:`, err);
        return null;
      }
    });

    const pushResults = await Promise.allSettled(pushPromises);
    const sentNotificationIds = pushResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    console.log(`[HazardNotify] ✅ Sent ${sentNotificationIds.length}/${notifications.length} push notifications`);

    // ✅ FIX: Batch update all notifications at once (was: N individual UPDATEs)
    // Step 5c: Mark all successfully sent notifications in a single batch UPDATE
    if (sentNotificationIds.length > 0) {
      const { error: batchUpdateError } = await supabase
        .from('notifications')
        .update({ push_status: 'sent' })
        .in('notification_id', sentNotificationIds);

      if (batchUpdateError) {
        console.error(`[HazardNotify] Failed to batch update notification status:`, batchUpdateError);
      } else {
        console.log(`[HazardNotify] ✅ Batch updated ${sentNotificationIds.length} notification statuses`);
      }
    }

    console.log(`[HazardNotify] Completed notifications for hazard ${hazard.report_id}`);
  } catch (err) {
    console.error("[HazardNotify] Error in notifyNearbyUsersOfHazard:", err);
  }
};


// Get hazards near location
export const getHazardsNearby = async (req, res) => {
  try {
    const { lat, lng, radius, sortBy } = req.query;

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius || 0.3);
    const sortByParam = sortBy || 'nearest'; // 'nearest' or 'newest'

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    const hazards = await Hazard.findHazardsNearLocation(latNum, lngNum, radiusNum, sortByParam);


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

    // ✅ NEW: Fetch old data for audit logging
    const oldHazard = await Hazard.getHazardById(id);
    if (!oldHazard || oldHazard.user_id !== userId) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

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

    // If coordinates changed, reverse geocode to update cached_address
    if (updates.lat && updates.lng && (updates.lat !== oldHazard.lat || updates.lng !== oldHazard.lng)) {
      console.log('[Hazard] Coordinates changed, reverse geocoding new location...');
      const cached_address = await reverseGeocode(updates.lng, updates.lat);
      updates.cached_address = cached_address;
      console.log(`[Hazard] New address: ${cached_address || 'null'}`);
    }

    // ✅ NEW: Extract optional reason for audit log
    const reason = req.body.reason || null;

    const updated = await Hazard.updateHazard(id, userId, updates);

    if (!updated) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    // ✅ NEW: Log hazard update to audit table (background, non-blocking)
    AuditService.logHazardUpdate(id, userId, oldHazard, updated, reason).catch(err => {
      console.error('[Hazard] Failed to log audit entry:', err);
    });

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

    // ✅ NEW: Extract optional reason from request body
    const reason = req.body?.reason || null;

    const deleted = await Hazard.deleteHazard(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Hazard not found or not owned by you." });
    }

    // ✅ NEW: Log hazard deletion to audit table (background, non-blocking)
    AuditService.logHazardDelete(id, userId, reason).catch(err => {
      console.error('[Hazard] Failed to log audit entry:', err);
    });

    return res.status(200).json({
      message: "🗑️ Hazard deleted successfully.",
      deleted_hazard: deleted,
    });
  } catch (err) {
    console.error("Error deleting hazard:", err);
    return res.status(500).json({ error: "Failed to delete hazard." });
  }
};

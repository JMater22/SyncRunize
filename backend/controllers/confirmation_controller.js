// controllers/confirmation_controller.js
import supabase from "../utils/supabase.js";

/**
 * GET /api/confirmations/:reportId
 * Get all confirmations for a specific hazard report
 * Returns list of users who confirmed this hazard with their details
 */
export const getHazardConfirmations = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Fetch confirmations with user details (joined query)
    const { data: confirmations, error } = await supabase
      .from("hazard_confirmations")
      .select(`
        confirmation_id,
        confirmed_at,
        user:users (
          user_id,
          full_name,
          profile_pic
        )
      `)
      .eq("report_id", reportId)
      .order("confirmed_at", { ascending: false });

    if (error) {
      console.error(`[Confirmations] Error fetching confirmations for report ${reportId}:`, error);
      throw error;
    }

    // Format response to flatten user data
    const formattedConfirmations = confirmations.map(conf => ({
      confirmation_id: conf.confirmation_id,
      confirmed_at: conf.confirmed_at,
      user_id: conf.user?.user_id,
      full_name: conf.user?.full_name,
      profile_pic: conf.user?.profile_pic,
    }));

    return res.status(200).json({
      message: "✅ Confirmations retrieved successfully",
      count: formattedConfirmations.length,
      confirmations: formattedConfirmations,
    });
  } catch (error) {
    console.error("[Confirmations] Error in getHazardConfirmations:", error);
    return res.status(500).json({ error: "Failed to fetch confirmations" });
  }
};

/**
 * POST /api/confirmations/:reportId
 * User confirms a hazard exists
 * Automatically updates confirmation_count and effective_reported_at via trigger
 */
export const confirmHazard = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if hazard exists and is active
    const { data: hazard, error: hazardError } = await supabase
      .from("hazard_reports")
      .select("report_id, status")
      .eq("report_id", reportId)
      .eq("status", "active")
      .single();

    if (hazardError || !hazard) {
      console.error(`[Confirmations] Hazard ${reportId} not found or not active:`, hazardError);
      return res.status(404).json({ error: "Hazard not found or no longer active" });
    }

    // Insert confirmation (UNIQUE constraint prevents duplicates)
    const { data: confirmation, error: insertError } = await supabase
      .from("hazard_confirmations")
      .insert({
        report_id: reportId,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate key error (23505 = unique_violation)
      if (insertError.code === '23505') {
        return res.status(409).json({
          error: "You have already confirmed this hazard",
          message: "Duplicate confirmation not allowed",
        });
      }

      console.error(`[Confirmations] Error inserting confirmation:`, insertError);
      throw insertError;
    }

    console.log(`[Confirmations] ✅ User ${userId} confirmed hazard ${reportId}`);

    // Fetch updated hazard data to return confirmation count
    const { data: updatedHazard, error: updateError } = await supabase
      .from("hazard_reports")
      .select("confirmation_count, last_confirmed_at, effective_reported_at")
      .eq("report_id", reportId)
      .single();

    if (updateError) {
      console.warn(`[Confirmations] Failed to fetch updated hazard data:`, updateError);
    }

    return res.status(201).json({
      message: "✅ Hazard confirmed successfully",
      confirmation: {
        confirmation_id: confirmation.confirmation_id,
        report_id: reportId,
        user_id: userId,
        confirmed_at: confirmation.confirmed_at,
      },
      updated_hazard: updatedHazard || null,
    });
  } catch (error) {
    console.error("[Confirmations] Error in confirmHazard:", error);
    return res.status(500).json({ error: "Failed to confirm hazard" });
  }
};

/**
 * DELETE /api/confirmations/:reportId
 * User removes their confirmation (un-confirm)
 * Automatically updates confirmation_count and effective_reported_at via trigger
 */
export const unconfirmHazard = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Delete confirmation (RLS policy ensures user can only delete their own)
    const { data: deleted, error: deleteError } = await supabase
      .from("hazard_confirmations")
      .delete()
      .eq("report_id", reportId)
      .eq("user_id", userId)
      .select()
      .single();

    if (deleteError || !deleted) {
      // If no rows deleted, user hasn't confirmed this hazard
      console.log(`[Confirmations] User ${userId} tried to unconfirm hazard ${reportId} but has no confirmation`);
      return res.status(404).json({
        error: "Confirmation not found",
        message: "You have not confirmed this hazard",
      });
    }

    console.log(`[Confirmations] ✅ User ${userId} unconfirmed hazard ${reportId}`);

    // Fetch updated hazard data to return confirmation count
    const { data: updatedHazard, error: updateError } = await supabase
      .from("hazard_reports")
      .select("confirmation_count, last_confirmed_at, effective_reported_at")
      .eq("report_id", reportId)
      .single();

    if (updateError) {
      console.warn(`[Confirmations] Failed to fetch updated hazard data:`, updateError);
    }

    return res.status(200).json({
      message: "✅ Confirmation removed successfully",
      deleted_confirmation: {
        confirmation_id: deleted.confirmation_id,
        report_id: reportId,
        user_id: userId,
        confirmed_at: deleted.confirmed_at,
      },
      updated_hazard: updatedHazard || null,
    });
  } catch (error) {
    console.error("[Confirmations] Error in unconfirmHazard:", error);
    return res.status(500).json({ error: "Failed to remove confirmation" });
  }
};

/**
 * GET /api/confirmations/:reportId/check
 * Check if the current authenticated user has confirmed a specific hazard
 * Returns boolean confirmed status
 */
export const checkUserConfirmation = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Query for user's confirmation of this hazard
    const { data: confirmation, error } = await supabase
      .from("hazard_confirmations")
      .select("confirmation_id, confirmed_at")
      .eq("report_id", reportId)
      .eq("user_id", userId)
      .maybeSingle(); // Don't throw error if not found

    if (error) {
      console.error(`[Confirmations] Error checking confirmation:`, error);
      throw error;
    }

    return res.status(200).json({
      confirmed: !!confirmation,
      confirmation: confirmation || null,
    });
  } catch (error) {
    console.error("[Confirmations] Error in checkUserConfirmation:", error);
    return res.status(500).json({ error: "Failed to check confirmation status" });
  }
};

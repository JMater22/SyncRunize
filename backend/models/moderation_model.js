import { supabase } from "../utils/supabase.js";

// Retrieve moderation history for a hazard report
export const getModerationLogs = async (reportId) => {
  const { data, error } = await supabase
    .from("moderation_logs")
    .select("*")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Insert a new moderation log
export const addModerationLog = async (reportId, moderatorId, action, reason) => {
  const { data, error } = await supabase
    .from("moderation_logs")
    .insert({
      report_id: reportId,
      moderator_id: moderatorId,
      action,
      reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

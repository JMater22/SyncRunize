// services/audit_service.js
import { supabase } from '../utils/supabase.js';

/**
 * Log hazard creation to audit table
 */
export async function logHazardCreate(reportId, userId, hazardData) {
  try {
    const { data, error } = await supabase
      .from('hazard_audit_logs')
      .insert({
        report_id: reportId,
        user_id: userId,
        moderator_id: null,
        action: 'create',
        changed_fields: null,
        reason: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Failed to log hazard creation:', error);
      return null;
    }

    console.log(`[Audit] Logged hazard creation: report_id=${reportId}, user_id=${userId}`);
    return data;
  } catch (err) {
    console.error('[Audit] Exception logging hazard creation:', err);
    return null;
  }
}

/**
 * Log hazard update with field-level change detection
 */
export async function logHazardUpdate(reportId, userId, oldData, newData, reason = null) {
  try {
    // Detect which fields changed
    const changedFields = {};
    const fieldsToTrack = ['title', 'description', 'incident_type', 'lat', 'lng', 'severity_weight', 'status'];

    for (const field of fieldsToTrack) {
      if (oldData[field] !== newData[field]) {
        changedFields[field] = {
          old: oldData[field],
          new: newData[field]
        };
      }
    }

    // Only log if there are actual changes
    if (Object.keys(changedFields).length === 0) {
      console.log('[Audit] No changes detected, skipping audit log');
      return null;
    }

    const { data, error } = await supabase
      .from('hazard_audit_logs')
      .insert({
        report_id: reportId,
        user_id: userId,
        moderator_id: null,
        action: 'update',
        changed_fields: changedFields,
        reason: reason || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Failed to log hazard update:', error);
      return null;
    }

    console.log(`[Audit] Logged hazard update: report_id=${reportId}, changes=${Object.keys(changedFields).join(', ')}`);
    return data;
  } catch (err) {
    console.error('[Audit] Exception logging hazard update:', err);
    return null;
  }
}

/**
 * Log hazard deletion
 */
export async function logHazardDelete(reportId, userId, reason = null) {
  try {
    const { data, error } = await supabase
      .from('hazard_audit_logs')
      .insert({
        report_id: reportId,
        user_id: userId,
        moderator_id: null,
        action: 'delete',
        changed_fields: {
          status: {
            old: 'active',
            new: 'deleted'
          }
        },
        reason: reason || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Failed to log hazard deletion:', error);
      return null;
    }

    console.log(`[Audit] Logged hazard deletion: report_id=${reportId}, reason=${reason || 'none'}`);
    return data;
  } catch (err) {
    console.error('[Audit] Exception logging hazard deletion:', err);
    return null;
  }
}

/**
 * Get complete audit history for a hazard
 */
export async function getHazardAuditHistory(reportId) {
  try {
    const { data, error } = await supabase
      .from('hazard_audit_logs')
      .select(`
        *,
        user:users!user_id(user_id, username, profile_picture),
        moderator:users!moderator_id(user_id, username, profile_picture)
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Audit] Failed to fetch audit history:', error);
      return [];
    }

    console.log(`[Audit] Retrieved ${data?.length || 0} audit entries for report_id=${reportId}`);
    return data || [];
  } catch (err) {
    console.error('[Audit] Exception fetching audit history:', err);
    return [];
  }
}

/**
 * Get audit history for a specific user (all their hazards)
 */
export async function getUserAuditHistory(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('hazard_audit_logs')
      .select(`
        *,
        user:users!user_id(user_id, username, profile_picture),
        moderator:users!moderator_id(user_id, username, profile_picture)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Audit] Failed to fetch user audit history:', error);
      return [];
    }

    console.log(`[Audit] Retrieved ${data?.length || 0} audit entries for user_id=${userId}`);
    return data || [];
  } catch (err) {
    console.error('[Audit] Exception fetching user audit history:', err);
    return [];
  }
}

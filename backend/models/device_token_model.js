import { supabase } from "../utils/supabase.js";

const TABLE = "device_tokens";

const normalizePlatform = (platform) => {
  if (!platform) return "unknown";
  const value = platform.toLowerCase();
  if (value === "ios" || value === "android" || value === "web") {
    return value;
  }
  return "unknown";
};

const handleTableError = (error) => {
  if (error?.message?.includes("relation") && error?.message?.includes(TABLE)) {
    console.warn(
      `[DeviceTokens] Table "${TABLE}" not found. Run backend/sql/device_tokens.sql to create it.`
    );
  }
  throw error;
};

export const upsertDeviceToken = async ({ userId, token, platform }) => {
  try {
    const payload = {
      user_id: userId,
      token,
      platform: normalizePlatform(platform),
      last_seen_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: "token" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleTableError(error);
  }
};

export const removeDeviceToken = async (token) => {
  try {
    const { error } = await supabase.from(TABLE).delete().eq("token", token);
    if (error) throw error;
    return true;
  } catch (error) {
    handleTableError(error);
  }
};

export const getActiveTokensForUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("token, platform")
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleTableError(error);
  }
};

export const markTokenAsFailed = async (token) => {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ revoked_at: new Date().toISOString() })
      .eq("token", token);

    if (error) throw error;
  } catch (error) {
    handleTableError(error);
  }
};

export default {
  upsertDeviceToken,
  removeDeviceToken,
  getActiveTokensForUser,
  markTokenAsFailed,
};


import { supabase } from "../utils/supabase.js";

// List members
export const getGroupMembers = async (groupId) => {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      role,
      users(username, profile_picture)
    `)
    .eq("group_id", groupId);

  if (error) throw error;
  return data || [];
};

// Add member
export const addMember = async (groupId, userId, role = "member") => {
  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update role
export const updateRole = async (groupId, userId, role) => {
  const { data, error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Remove member
export const removeMember = async (groupId, userId) => {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
  return { message: "Member removed" };
};

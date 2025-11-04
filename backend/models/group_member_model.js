import { supabase } from "../utils/supabase.js";



export const checkMembership = async (groupId, userId) => {
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // User is not a member
    if (error.code === "PGRST116") {
      return { isMember: false, role: null };
    }
    throw error;
  }

  return { isMember: true, role: data.role };
};


export const getJoinedGroupIdsByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (error) throw error;

    // Return array of group IDs only
    return data.map((row) => row.group_id);
  } catch (error) {
    console.error("Supabase error fetching joined groups:", error.message);
    throw error;
  }
};



// ✅ List group members
export const getGroupMembers = async (groupId) => {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      role,
      joined_at,
      users:user_id (
        name,
        username,
        profile_picture
      )
    `)
    .eq("group_id", groupId);

  if (error) throw error;
  return data;
};

// ✅ Add a member to a group
export const addMember = async (groupId, userId, role = "member") => {
  const { data, error } = await supabase
    .from("group_members")
    .insert([
      { group_id: groupId, user_id: userId, role, joined_at: new Date().toISOString() },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ✅ Update member role
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

// ✅ Remove a member from a group
export const removeMember = async (groupId, userId) => {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
  return { message: "Member removed successfully" };
};

export const isGroupAdmin = async (groupId, userId) => {
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (error) return false;
  return data?.role === "admin";
};

export const isGroupMember = async (groupId, userId) => {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (error) return false;
  return !!data;
};

export const addGroupMember = async (groupId, userId, role = "member") => {
  const { data, error } = await supabase
    .from("group_members")
    .insert([
      {
        group_id: groupId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
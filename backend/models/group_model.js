import { supabase } from "../utils/supabase.js";

// Get all groups
export const getAllGroups = async () => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get a group by ID
export const getGroupById = async (groupId) => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("group_id", groupId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }
  return data;
};

// Create group
export const createGroup = async (name, description, group_picture, createdBy) => {
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      description,
      group_picture,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update group
export const updateGroup = async (groupId, name, description) => {
  const { data, error } = await supabase
    .from("groups")
    .update({
      name,
      description,
    })
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete group
export const deleteGroup = async (groupId) => {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("group_id", groupId);

  if (error) throw error;
  return { message: "Group deleted" };
};

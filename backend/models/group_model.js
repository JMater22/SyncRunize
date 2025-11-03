import { supabase } from "../utils/supabase.js";

// ✅ Get all groups
export const getAllGroups = async () => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ✅ Get a group by ID
export const getGroupById = async (groupId) => {
  // Get group details
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("group_id", groupId)
    .single();

  if (error) throw error;

  // Get member count using Supabase count (more efficient)
  const { count, error: countError } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (countError) {
    console.error("Error counting members:", countError);
    return { ...data, member_count: 0 };
  }

  // Return group data with member count
  return { ...data, member_count: count || 0 };
};
// ✅ Create a new group
// ✅ Create a new group
export const createGroup = async ({ name, description, privacy, group_picture, created_by }) => {
  console.log("📥 Received in model:", { name, description, privacy, group_picture, created_by });
  const banner_link = "https://hooceemtoyucadhxuevx.supabase.co/storage/v1/object/public/assets/Default-banner/Banner%20UP.png";
  const { data, error } = await supabase
    .from("groups")
    .insert([{
      name,
      description,
      privacy: Boolean(privacy),
      group_picture: group_picture || "https://i.pinimg.com/736x/43/a5/4b/43a54b5ac213b39d702b16a503738437.jpg",
      created_by,
      banner_link: banner_link
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};



// ✅ Update group details
export const updateGroup = async (groupId, name, description) => {
  const { data, error } = await supabase
    .from("groups")
    .update({ name, description })
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ✅ Delete group
export const deleteGroup = async (groupId) => {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("group_id", groupId);

  if (error) throw error;
  return { message: "Group deleted successfully" };
};

// models/user_model.js
import { supabase } from "../utils/supabase.js";

// Create user profile (after signup)
export const createUserProfile = async (auth_id, name, email, gender = null, age = null, weight_kg = null) => {
  const { data, error } = await supabase
    .from("users")
    .insert([{ auth_id, name, email, gender, age, weight_kg }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get profile by Supabase auth_id (protected)
export const getUserByAuthId = async (auth_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, auth_id, name, email, gender, age, weight_kg, created_at, profile_picture, description")
    .eq("auth_id", auth_id)
    .single();

  if (error) throw error;
  return data;
};

// ✅ Get profile by user_id (protected)
export const getUserById = async (user_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, auth_id, name, email, username, gender, age, weight_kg, created_at, profile_picture, description")
    .eq("user_id", user_id)
    .single();

  if (error) throw error;
  return data;
};

// Get public user profile by ID (DO NOT include weight_kg)
export const getPublicUserById = async (id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, name, gender, age, created_at, profile_picture, description")
    .eq("user_id", id)
    .single();

  if (error) throw error;
  return data;
};

// ✅ Update own profile (by user_id)
export const updateUserProfile = async (user_id, updates) => {
  // Destructure only known editable fields to prevent injection or unwanted updates
  const {
    name,
    profile_picture,
    gender,
    age,
    weight_kg,
    description,
  } = updates;

  // Construct the update object dynamically to avoid overwriting with undefined values
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (profile_picture !== undefined) updateFields.profile_picture = profile_picture;
  if (gender !== undefined) updateFields.gender = gender;
  if (age !== undefined) updateFields.age = age;
  if (weight_kg !== undefined) updateFields.weight_kg = weight_kg;
  if (description !== undefined) updateFields.description = description;

  // Ensure there's at least one field to update
  if (Object.keys(updateFields).length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateFields)
    .eq("user_id", user_id)  // ✅ Changed from auth_id to user_id
    .select()
    .single();

  if (error) throw error;

  return data;
};




// ✅ Delete own profile (by user_id)
export const deleteUserProfile = async (user_id) => {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("user_id", user_id)  // ✅ Changed from auth_id to user_id
    .select()
    .single();

  if (error) throw error;
  return data;
};



export const searchUsers = async (searchQuery) => {
  const { data, error } = await supabase
    .from("users")
    .select(`
      user_id,
      name,
      username,
      profile_picture
    `)
    .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
};
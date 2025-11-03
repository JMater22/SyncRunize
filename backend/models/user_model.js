// models/user_model.js
import { supabase } from "../utils/supabase.js";

// Create user profile (after signup)
export const createUserProfile = async (
  auth_id,
  name,
  email,
  gender = null,
  age = null,
  weight_kg = null
) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_id,
      name,
      email,
      gender,
      age,
      weight_kg,
    })
    .select("user_id, auth_id, name, email, gender, age, weight_kg, created_at")
    .single();

  if (error) throw error;
  return data;
};

// Get profile by Supabase auth_id (protected)
export const getUserByAuthId = async (auth_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, auth_id, name, email, gender, age, weight_kg, created_at")
    .eq("auth_id", auth_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }
  return data;
};

// Get public user profile by ID (DO NOT include weight_kg)
export const getPublicUserById = async (id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, name, gender, age, created_at")
    .eq("user_id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }
  return data;
};

// Update own profile (by auth_id)
export const updateUserProfile = async (auth_id, updates) => {
  const { name, gender, age, weight_kg } = updates;

  // Build update object with only provided values
  const updateData = {};
  if (name !== undefined && name !== null) updateData.name = name;
  if (gender !== undefined && gender !== null) updateData.gender = gender;
  if (age !== undefined && age !== null) updateData.age = age;
  if (weight_kg !== undefined && weight_kg !== null) updateData.weight_kg = weight_kg;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("auth_id", auth_id)
    .select("user_id, auth_id, name, email, gender, age, weight_kg, created_at")
    .single();

  if (error) throw error;
  return data;
};

// Delete own profile (by auth_id)
export const deleteUserProfile = async (auth_id) => {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("auth_id", auth_id)
    .select("user_id, auth_id")
    .single();

  if (error) throw error;
  return data;
};

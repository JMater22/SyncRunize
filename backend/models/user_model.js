// models/user_model.js
import { supabase } from "../utils/supabase.js";

const normalizeBase = (name) => {
  if (!name || typeof name !== 'string') return 'user';
  const stripped = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '') // remove non-alphanumerics
    .trim();
  return stripped || 'user';
};

const ensureAtPrefix = (s) => (s.startsWith('@') ? s : `@${s}`);

const findAvailableUsername = async (base) => {
  // Try base, then base1..base99, then random suffix fallback
  const tryCandidate = async (candidate) => {
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('username', candidate)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error; // ignore no rows error code
    return !data; // available if no data
  };

  const baseAt = ensureAtPrefix(base);
  if (await tryCandidate(baseAt)) return baseAt;

  for (let i = 1; i <= 99; i++) {
    const candidate = `${baseAt}${i}`;
    if (await tryCandidate(candidate)) return candidate;
  }

  // Fallback: random suffix
  for (let i = 0; i < 200; i++) {
    const candidate = `${baseAt}${Math.floor(1000 + Math.random() * 9000)}`;
    if (await tryCandidate(candidate)) return candidate;
  }

  // Last resort
  return `${baseAt}${Date.now().toString().slice(-6)}`;
};

// Create user profile (after signup)
export const createUserProfile = async (auth_id, name, email, gender = null, age = null, weight_kg = null) => {
  // Generate a username from full name: lowercase, no spaces/non-alnum, with '@'
  const base = normalizeBase(name);
  const username = await findAvailableUsername(base);

  const { data, error } = await supabase
    .from("users")
    .insert([{ auth_id, name, email, username, gender, age, weight_kg }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get profile by Supabase auth_id (protected)
export const getUserByAuthId = async (auth_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, auth_id, name, email, gender, age, weight_kg, created_at, profile_picture, description, location")
    .eq("auth_id", auth_id)
    .single();

  if (error) throw error;
  return data;
};

// ✅ Get profile by user_id (protected)
export const getUserById = async (user_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, auth_id, name, email, username, gender, age, weight_kg, created_at, profile_picture, description, location, activities_visibility, distance_unit, push_enabled")
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
    location,
    distance_unit,
    activities_visibility,
  } = updates;

  // Construct the update object dynamically to avoid overwriting with undefined values
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (profile_picture !== undefined) updateFields.profile_picture = profile_picture;
  if (gender !== undefined) updateFields.gender = gender;
  if (age !== undefined) updateFields.age = age;
  if (weight_kg !== undefined) updateFields.weight_kg = weight_kg;
  if (description !== undefined) updateFields.description = description;
  if (location !== undefined) updateFields.location = location;
  if (distance_unit !== undefined) {
    const allowed = ['km','mi'];
    if (!allowed.includes(distance_unit)) {
      throw new Error("Invalid distance_unit; must be 'km' or 'mi'");
    }
    updateFields.distance_unit = distance_unit;
  }
  if (activities_visibility !== undefined) {
    const allowed = ['public', 'private'];
    if (!allowed.includes(activities_visibility)) {
      throw new Error("Invalid activities_visibility; must be 'public' or 'private'");
    }
    updateFields.activities_visibility = activities_visibility;
  }

  // If name is being updated, automatically refresh the username derived from name
  if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
    const base = normalizeBase(name);
    updateFields.username = await findAvailableUsername(base);
  }

  // Ensure there's at least one field to update
  if (Object.keys(updateFields).length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateFields)
    .eq("user_id", user_id)
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

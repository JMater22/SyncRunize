// controllers/user_controller.js
import * as UserModel from "../models/user_model.js";
import { supabase } from "../utils/supabase.js";

// ✅ Create user profile (after Supabase signup)
export const createUserProfile = async (req, res) => {
  try {
    const { name, gender, age, weight_kg } = req.body;
    const user = req.user; // from authenticate middleware

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Use auth_id (UUID) to check if profile exists
    const existing = await UserModel.getUserByAuthId(user.auth_id);
    if (existing) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    // ✅ Create profile with auth_id
    const newUser = await UserModel.createUserProfile(
      user.auth_id,  // ✅ Pass UUID auth_id
      name,
      user.email,
      gender,
      age,
      weight_kg
    );

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ error: "Failed to create user profile" });
  }
};

// ✅ Get own profile (protected)
export const getMyProfile = async (req, res) => {
  try {
    // ✅ Now we have user_id directly from middleware
    const userId = req.user.user_id;  // Integer from users table
    
    const profile = await UserModel.getUserById(userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json(profile);
  } catch (err) {
    console.error("Get Profile Error:", err);
    console.log("req.user:", req.user);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// ✅ Get public profile (by params)
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Assuming the param is user_id (integer)
    const profile = await UserModel.getPublicUserById(parseInt(id, 10));
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(profile);
  } catch (err) {
    console.error("Get Public Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
};

// ✅ Update own profile (protected)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;  // ✅ Use user_id
    const updates = req.body;

    const updated = await UserModel.updateUserProfile(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ✅ Delete own profile (protected)
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;    // ✅ Integer for database
    const authId = req.user.auth_id;    // ✅ UUID for Supabase auth

    // Delete from users table using user_id
    const deleted = await UserModel.deleteUserProfile(userId);
    if (!deleted) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Delete the Supabase Auth user using auth_id
    await supabase.auth.admin.deleteUser(authId);

    res.json({ 
      message: "Profile deleted successfully", 
      user_id: userId 
    });
  } catch (err) {
    console.error("Delete Profile Error:", err);
    res.status(500).json({ error: "Failed to delete profile" });
  }
};

// ✅ Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: "Search query must be at least 2 characters" 
      });
    }

    const users = await UserModel.searchUsers(q.trim());
    res.status(200).json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};
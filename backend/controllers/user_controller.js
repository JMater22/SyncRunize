// controllers/user_controller.js
import * as UserModel from "../models/user_model.js";
import { supabase } from "../utils/supabase.js";

// ✅ Create user profile (after Supabase signup)
// Note: No authentication required - user doesn't exist in DB yet
// The auth_id from Supabase signup proves they registered
export const createUserProfile = async (req, res) => {
  try {
    const { name, email, auth_id, gender, age, weight_kg } = req.body;

    // Validate required fields
    if (!auth_id || !email || !name) {
      return res.status(400).json({
        error: "Missing required fields: auth_id, email, and name are required"
      });
    }

    // ✅ Check if profile already exists
    const existing = await UserModel.getUserByAuthId(auth_id);
    if (existing) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    // ✅ Create profile with data from signup
    const newUser = await UserModel.createUserProfile(
      auth_id,       // ✅ auth_id (UUID) from Supabase signup
      name,
      email,         // email from signup form
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

// ✅ Update account settings (name, weight, gender, location)
export const updateAccountSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, weight_kg, gender, location } = req.body;

    const updates = {};
    if (name !== undefined && name.trim()) updates.name = name.trim();
    if (weight_kg !== undefined && !isNaN(parseFloat(weight_kg))) updates.weight_kg = parseFloat(weight_kg);
    if (gender !== undefined && ['male', 'female', 'other'].includes(gender)) updates.gender = gender;
    if (location !== undefined) updates.location = location.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid account settings provided" });
    }

    const updated = await UserModel.updateUserProfile(userId, updates);

    res.json({
      message: "Account settings updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("❌ Update Account Settings Error:", err);
    res.status(500).json({ error: "Failed to update account settings", details: err.message });
  }
};

// ✅ Update privacy controls (activities_visibility)
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { activities_visibility } = req.body;

    if (!activities_visibility || !['public', 'private'].includes(activities_visibility)) {
      return res.status(400).json({
        error: "Invalid activities_visibility. Must be 'public' or 'private'."
      });
    }

    const updated = await UserModel.updateUserProfile(userId, { activities_visibility });

    res.json({
      message: "Privacy settings updated successfully",
      data: {
        activities_visibility: updated.activities_visibility
      }
    });
  } catch (err) {
    console.error("❌ Update Privacy Settings Error:", err);
    res.status(500).json({ error: "Failed to update privacy settings", details: err.message });
  }
};


// ✅ Update password (handled by Supabase on frontend, but endpoint for consistency)
export const updatePassword = async (req, res) => {
  try {
    // Password updates are handled by Supabase Auth on the frontend
    // This endpoint is here for API consistency, but actual password change
    // should use supabase.auth.updateUser({ password: newPassword })

    res.status(200).json({
      message: "Password updates should be handled via Supabase Auth on the client side"
    });
  } catch (err) {
    console.error("❌ Update Password Error:", err);
    res.status(500).json({ error: "Failed to update password", details: err.message });
  }
};


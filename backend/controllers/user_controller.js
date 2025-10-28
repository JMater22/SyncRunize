// controllers/user_controller.js
import * as UserModel from "../models/user_model.js";
import { supabase } from "../utils/supabase.js";

// ✅ Create user profile (after Supabase signup)
export const createUserProfile = async (req, res) => {
  try {
    const { name, gender, age, weight_kg } = req.body;
    const user = req.user; // from Supabase middleware

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await UserModel.getUserByAuthId(user.id);
    if (existing) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    const newUser = await UserModel.createUserProfile(
      user.id,
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
    const user = req.user;
    const profile = await UserModel.getUserByAuthId(user.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// ✅ Get public profile (by params)
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await UserModel.getPublicUserById(id);
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(profile);
  } catch (err) {
    console.error("Get Public Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
};

// ✅ Update own profile (protected)
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    const updated = await UserModel.updateUserProfile(user.id, updates);
    if (!updated) return res.status(404).json({ error: "Profile not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ✅ Delete own profile (protected)
export const deleteProfile = async (req, res) => {
  try {
    const user = req.user;
    const deleted = await UserModel.deleteUserProfile(user.id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });

    // Optional: also delete the Supabase Auth user
    await supabase.auth.admin.deleteUser(user.id);

    res.json({ message: "Profile deleted successfully", user_id: user.id });
  } catch (err) {
    console.error("Delete Profile Error:", err);
    res.status(500).json({ error: "Failed to delete profile" });
  }
};

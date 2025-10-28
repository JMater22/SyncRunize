import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as UserModel from "../models/user_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Register user
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const existing = await UserModel.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser(email, hashedPassword, username);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.getUserByEmail(email);
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user.user_id, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get profile
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let { username, profile_picture, password } = req.body;
    let hashedPassword = null;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const updated = await UserModel.updateUser(id, { username, profile_picture, hashedPassword });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UserModel.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

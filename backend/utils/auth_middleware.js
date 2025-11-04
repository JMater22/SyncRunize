import { supabase } from "./supabase.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token format" });

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // ✅ FIX: Get user_id from users table using auth_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id, name, email, username, profile_picture")
      .eq("auth_id", user.id)  // Match auth_id to Supabase auth user.id
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return res.status(404).json({ 
        error: "User not found in database",
        debug: {
          auth_id: user.id,
          email: user.email
        }
      });
    }

    // ✅ Attach complete user info to req.user
    req.user = {
      user_id: userData.user_id,    // Integer from users table
      auth_id: user.id,              // UUID from Supabase auth
      email: userData.email,
      name: userData.name,
      username: userData.username,
      profile_picture: userData.profile_picture
    };

    next();
  } catch (err) {
    console.error("Supabase Auth Middleware Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
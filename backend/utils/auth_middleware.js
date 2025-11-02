
import { supabase } from "./supabase.js"; // your Supabase client

// Middleware to check if user is authenticated via Supabase Auth
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    // Token format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token format" });

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user; // Attach Supabase user info (equivalent to decoded JWT)
    next();
  } catch (err) {
    console.error("Supabase Auth Middleware Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

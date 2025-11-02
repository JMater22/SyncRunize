  import express from "express";
  import bodyParser from "body-parser";
  import cors from "cors";
  import dotenv from "dotenv";
  import pool from "./utils/db.js";

  import userRoutes from "./routes/user_routes.js";
  import postRoutes from "./routes/post_routes.js";
  import commentRoutes from "./routes/comment_routes.js";
  import likeRoutes from "./routes/like_routes.js";
  import followRoutes from "./routes/follow_routes.js";

  import groupRoutes from "./routes/group_routes.js";
  import groupMemberRoutes from "./routes/group_member_routes.js";
  import groupPostRoutes from "./routes/group_post_routes.js";

  import hazardRoutes from "./routes/hazard_routes.js";
  import officialIncidentRoutes from "./routes/official_incident_routes.js";

  import challengeRoutes from "./routes/challenge_routes.js";

  import notificationRoutes from "./routes/notification_routes.js";
  import moderationRoutes from "./routes/moderation_routes.js";

  import statsRoutes from "./routes/stats_routes.js";
  import userRouteRoutes from "./routes/user_route_routes.js";


  import path from "path";
  import { fileURLToPath } from "url";
  import { swaggerUi, swaggerSpec } from "./utils/swagger.js";



  dotenv.config();

  const app = express();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(cors());
  app.use(bodyParser.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  // ---------------- Routes ----------------
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/likes", likeRoutes);
  app.use("/api/follows", followRoutes);

  app.use("/api/groups", groupRoutes);
  app.use("/api/group-members", groupMemberRoutes);
  app.use("/api/group-posts", groupPostRoutes); // NOT YET INTEGRATED ON POSTMAN

  app.use("/api/hazards", hazardRoutes); // GOODS GUMANA
  app.use("/api/official-incidents", officialIncidentRoutes);

  app.use("/api/challenges", challengeRoutes);

  app.use("/api/notifications", notificationRoutes);
  app.use("/api/moderation", moderationRoutes);


  app.use("/api/stats", statsRoutes);
  app.use("/api/routes", userRouteRoutes);

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // -----------------------------------------

  app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "✅ Connected", time: result.rows[0].now });
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
console.log('🔍 MAP_SNAPSHOT_PROVIDER:', process.env.MAP_SNAPSHOT_PROVIDER);
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

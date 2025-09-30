import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

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
import badgeRoutes from "./routes/badge_routes.js";

import notificationRoutes from "./routes/notification_routes.js";
import moderationRoutes from "./routes/moderation_routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- Routes ----------------
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);

app.use("/api/groups", groupRoutes);
app.use("/api/group-members", groupMemberRoutes);
app.use("/api/group-posts", groupPostRoutes);

app.use("/api/hazards", hazardRoutes);
app.use("/api/official-incidents", officialIncidentRoutes);

app.use("/api/challenges", challengeRoutes);
app.use("/api/badges", badgeRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/moderation", moderationRoutes);
// -----------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

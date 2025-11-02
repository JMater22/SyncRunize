// routes/routing_routes.js
import express from "express";
import { getRoute } from "../controllers/routing_controller.js";

const router = express.Router();

router.post("/safest", getRoute);

export default router;

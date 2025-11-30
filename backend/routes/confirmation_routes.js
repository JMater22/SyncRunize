// routes/confirmation_routes.js
import express from "express";
import * as ConfirmationController from "../controllers/confirmation_controller.js";
import { authenticate } from "../utils/auth_middleware.js";

const router = express.Router();

/**
 * GET /api/confirmations/:reportId
 * Get all confirmations for a specific hazard
 * Public endpoint - anyone can view who confirmed a hazard
 */
router.get(
  "/:reportId",
  ConfirmationController.getHazardConfirmations
);

/**
 * GET /api/confirmations/:reportId/check
 * Check if current user has confirmed this hazard
 * Requires authentication
 */
router.get(
  "/:reportId/check",
  authenticate,
  ConfirmationController.checkUserConfirmation
);

/**
 * POST /api/confirmations/:reportId
 * Confirm a hazard (user confirms it exists)
 * Requires authentication
 */
router.post(
  "/:reportId",
  authenticate,
  ConfirmationController.confirmHazard
);

/**
 * DELETE /api/confirmations/:reportId
 * Remove confirmation (un-confirm a hazard)
 * Requires authentication
 */
router.delete(
  "/:reportId",
  authenticate,
  ConfirmationController.unconfirmHazard
);

export default router;

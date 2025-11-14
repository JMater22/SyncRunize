import express from "express";
import multer from "multer";
import * as HazardController from "../controllers/hazard_controller.js";
import { authenticate } from "../utils/auth_middleware.js";
import { uploadHazardImage, handleMulterError } from "../config/multer_config.js";

const router = express.Router();

// Create hazard (with optional image)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    // ✅ FIX: Wrap multer to catch errors properly
    uploadHazardImage.single("image")(req, res, (err) => {
      if (err) {
        // Handle multer errors immediately
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image file too large. Maximum size is 5MB.' });
          }
          return res.status(400).json({ error: `File upload error: ${err.message}` });
        }
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      next();
    });
  },
  HazardController.createHazard
);


// Getting nearby hazards (public okay)
router.get("/nearby", HazardController.getHazardsNearby);


// Get all hazards created by logged-in user
router.get("/my-hazards", authenticate, HazardController.getUserHazards);

// Update hazard (owner only) with optional new image
router.put(
  "/:id",
  authenticate,
  uploadHazardImage.single("image"), // optional image replacement
  HazardController.updateHazard
);

// Delete hazard (owner only)
router.delete("/:id", authenticate, HazardController.deleteHazard);

export default router;

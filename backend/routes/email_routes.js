import express from "express";
import { checkEmailDomain } from "../services/emailService.js";

const router = express.Router();

// POST /api/check-email-domain
router.post("/check-email-domain", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const domainExists = await checkEmailDomain(email);

  if (domainExists) {
    res.json({ success: true, message: "Valid email domain" });
  } else {
    res.status(400).json({ success: false, message: "Invalid or unreachable email domain" });
  }
});

export default router;

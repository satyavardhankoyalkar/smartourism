// routes/smsRoutes.js
import express from "express";

const router = express.Router();

/**
 * Mock SMS fallback
 * POST /api/sms/fallback
 */
router.post("/fallback", (req, res) => {
  const { tourist_id, lat, lon, message } = req.body;

  // In real implementation, integrate with SMS gateway
  console.log(`📩 SMS fallback: Tourist ${tourist_id}, Location: ${lat},${lon}, Msg: ${message}`);

  res.json({ status: "ok", message: "SMS fallback received (mock)" });
});

export default router;

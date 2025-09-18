// routes/voiceRoutes.js
import express from "express";
import multer from "multer";
import { pool } from "../services/database.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * Upload voice SOS message
 * POST /api/voice/sos
 */
router.post("/sos", upload.single("voice"), async (req, res) => {
  const { tourist_id } = req.body;
  const filePath = req.file.path;

  try {
    const result = await pool.query(
      `INSERT INTO alerts (tourist_id, type, description, status) 
       VALUES ($1, 'voice', $2, 'open') RETURNING *`,
      [tourist_id, `Voice SOS recorded at ${filePath}`]
    );

    res.status(201).json({ message: "Voice SOS received", alert: result.rows[0] });
  } catch (err) {
    console.error("Voice SOS error:", err);
    res.status(500).json({ error: "Failed to save voice SOS" });
  }
});

export default router;

// routes/sosRoutes.js
import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Trigger SOS (voice/text/one-tap)
 * POST /api/sos
 * body: { tourist_id, mode, message }
 */
router.post("/", async (req, res) => {
  const { tourist_id, mode, message } = req.body;

  let type = "panic";
  if (message?.toLowerCase().includes("doctor") || message?.toLowerCase().includes("medical")) {
    type = "medical";
  } else if (message?.toLowerCase().includes("lost")) {
    type = "lost";
  } else if (message?.toLowerCase().includes("unsafe")) {
    type = "geo-fence";
  }

  try {
    const result = await pool.query(
      `INSERT INTO alerts (tourist_id, type, description, status) 
       VALUES ($1, $2, $3, 'open') RETURNING *`,
      [tourist_id, type, `${mode} SOS: ${message}`]
    );

    res.status(201).json({ message: "SOS triggered", alert: result.rows[0] });
  } catch (err) {
    console.error("SOS error:", err);
    res.status(500).json({ error: "Failed to trigger SOS" });
  }
});

export default router;

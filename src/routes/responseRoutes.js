// routes/responseRoutes.js
import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Send reply to alert
 * POST /api/responses
 */
router.post("/", async (req, res) => {
  const { alert_id, response, mode } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO authority_responses (alert_id, response, mode) 
       VALUES ($1, $2, $3) RETURNING *`,
      [alert_id, response, mode || "text"]
    );

    res.json({ message: "Response saved", reply: result.rows[0] });
  } catch (err) {
    console.error("Response error:", err);
    res.status(500).json({ error: "Failed to save response" });
  }
});

/**
 * Get all responses for an alert
 * GET /api/responses/:alert_id
 */
router.get("/:alert_id", async (req, res) => {
  const { alert_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM authority_responses WHERE alert_id=$1 ORDER BY created_at ASC`,
      [alert_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch response error:", err);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
});

export default router;

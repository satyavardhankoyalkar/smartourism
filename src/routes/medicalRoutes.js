// routes/medicalRoutes.js
import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Save/update medical info
 * POST /api/medical
 */
router.post("/", async (req, res) => {
  const { tourist_id, allergies, conditions, medications } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO medical_info (tourist_id, allergies, conditions, medications) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tourist_id) DO UPDATE 
       SET allergies=$2, conditions=$3, medications=$4
       RETURNING *`,
      [tourist_id, allergies, conditions, medications]
    );

    res.json({ message: "Medical info saved", medical: result.rows[0] });
  } catch (err) {
    console.error("Medical info error:", err);
    res.status(500).json({ error: "Failed to save medical info" });
  }
});

/**
 * Get medical info
 * GET /api/medical/:tourist_id
 */
router.get("/:tourist_id", async (req, res) => {
  const { tourist_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM medical_info WHERE tourist_id=$1`,
      [tourist_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "No medical info found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch medical info error:", err);
    res.status(500).json({ error: "Failed to fetch medical info" });
  }
});

export default router;

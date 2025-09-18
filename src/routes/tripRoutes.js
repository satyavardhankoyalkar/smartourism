import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

// Create or update a trip itinerary
router.post("/create", async (req, res) => {
  const { tourist_id, itinerary } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tourist SET itinerary=$1 WHERE id=$2 RETURNING id, name, itinerary, status`,
      [itinerary, tourist_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tourist not found" });
    }

    res.json({ message: "Trip itinerary saved", trip: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save trip" });
  }
});

// Get a tourist's trip itinerary
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, name, itinerary, status FROM tourist WHERE id=$1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found for tourist" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching trip details" });
  }
});

export default router;

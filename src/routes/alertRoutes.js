import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Create a new alert (panic, anomaly, geo-fence)
 * POST /api/alerts
 */
router.post("/", async (req, res) => {
  const { tourist_id, type, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO alerts (tourist_id, type, description, status) 
       VALUES ($1, $2, $3, 'open') 
       RETURNING id, tourist_id, type, description, status, created_at`,
      [tourist_id, type, description || ""]
    );

    res.status(201).json({ message: "Alert created", alert: result.rows[0] });
  } catch (err) {
    console.error("Error creating alert:", err);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

/**
 * Get all active alerts
 * GET /api/alerts
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.tourist_id, t.name, a.type, a.description, a.status, a.created_at
       FROM alerts a
       JOIN tourist t ON a.tourist_id = t.id
       WHERE a.status = 'open'
       ORDER BY a.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching alerts:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

/**
 * Get alerts for a specific tourist
 * GET /api/alerts/tourist/:id
 */
router.get("/tourist/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, type, description, status, created_at
       FROM alerts WHERE tourist_id=$1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tourist alerts:", err);
    res.status(500).json({ error: "Failed to fetch tourist alerts" });
  }
});

/**
 * Resolve an alert
 * PUT /api/alerts/resolve/:id
 */
router.put("/resolve/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE alerts SET status='resolved' WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert resolved", alert: result.rows[0] });
  } catch (err) {
    console.error("Error resolving alert:", err);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

export default router;

import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Save a new GPS location ping
 * POST /api/locations
 */
router.post("/", async (req, res) => {
  const { tourist_id, lat, lon, risk_score, risk_label } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO locations (tourist_id, lat, lon, risk_score, risk_label) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tourist_id, lat, lon, timestamp, risk_score, risk_label`,
      [tourist_id, lat, lon, risk_score || null, risk_label || "safe"]
    );

    const saved = result.rows[0];

    // Try to enrich with AI/ML risk scoring
    const riskApiUrl = process.env.RISK_API_URL || "http://localhost:8000";
    try {
      // Pull last 10 points (including the new one)
      const hist = await pool.query(
        `SELECT lat, lon, timestamp FROM locations 
         WHERE tourist_id=$1 ORDER BY timestamp DESC LIMIT 10`,
        [tourist_id]
      );

      // Build points array in chronological order with ISO timestamps
      const points = hist.rows
        .map(r => ({ lat: Number(r.lat), lon: Number(r.lon), ts: new Date(r.timestamp).toISOString() }))
        .reverse();

      if (points.length >= 2 && typeof fetch === "function") {
        const resp = await fetch(`${riskApiUrl}/risk-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points })
        });
        if (resp.ok) {
          const data = await resp.json();
          const aiScore = data.risk_score;
          const aiLabel = data.label;

          // Update saved location with AI score/label
          await pool.query(
            `UPDATE locations SET risk_score=$1, risk_label=$2 WHERE id=$3`,
            [aiScore, aiLabel, saved.id]
          );

          // Optionally raise alert if high risk or any rule alerts returned
          if ((aiScore !== null && aiScore >= 0.7) || (Array.isArray(data.alerts) && data.alerts.length > 0)) {
            const description = `AI risk=${aiScore}, label=${aiLabel}` +
              (Array.isArray(data.alerts) && data.alerts.length ? `, alerts: ${data.alerts.join("; ")}` : "");
            await pool.query(
              `INSERT INTO alerts (tourist_id, type, description, status)
               VALUES ($1, 'anomaly', $2, 'open')`,
              [tourist_id, description]
            );
          }

          // Reflect enriched fields in response
          saved.risk_score = aiScore;
          saved.risk_label = aiLabel;
        }
      }
    } catch (aiErr) {
      // Non-fatal: continue with saved location even if AI service fails
      console.error("AI risk scoring error:", aiErr.message || aiErr);
    }

    res.status(201).json({ message: "Location saved", location: saved });
  } catch (err) {
    console.error("Error saving location:", err);
    res.status(500).json({ error: "Failed to save location" });
  }
});

/**
 * Get latest location of a tourist
 * GET /api/locations/latest/:tourist_id
 */
router.get("/latest/:tourist_id", async (req, res) => {
  const { tourist_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, tourist_id, lat, lon, timestamp, risk_score, risk_label
       FROM locations WHERE tourist_id=$1
       ORDER BY timestamp DESC LIMIT 1`,
      [tourist_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No locations found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching latest location:", err);
    res.status(500).json({ error: "Failed to fetch latest location" });
  }
});

/**
 * Get full location history of a tourist
 * GET /api/locations/history/:tourist_id
 */
router.get("/history/:tourist_id", async (req, res) => {
  const { tourist_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, tourist_id, lat, lon, timestamp, risk_score, risk_label
       FROM locations WHERE tourist_id=$1
       ORDER BY timestamp ASC`,
      [tourist_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No location history found" });
    }

    res.json({ tourist_id, history: result.rows });
  } catch (err) {
    console.error("Error fetching location history:", err);
    res.status(500).json({ error: "Failed to fetch location history" });
  }
});

export default router;

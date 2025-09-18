import express from "express";
import { pool } from "../services/database.js";

const router = express.Router();

/**
 * Add a new geo-fence (polygon)
 * POST /api/geofences
 * body: { name, risk_level, coordinates }
 * coordinates = [[lon, lat], [lon, lat], [lon, lat], [lon, lat]...] (must close loop)
 */
router.post("/", async (req, res) => {
  const { name, risk_level, coordinates } = req.body;

  try {
    // Convert coords into WKT POLYGON string
    const polygonCoords = coordinates.map(c => `${c[0]} ${c[1]}`).join(", ");
    const wktPolygon = `POLYGON((${polygonCoords}))`;

    const result = await pool.query(
      `INSERT INTO geo_fences (name, risk_level, area)
       VALUES ($1, $2, ST_GeomFromText($3, 4326))
       RETURNING id, name, risk_level`,
      [name, risk_level, wktPolygon]
    );

    res.status(201).json({ message: "Geo-fence created", fence: result.rows[0] });
  } catch (err) {
    console.error("Error creating geo-fence:", err);
    res.status(500).json({ error: "Failed to create geo-fence" });
  }
});

/**
 * Get all geo-fences
 * GET /api/geofences
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, risk_level, ST_AsGeoJSON(area) as area FROM geo_fences`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching geo-fences:", err);
    res.status(500).json({ error: "Failed to fetch geo-fences" });
  }
});

/**
 * Check if a tourist’s latest location is inside a geo-fence
 * GET /api/geofences/check/:tourist_id
 */
router.get("/check/:tourist_id", async (req, res) => {
  const { tourist_id } = req.params;

  try {
    // Get latest location
    const locResult = await pool.query(
      `SELECT id, lat, lon, geom, timestamp 
       FROM locations WHERE tourist_id=$1 
       ORDER BY timestamp DESC LIMIT 1`,
      [tourist_id]
    );

    if (locResult.rows.length === 0) {
      return res.status(404).json({ error: "No location found for tourist" });
    }

    const location = locResult.rows[0];

    // Check against geo-fences
    const gfResult = await pool.query(
      `SELECT id, name, risk_level 
       FROM geo_fences 
       WHERE ST_Within($1, area)`,
      [location.geom]
    );

    if (gfResult.rows.length === 0) {
      return res.json({ inside: false, location });
    }

    res.json({ inside: true, fences: gfResult.rows, location });
  } catch (err) {
    console.error("Error checking geo-fence:", err);
    res.status(500).json({ error: "Geo-fence check failed" });
  }
});

export default router;

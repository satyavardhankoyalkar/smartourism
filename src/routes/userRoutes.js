import express from "express";
import { pool } from "../services/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * Register a new tourist
 * POST /api/users/register
 */
router.post("/register", async (req, res) => {
  const {
    name,
    password,
    email,
    kyc_hash,
    mobile,
    gender,
    age,
    address,
    itinerary,
    emergency_contacts,
    digital_id
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO tourist 
        (name, password, email, kyc_hash, mobile, gender, age, address, itinerary, emergency_contacts, digital_id, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
       RETURNING id, name, email, mobile, gender, age, address, itinerary, emergency_contacts, digital_id, status`,
      [
        name,
        hashedPassword,
        email,
        kyc_hash,
        mobile,
        gender,
        age,
        address,
        JSON.stringify(itinerary || {}),
        JSON.stringify(emergency_contacts || []),
        digital_id || null
      ]
    );

    res.status(201).json({ message: "Tourist registered", tourist: result.rows[0] });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

/**
 * Login tourist
 * POST /api/users/login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 2. Find tourist by email
    const result = await pool.query("SELECT * FROM tourist WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tourist not found" });
    }

    const user = result.rows[0];

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    // 5. Send response (exclude password!)
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        age: user.age,
        address: user.address,
        digital_id: user.digital_id,
        status: user.status,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});


/**
 * Get tourist profile by ID
 * GET /api/users/:id
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Validate UUID (optional but recommended)
    if (!id || id.length < 10) {
      return res.status(400).json({ error: "Invalid tourist ID" });
    }

    const result = await pool.query(
      `SELECT id, name, email, kyc_hash, mobile, gender, age, address, 
              itinerary, emergency_contacts, digital_id, status, created_at
       FROM tourist 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tourist not found" });
    }

    // Send profile
    res.json({
      message: "Tourist profile fetched successfully",
      tourist: result.rows[0],
    });

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Error fetching tourist details", details: err.message });
  }
});

export default router;

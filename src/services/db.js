import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

console.log("DB_PASS type:", typeof process.env.DB_PASS, "value:", process.env.DB_PASS);

export const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "smart_tourism",
  password: (process.env.DB_PASS || "").trim(),  // ensure string
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL + PostGIS"))
  .catch(err => console.error("❌ DB connection error:", err));

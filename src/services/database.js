import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Production database configuration
export const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "smart_tourism",
  password: process.env.DB_PASS || "",
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL + PostGIS");
    console.log(`📊 Database: ${process.env.DB_NAME || 'smart_tourism'}`);
    console.log(`🏠 Host: ${process.env.DB_HOST || 'localhost'}`);
  })
  .catch(err => {
    console.error("❌ DB connection error:", err.message);
    console.error("💡 Make sure PostgreSQL is running and database exists");
    console.error("💡 Run: psql -U postgres -c 'CREATE DATABASE smart_tourism;'");
    console.error("💡 Then run: psql -U postgres -d smart_tourism -f scripts/setup-db-updated.sql");
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
});

export default pool;

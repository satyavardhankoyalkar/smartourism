import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query("SELECT NOW()")
  .then(res => {
    console.log("✅ DB Connected:", res.rows);
    pool.end();
  })
  .catch(err => console.error("❌ DB connection error:", err));

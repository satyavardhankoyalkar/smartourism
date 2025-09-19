import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

// Import routes
import userRoutes from "./src/routes/userRoutes.js";
import tripRoutes from "./src/routes/tripRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import geoFenceRoutes from "./src/routes/geoFenceRoutes.js";
import sosRoutes from "./src/routes/sosRoutes.js";
import voiceRoutes from "./src/routes/voiceRoutes.js";
import medicalRoutes from "./src/routes/medicalRoutes.js";
import smsRoutes from "./src/routes/smsRoutes.js";
import responseRoutes from "./src/routes/responseRoutes.js";

// Import database service
import "./src/services/database.js";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

// Connect to Render Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // needed for Render
});

// Absolute path to your SQL script
const setupFile = path.join(process.cwd(), "scripts", "setup-db-updated.sql");
(async () => {
  try {
    // Check if the "tourist" table exists
    const res = await pool.query("SELECT to_regclass('public.tourist')");
    if (!res.rows[0].to_regclass) {
      const setupSQL = fs.readFileSync(setupFile, "utf8");
      await pool.query(setupSQL);
      console.log("✅ Database schema initialized");
    } else {
      console.log("✅ Schema already exists, skipping setup");
    }
  } catch (err) {
    console.error("❌ DB setup error:", err.message);
  }
})();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.BODY_LIMIT || '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.BODY_LIMIT || '10mb' 
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Root route for quick test
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Smart Tourist API",
    version: "1.0.0",
    status: "operational",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      docs: "/api/docs",
      users: "/api/users",
      locations: "/api/locations",
      alerts: "/api/alerts",
      geofences: "/api/geofences",
      sos: "/api/sos",
      medical: "/api/medical",
      trips: "/api/trips"
    }
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/geofences", geoFenceRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/responses", responseRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Smart Tourist API running",
    environment: process.env.NODE_ENV || 'development',
    database: "PostgreSQL + PostGIS",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    title: "Smart Tourist API Documentation",
    version: "1.0.0",
    description: "Comprehensive API for tourist safety and emergency management",
    baseUrl: `${req.protocol}://${req.get('host')}`,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      authentication: {
        "POST /api/users/register": "Register new tourist with UUID",
        "POST /api/users/login": "Login tourist and get JWT token",
        "GET /api/users/:id": "Get tourist profile by UUID"
      },
      location: {
        "POST /api/locations": "Save GPS location with PostGIS geometry",
        "GET /api/locations/latest/:tourist_id": "Get latest location",
        "GET /api/locations/history/:tourist_id": "Get location history"
      },
      emergency: {
        "POST /api/sos": "Trigger emergency SOS alert",
        "POST /api/voice/sos": "Upload voice SOS message",
        "GET /api/alerts": "Get all active alerts",
        "PUT /api/alerts/resolve/:id": "Resolve alert"
      },
      geofencing: {
        "POST /api/geofences": "Create geo-fence with PostGIS polygons",
        "GET /api/geofences": "Get all geo-fences",
        "GET /api/geofences/check/:tourist_id": "Check location against fences"
      },
      medical: {
        "POST /api/medical": "Save medical information",
        "GET /api/medical/:tourist_id": "Get medical information"
      },
      trips: {
        "POST /api/trips/create": "Create/update trip itinerary",
        "GET /api/trips/:id": "Get trip details"
      },
      communication: {
        "POST /api/sms/fallback": "SMS fallback endpoint",
        "POST /api/responses": "Authority response to alerts",
        "GET /api/responses/:alert_id": "Get responses for alert"
      }
    },
    features: [
      "Real-time location tracking with PostGIS",
      "Emergency SOS system with multi-channel support",
      "Geofencing with spatial queries",
      "Medical information storage for emergency responders",
      "JWT authentication with bcrypt password hashing",
      "UUID-based user identification",
      "Comprehensive alert management system",
      "Blockchain integration ready",
      "ML-based risk assessment ready"
    ],
    database: {
      type: "PostgreSQL with PostGIS extension",
      features: [
        "UUID primary keys",
        "Spatial geometry columns",
        "JSONB for flexible data",
        "Automatic triggers",
        "Spatial indexes"
      ]
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: 'Something went wrong!',
    message: isDevelopment ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found", 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Smart Tourist API running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origins: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️ Database: PostgreSQL + PostGIS`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close database pool
    import('./src/services/database.js').then(({ pool }) => {
      pool.end(() => {
        console.log('✅ Database pool closed');
        console.log('👋 Graceful shutdown complete');
        process.exit(0);
      });
    }).catch(() => {
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
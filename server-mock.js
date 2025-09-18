import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import geoFenceRoutes from "./routes/geoFenceRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import medicalRoutes from "./routes/medicalRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Root route for quick test
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Smart Tourist API is running!",
    mode: "Mock Database Mode",
    status: "All systems operational",
    endpoints: {
      health: "/api/health",
      users: "/api/users",
      locations: "/api/locations",
      alerts: "/api/alerts",
      geofences: "/api/geofences",
      sos: "/api/sos",
      medical: "/api/medical",
      trips: "/api/trips"
    },
    note: "Using mock database - no PostgreSQL required!"
  });
});

// Routes
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
    mode: "Mock Database",
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    title: "Smart Tourist API Documentation",
    version: "1.0.0",
    description: "Comprehensive API for tourist safety and emergency management",
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      authentication: {
        "POST /api/users/register": "Register new tourist",
        "POST /api/users/login": "Login tourist",
        "GET /api/users/:id": "Get tourist profile"
      },
      location: {
        "POST /api/locations": "Save GPS location",
        "GET /api/locations/latest/:tourist_id": "Get latest location",
        "GET /api/locations/history/:tourist_id": "Get location history"
      },
      emergency: {
        "POST /api/sos": "Trigger emergency SOS",
        "POST /api/voice/sos": "Upload voice SOS message",
        "GET /api/alerts": "Get all active alerts",
        "PUT /api/alerts/resolve/:id": "Resolve alert"
      },
      geofencing: {
        "POST /api/geofences": "Create geo-fence",
        "GET /api/geofences": "Get all geo-fences",
        "GET /api/geofences/check/:tourist_id": "Check location against fences"
      },
      medical: {
        "POST /api/medical": "Save medical info",
        "GET /api/medical/:tourist_id": "Get medical info"
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
      "Real-time location tracking",
      "Emergency SOS system",
      "Geofencing with PostGIS",
      "Medical information storage",
      "Multi-channel communication",
      "JWT authentication",
      "Comprehensive alert system"
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Smart Tourist API running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️ Database: Mock Database (no PostgreSQL required)`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

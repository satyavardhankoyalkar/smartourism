# 📁 Smart Tourist API - Project Structure

## 🏗️ **Organized Directory Structure**

```
smart-tourist-api/
├── 📁 src/                          # Source code
│   ├── 📁 routes/                   # API route handlers
│   │   ├── userRoutes.js           # User authentication & profiles
│   │   ├── tripRoutes.js           # Trip management
│   │   ├── locationRoutes.js       # GPS location tracking
│   │   ├── alertRoutes.js          # Emergency alerts
│   │   ├── geoFenceRoutes.js       # Geofencing
│   │   ├── sosRoutes.js            # Emergency SOS
│   │   ├── voiceRoutes.js          # Voice message handling
│   │   ├── medicalRoutes.js        # Medical information
│   │   ├── smsRoutes.js            # SMS fallback
│   │   └── responseRoutes.js       # Authority responses
│   ├── 📁 middleware/              # Custom middleware
│   ├── 📁 models/                  # Data models (future)
│   └── 📁 services/                # Business logic services
│       ├── database.js             # Database connection & pool
│       └── db.js                   # Legacy database file
├── 📁 config/                      # Configuration files
│   ├── development.env             # Development environment
│   ├── production.env              # Production environment
│   └── env.example                 # Environment template
├── 📁 scripts/                     # Setup & deployment scripts
│   ├── setup-database.ps1          # Database setup script
│   ├── install-postgresql.ps1      # PostgreSQL installation helper
│   └── setup-db-updated.sql        # Database schema
├── 📁 docs/                        # Documentation
├── 📁 hackathon/                   # ML Model & AI components
│   ├── api.py                      # FastAPI ML service
│   ├── features.py                 # Feature extraction
│   ├── model.py                    # ML model training
│   ├── if_model.joblib             # Trained model
│   ├── scaler.joblib               # Feature scaler
│   └── synthetic_trips.json        # Training data
├── 📁 blockchain/                  # Blockchain integration
│   ├── contracts/                  # Smart contracts
│   │   └── TouristIDRegistry.sol   # Main contract
│   ├── scripts/                    # Deployment scripts
│   └── artifacts/                  # Compiled contracts
├── 📁 uploads/                     # File uploads directory
├── 📁 tests/                       # Test files
├── 📄 server.js                    # Main application entry point
├── 📄 package.json                 # Dependencies & scripts
├── 📄 docker-compose.yml           # Docker deployment
├── 📄 Dockerfile                   # Container configuration
├── 📄 .env                         # Environment variables (created)
└── 📄 README.md                    # Project documentation
```

## 🚀 **Quick Start Guide**

### **1. Install PostgreSQL**
```bash
# Run the installation helper
npm run install:postgres
```

### **2. Setup Database**
```bash
# Automated database setup
npm run setup:db
```

### **3. Start the API**
```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

### **4. Test the API**
```bash
# Run comprehensive tests
npm run test:api
```

## 🔧 **Environment Configuration**

### **Development (.env)**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_tourism
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=development_secret
CORS_ORIGIN=http://localhost:3000
```

### **Production (.env)**
```env
NODE_ENV=production
DB_HOST=your_production_host
DB_PORT=5432
DB_NAME=smart_tourism
DB_USER=your_production_user
DB_PASS=your_secure_password
JWT_SECRET=your_super_secure_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

## 🗄️ **Database Schema**

### **Core Tables**
- **tourist** - UUID-based user profiles
- **trips** - Trip itineraries and routes
- **locations** - GPS coordinates with PostGIS geometry
- **alerts** - Emergency alerts and notifications
- **geo_fences** - Geographic boundaries with polygons
- **medical_info** - Medical data for emergency responders
- **authority_responses** - Emergency service responses

### **Features**
- ✅ UUID primary keys
- ✅ PostGIS spatial data types
- ✅ JSONB for flexible data storage
- ✅ Automatic geometry triggers
- ✅ Spatial indexes for performance
- ✅ CASCADE deletes for data integrity

## 🔗 **API Endpoints**

### **Authentication**
- `POST /api/users/register` - Register with UUID
- `POST /api/users/login` - JWT authentication
- `GET /api/users/:id` - Get profile by UUID

### **Location Tracking**
- `POST /api/locations` - Save GPS with PostGIS
- `GET /api/locations/latest/:id` - Latest location
- `GET /api/locations/history/:id` - Location history

### **Emergency System**
- `POST /api/sos` - Trigger emergency SOS
- `POST /api/voice/sos` - Upload voice messages
- `GET /api/alerts` - Get all alerts
- `PUT /api/alerts/resolve/:id` - Resolve alert

### **Geofencing**
- `POST /api/geofences` - Create geo-fence
- `GET /api/geofences` - List all fences
- `GET /api/geofences/check/:id` - Check location

## 🤖 **ML Integration**

### **Risk Scoring Service**
- **Endpoint**: `POST /risk-score`
- **Input**: GPS points with timestamps
- **Output**: Risk score (0-1), alerts, features
- **Model**: Isolation Forest for anomaly detection

### **Features Extracted**
- Speed variance, max stops, missing updates
- Total distance, straightness ratio
- Bearing change variance, route deviation

## ⛓️ **Blockchain Integration**

### **Smart Contract Features**
- **ERC721 Soulbound tokens** for digital identity
- **Role-based access** (Admin, Issuer, Responder)
- **KYC verification** with hash-based system
- **Panic system** for emergency states
- **Safety score tracking** on-chain

## 🐳 **Docker Deployment**

### **Quick Docker Setup**
```bash
# Start with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### **Services Included**
- PostgreSQL with PostGIS
- Smart Tourist API
- Redis cache (optional)

## 🔐 **Security Features**

- **Helmet** - Security headers
- **Rate limiting** - API abuse prevention
- **CORS** - Cross-origin security
- **JWT authentication** - Secure token-based auth
- **bcrypt passwords** - Encrypted password storage
- **Input validation** - Request sanitization

## 📊 **Production Features**

- **Graceful shutdown** - Clean server termination
- **Error handling** - Comprehensive error management
- **Logging** - Request/response logging
- **Health checks** - System monitoring
- **Database pooling** - Efficient connections
- **Compression** - Response compression

## 🎯 **Next Steps**

1. **Setup Database**: Run `npm run setup:db`
2. **Configure Environment**: Copy config to `.env`
3. **Start API**: Run `npm start`
4. **Test System**: Run `npm run test:api`
5. **Deploy**: Use Docker or your preferred method

Your Smart Tourist API is now **production-ready** with a clean, organized structure! 🚀

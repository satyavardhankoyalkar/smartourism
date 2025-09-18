# Smart Tourist API

A comprehensive API for tourist safety and emergency management with real-time location tracking, geofencing, and emergency alert systems.

## Features

- 🚨 **Emergency SOS System** - Voice, text, and one-tap emergency alerts
- 📍 **Real-time Location Tracking** - GPS tracking with AI-powered risk assessment
- 🗺️ **Geofencing** - Define safe/unsafe zones with automatic alerts
- 🏥 **Medical Information** - Store and access medical data for emergency responders
- 📱 **Multi-channel Communication** - SMS, voice, and in-app notifications
- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 🌐 **Blockchain Integration** - Optional blockchain-based digital identity verification
- 📊 **Analytics & Reporting** - Comprehensive alert and location analytics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with PostGIS extension
- **Authentication**: JWT tokens with bcrypt
- **File Upload**: Multer for voice recordings
- **Security**: Helmet, CORS, Rate limiting
- **Blockchain**: Smart contracts for digital identity

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12+ with PostGIS extension
- npm or yarn package manager

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd smart-tourist-api
npm install
```

### 2. Database Setup

```bash
# Install PostgreSQL and PostGIS
# On Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib postgis

# On macOS with Homebrew:
brew install postgresql postgis

# Create database and user
sudo -u postgres psql
CREATE DATABASE smart_tourism;
CREATE USER smart_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_tourism TO smart_user;
\q
```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_tourism
DB_USER=smart_user
DB_PASS=your_password
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 4. Database Schema Setup

```bash
# Run the database setup script
psql -U smart_user -d smart_tourism -f setup-db.sql
```

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Test database connection
npm test
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new tourist
- `POST /api/users/login` - Login tourist
- `GET /api/users/:id` - Get tourist profile

### Location Tracking
- `POST /api/locations` - Save GPS location
- `GET /api/locations/latest/:tourist_id` - Get latest location
- `GET /api/locations/history/:tourist_id` - Get location history

### Emergency & Alerts
- `POST /api/sos` - Trigger emergency SOS
- `POST /api/voice/sos` - Upload voice SOS message
- `GET /api/alerts` - Get all active alerts
- `PUT /api/alerts/resolve/:id` - Resolve alert

### Geofencing
- `POST /api/geofences` - Create geo-fence
- `GET /api/geofences` - Get all geo-fences
- `GET /api/geofences/check/:tourist_id` - Check location against fences

### Medical Information
- `POST /api/medical` - Save medical info
- `GET /api/medical/:tourist_id` - Get medical info

### Trip Management
- `POST /api/trips/create` - Create/update trip itinerary
- `GET /api/trips/:id` - Get trip details

### Communication
- `POST /api/sms/fallback` - SMS fallback endpoint
- `POST /api/responses` - Authority response to alerts
- `GET /api/responses/:alert_id` - Get responses for alert

## Database Schema

### Core Tables

- **tourist** - User profiles with emergency contacts
- **locations** - GPS coordinates with PostGIS geometry
- **alerts** - Emergency alerts and notifications
- **geo_fences** - Geographic boundaries with risk levels
- **medical_info** - Medical data for emergency responders
- **authority_responses** - Emergency service responses

### Key Features

- **PostGIS Integration** - Full geospatial support for location queries
- **JSONB Fields** - Flexible storage for itineraries and emergency contacts
- **Automatic Timestamps** - Created/updated timestamps with triggers
- **Spatial Indexes** - Optimized queries for location-based operations

## Security Features

- **Helmet** - Security headers
- **Rate Limiting** - Prevent API abuse
- **CORS Configuration** - Cross-origin request security
- **Input Validation** - Request validation and sanitization
- **Password Hashing** - bcrypt for secure password storage
- **JWT Authentication** - Secure token-based authentication

## Development

### Project Structure

```
smart-tourist-api/
├── routes/           # API route handlers
├── blockchain/       # Smart contracts and deployment
├── hackathon/        # ML models and data analysis
├── uploads/          # File upload directory
├── tests/            # Test files
├── server.js         # Main application entry point
├── db.js            # Database connection
├── setup-db.sql     # Database schema setup
└── package.json     # Dependencies and scripts
```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Test database connection
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Adding New Features

1. Create route handler in `routes/` directory
2. Import and register route in `server.js`
3. Add corresponding database table if needed
4. Update API documentation

## Blockchain Integration

The project includes smart contracts for digital identity verification:

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js
```

## AI/ML Integration

The hackathon directory contains ML models for risk assessment:

```bash
cd hackathon
pip install -r requirements.txt
python api.py  # Start ML service
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
DB_SSL=true
JWT_SECRET=your_very_secure_secret_key
CORS_ORIGIN=https://yourdomain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## Roadmap

- [ ] Real-time WebSocket connections
- [ ] Advanced ML risk scoring
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with emergency services APIs

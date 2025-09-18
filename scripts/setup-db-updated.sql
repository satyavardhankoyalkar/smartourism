-- Updated Smart Tourist API Database Setup
-- Based on your requirements with UUID support and proper schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the tourist table with UUID primary key
CREATE TABLE IF NOT EXISTS tourist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  kyc_hash VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  gender VARCHAR(10),
  age INT,
  address TEXT,
  itinerary JSONB,
  emergency_contacts JSONB,
  digital_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  tourist_id UUID REFERENCES tourist(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  route JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create locations table with PostGIS geometry
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  tourist_id UUID REFERENCES tourist(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  geom GEOMETRY(POINT, 4326),
  risk_score INTEGER,
  risk_label TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  tourist_id UUID REFERENCES tourist(id) ON DELETE CASCADE,
  type TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create geo_fences table with PostGIS polygons
CREATE TABLE IF NOT EXISTS geo_fences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  risk_level VARCHAR(20),
  area GEOMETRY(POLYGON, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create medical_info table
CREATE TABLE IF NOT EXISTS medical_info (
  id SERIAL PRIMARY KEY,
  tourist_id UUID REFERENCES tourist(id) ON DELETE CASCADE,
  allergies TEXT,
  conditions TEXT,
  medications TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create authority_responses table
CREATE TABLE IF NOT EXISTS authority_responses (
  id SERIAL PRIMARY KEY,
  alert_id INT REFERENCES alerts(id) ON DELETE CASCADE,
  response TEXT,
  mode VARCHAR(20), -- text / voice
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tourist_email ON tourist(email);
CREATE INDEX IF NOT EXISTS idx_tourist_status ON tourist(status);
CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations(tourist_id);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_tourist_id ON alerts(tourist_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_geo_fences_area ON geo_fences USING GIST (area);
CREATE INDEX IF NOT EXISTS idx_trips_tourist_id ON trips(tourist_id);
CREATE INDEX IF NOT EXISTS idx_medical_info_tourist_id ON medical_info(tourist_id);
CREATE INDEX IF NOT EXISTS idx_authority_responses_alert_id ON authority_responses(alert_id);

-- Create function to automatically set geometry from lat/lon
CREATE OR REPLACE FUNCTION set_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to automatically set geometry
DROP TRIGGER IF EXISTS set_location_geom ON locations;
CREATE TRIGGER set_location_geom BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION set_location_geometry();

-- Insert sample data for testing
INSERT INTO tourist (id, name, email, password, kyc_hash, mobile, gender, age, address, emergency_contacts, digital_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Test Tourist', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kyc_hash_123', '+1234567890', 'male', 30, '123 Main St, New York', '[{"name": "Jane Doe", "phone": "+1234567891", "relation": "spouse"}]', 'DIG123456')
ON CONFLICT (email) DO NOTHING;

-- Insert sample geo-fences
INSERT INTO geo_fences (name, risk_level, area) VALUES
('Central Park - Safe Zone', 'low', 
 ST_GeomFromText('POLYGON((-73.9730 40.7648, -73.9580 40.7648, -73.9580 40.7990, -73.9730 40.7990, -73.9730 40.7648))', 4326)),
('Times Square - Medium Risk', 'medium',
 ST_GeomFromText('POLYGON((-73.9881 40.7589, -73.9851 40.7589, -73.9851 40.7619, -73.9881 40.7619, -73.9881 40.7589))', 4326))
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW tourist_with_latest_location AS
SELECT 
    t.*,
    l.lat as last_lat,
    l.lon as last_lon,
    l.risk_score as last_risk_score,
    l.risk_label as last_risk_label,
    l.created_at as last_location_time
FROM tourist t
LEFT JOIN LATERAL (
    SELECT lat, lon, risk_score, risk_label, created_at
    FROM locations 
    WHERE tourist_id = t.id 
    ORDER BY created_at DESC 
    LIMIT 1
) l ON true;

CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT 
    a.id,
    a.tourist_id,
    t.name as tourist_name,
    t.email as tourist_email,
    t.mobile as tourist_mobile,
    a.type,
    a.description,
    a.status,
    a.created_at,
    COUNT(ar.id) as response_count
FROM alerts a
JOIN tourist t ON a.tourist_id = t.id
LEFT JOIN authority_responses ar ON a.id = ar.alert_id
WHERE a.status = 'open'
GROUP BY a.id, a.tourist_id, t.name, t.email, t.mobile, a.type, a.description, a.status, a.created_at
ORDER BY a.created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE tourist IS 'Main tourist/user table with UUID primary key and profile information';
COMMENT ON TABLE trips IS 'Trip itineraries and route information';
COMMENT ON TABLE locations IS 'GPS location tracking with PostGIS geometry and risk scoring';
COMMENT ON TABLE alerts IS 'Emergency alerts and notifications from tourists';
COMMENT ON TABLE geo_fences IS 'Geographic boundaries with risk levels using PostGIS polygons';
COMMENT ON TABLE medical_info IS 'Medical information for emergency responders';
COMMENT ON TABLE authority_responses IS 'Responses from emergency services to alerts';

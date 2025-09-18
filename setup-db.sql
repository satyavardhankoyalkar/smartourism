-- Smart Tourist API Database Setup
-- Run this script to create all required tables and extensions

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the tourist table
CREATE TABLE IF NOT EXISTS tourist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    kyc_hash VARCHAR(255),
    mobile VARCHAR(20),
    gender VARCHAR(10),
    age INTEGER,
    address TEXT,
    itinerary JSONB DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]',
    digital_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create locations table with PostGIS geometry
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    tourist_id INTEGER REFERENCES tourist(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lon DECIMAL(11, 8) NOT NULL,
    geom GEOMETRY(POINT, 4326),
    risk_score DECIMAL(3, 2),
    risk_label VARCHAR(50) DEFAULT 'safe',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for locations
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations (tourist_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations (timestamp);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    tourist_id INTEGER REFERENCES tourist(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'panic', 'medical', 'lost', 'geo-fence', 'anomaly', 'voice'
    description TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_tourist_id ON alerts (tourist_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at);

-- Create geo_fences table with PostGIS polygons
CREATE TABLE IF NOT EXISTS geo_fences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    area GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for geo_fences
CREATE INDEX IF NOT EXISTS idx_geo_fences_area ON geo_fences USING GIST (area);

-- Create medical_info table
CREATE TABLE IF NOT EXISTS medical_info (
    id SERIAL PRIMARY KEY,
    tourist_id INTEGER REFERENCES tourist(id) ON DELETE CASCADE UNIQUE,
    allergies TEXT,
    conditions TEXT,
    medications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create authority_responses table
CREATE TABLE IF NOT EXISTS authority_responses (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    mode VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'sms'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_authority_responses_alert_id ON authority_responses (alert_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_tourist_updated_at BEFORE UPDATE ON tourist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at BEFORE UPDATE ON medical_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set geometry from lat/lon
CREATE OR REPLACE FUNCTION set_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to automatically set geometry
CREATE TRIGGER set_location_geom BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION set_location_geometry();

-- Insert sample geo-fences (example areas in New York)
INSERT INTO geo_fences (name, risk_level, area) VALUES
('Central Park - Safe Zone', 'low', 
 ST_GeomFromText('POLYGON((-73.9730 40.7648, -73.9580 40.7648, -73.9580 40.7990, -73.9730 40.7990, -73.9730 40.7648))', 4326)),
('Times Square - Medium Risk', 'medium',
 ST_GeomFromText('POLYGON((-73.9881 40.7589, -73.9851 40.7589, -73.9851 40.7619, -73.9881 40.7619, -73.9881 40.7589))', 4326))
ON CONFLICT DO NOTHING;

-- Insert sample tourist for testing (password: 'password123')
INSERT INTO tourist (name, email, password, mobile, gender, age, address, emergency_contacts, digital_id) VALUES
('John Doe', 'john@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567890', 'male', 30, '123 Main St, New York', '[{"name": "Jane Doe", "phone": "+1234567891", "relation": "spouse"}]', 'DIG123456')
ON CONFLICT (email) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW tourist_with_latest_location AS
SELECT 
    t.*,
    l.lat as last_lat,
    l.lon as last_lon,
    l.risk_score as last_risk_score,
    l.risk_label as last_risk_label,
    l.timestamp as last_location_time
FROM tourist t
LEFT JOIN LATERAL (
    SELECT lat, lon, risk_score, risk_label, timestamp
    FROM locations 
    WHERE tourist_id = t.id 
    ORDER BY timestamp DESC 
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

COMMENT ON TABLE tourist IS 'Main tourist/user table with profile information';
COMMENT ON TABLE locations IS 'GPS location tracking with PostGIS geometry and risk scoring';
COMMENT ON TABLE alerts IS 'Emergency alerts and notifications from tourists';
COMMENT ON TABLE geo_fences IS 'Geographic boundaries with risk levels using PostGIS polygons';
COMMENT ON TABLE medical_info IS 'Medical information for emergency responders';
COMMENT ON TABLE authority_responses IS 'Responses from emergency services to alerts';

// Mock database for testing without PostgreSQL
// This allows the API to run and be tested without a database connection

class MockDatabase {
  constructor() {
    this.data = {
      tourists: new Map(),
      locations: new Map(),
      alerts: new Map(),
      geo_fences: new Map(),
      medical_info: new Map(),
      authority_responses: new Map()
    };
    this.counters = {
      tourists: 1,
      locations: 1,
      alerts: 1,
      geo_fences: 1,
      medical_info: 1,
      authority_responses: 1
    };
    
    // Add some sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample tourist
    const touristId = this.counters.tourists++;
    this.data.tourists.set(touristId, {
      id: touristId,
      name: 'Test Tourist',
      email: 'test@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
      mobile: '+1234567890',
      gender: 'male',
      age: 25,
      address: '123 Test St',
      itinerary: {},
      emergency_contacts: [{ name: 'Emergency Contact', phone: '+1234567891', relation: 'friend' }],
      digital_id: 'DIG123456',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Sample location
    const locationId = this.counters.locations++;
    this.data.locations.set(locationId, {
      id: locationId,
      tourist_id: touristId,
      lat: 40.7128,
      lon: -74.0060,
      risk_score: 0.3,
      risk_label: 'safe',
      timestamp: new Date()
    });

    // Sample geo-fence
    const fenceId = this.counters.geo_fences++;
    this.data.geo_fences.set(fenceId, {
      id: fenceId,
      name: 'Test High Risk Area',
      risk_level: 'high',
      area: 'POLYGON((-74.0060 40.7128, -74.0050 40.7128, -74.0050 40.7138, -74.0060 40.7138, -74.0060 40.7128))',
      created_at: new Date()
    });
  }

  async query(sql, params = []) {
    console.log('Mock DB Query:', sql.substring(0, 100) + '...');
    
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const sqlLower = sql.toLowerCase();
    
    // Handle different query types
    if (sqlLower.includes('select') && sqlLower.includes('tourist')) {
      return this.handleSelectTourist(sql, params);
    } else if (sqlLower.includes('insert') && sqlLower.includes('tourist')) {
      return this.handleInsertTourist(sql, params);
    } else if (sqlLower.includes('select') && sqlLower.includes('locations')) {
      return this.handleSelectLocations(sql, params);
    } else if (sqlLower.includes('insert') && sqlLower.includes('locations')) {
      return this.handleInsertLocations(sql, params);
    } else if (sqlLower.includes('select') && sqlLower.includes('alerts')) {
      return this.handleSelectAlerts(sql, params);
    } else if (sqlLower.includes('insert') && sqlLower.includes('alerts')) {
      return this.handleInsertAlerts(sql, params);
    } else if (sqlLower.includes('select') && sqlLower.includes('geo_fences')) {
      return this.handleSelectGeoFences(sql, params);
    } else if (sqlLower.includes('insert') && sqlLower.includes('geo_fences')) {
      return this.handleInsertGeoFences(sql, params);
    } else if (sqlLower.includes('select') && sqlLower.includes('medical_info')) {
      return this.handleSelectMedicalInfo(sql, params);
    } else if (sqlLower.includes('insert') && sqlLower.includes('medical_info')) {
      return this.handleInsertMedicalInfo(sql, params);
    } else if (sqlLower.includes('update')) {
      return this.handleUpdate(sql, params);
    } else {
      // Default response for unknown queries
      return { rows: [], rowCount: 0 };
    }
  }

  handleSelectTourist(sql, params) {
    const rows = Array.from(this.data.tourists.values());
    if (params.length > 0) {
      const filtered = rows.filter(row => row.id === params[0] || row.email === params[0]);
      return { rows: filtered, rowCount: filtered.length };
    }
    return { rows, rowCount: rows.length };
  }

  handleInsertTourist(sql, params) {
    const id = this.counters.tourists++;
    const [name, password, email, kyc_hash, mobile, gender, age, address, itinerary, emergency_contacts, digital_id] = params;
    
    const tourist = {
      id,
      name,
      password, // Store hashed password
      email,
      mobile,
      gender,
      age,
      address,
      itinerary: JSON.parse(itinerary || '{}'),
      emergency_contacts: JSON.parse(emergency_contacts || '[]'),
      digital_id,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.data.tourists.set(id, tourist);
    return { rows: [tourist], rowCount: 1 };
  }

  handleSelectLocations(sql, params) {
    const rows = Array.from(this.data.locations.values());
    if (params.length > 0) {
      const filtered = rows.filter(row => row.tourist_id === params[0]);
      if (sql.includes('ORDER BY timestamp DESC LIMIT 1')) {
        return { rows: filtered.slice(-1), rowCount: 1 };
      }
      return { rows: filtered, rowCount: filtered.length };
    }
    return { rows, rowCount: rows.length };
  }

  handleInsertLocations(sql, params) {
    const id = this.counters.locations++;
    const [tourist_id, lat, lon, risk_score, risk_label] = params;
    
    const location = {
      id,
      tourist_id,
      lat,
      lon,
      risk_score: risk_score || null,
      risk_label: risk_label || 'safe',
      timestamp: new Date()
    };
    
    this.data.locations.set(id, location);
    return { rows: [location], rowCount: 1 };
  }

  handleSelectAlerts(sql, params) {
    const rows = Array.from(this.data.alerts.values());
    if (params.length > 0) {
      const filtered = rows.filter(row => row.tourist_id === params[0]);
      return { rows: filtered, rowCount: filtered.length };
    }
    return { rows, rowCount: rows.length };
  }

  handleInsertAlerts(sql, params) {
    const id = this.counters.alerts++;
    const [tourist_id, type, description] = params;
    
    const alert = {
      id,
      tourist_id,
      type,
      description: description || '',
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.data.alerts.set(id, alert);
    return { rows: [alert], rowCount: 1 };
  }

  handleSelectGeoFences(sql, params) {
    const rows = Array.from(this.data.geo_fences.values());
    return { rows, rowCount: rows.length };
  }

  handleInsertGeoFences(sql, params) {
    const id = this.counters.geo_fences++;
    const [name, risk_level, area] = params;
    
    const fence = {
      id,
      name,
      risk_level,
      area,
      created_at: new Date()
    };
    
    this.data.geo_fences.set(id, fence);
    return { rows: [fence], rowCount: 1 };
  }

  handleSelectMedicalInfo(sql, params) {
    const rows = Array.from(this.data.medical_info.values());
    if (params.length > 0) {
      const filtered = rows.filter(row => row.tourist_id === params[0]);
      return { rows: filtered, rowCount: filtered.length };
    }
    return { rows, rowCount: rows.length };
  }

  handleInsertMedicalInfo(sql, params) {
    const id = this.counters.medical_info++;
    const [tourist_id, allergies, conditions, medications] = params;
    
    const medical = {
      id,
      tourist_id,
      allergies,
      conditions,
      medications,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.data.medical_info.set(id, medical);
    return { rows: [medical], rowCount: 1 };
  }

  handleUpdate(sql, params) {
    // Mock update - just return the first parameter as updated record
    if (params.length > 0) {
      return { rows: [{ id: params[0], updated: true }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  async connect() {
    console.log('✅ Connected to Mock Database (no PostgreSQL required)');
    return this;
  }
}

// Create mock pool that mimics pg.Pool
export const pool = {
  query: async (sql, params) => {
    const mockDb = new MockDatabase();
    return await mockDb.query(sql, params);
  },
  connect: async () => {
    const mockDb = new MockDatabase();
    return await mockDb.connect();
  }
};

console.log('🗄️ Using Mock Database - API will work without PostgreSQL!');

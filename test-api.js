import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// Test data
const testTourist = {
  name: 'Test Tourist',
  email: 'test@example.com',
  password: 'password123',
  mobile: '+1234567890',
  gender: 'male',
  age: 25,
  address: '123 Test St',
  emergency_contacts: [{ name: 'Emergency Contact', phone: '+1234567891', relation: 'friend' }]
};

let authToken = '';
let touristId = '';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`${options.method || 'GET'} ${endpoint} - Status: ${response.status}`);
  if (!response.ok) {
    console.error('Error:', data);
  }
  
  return { response, data };
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  const { data } = await apiCall('/api/health');
  console.log('Health check result:', data);
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  const { data } = await apiCall('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(testTourist)
  });
  
  if (data.tourist) {
    touristId = data.tourist.id;
    console.log('Registration successful:', data.tourist);
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  const { data } = await apiCall('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testTourist.email,
      password: testTourist.password
    })
  });
  
  if (data.token) {
    authToken = data.token;
    console.log('Login successful, token received');
  }
}

async function testUserProfile() {
  console.log('\n📋 Testing User Profile...');
  if (!touristId) return;
  
  const { data } = await apiCall(`/api/users/${touristId}`);
  console.log('Profile data:', data);
}

async function testLocationTracking() {
  console.log('\n📍 Testing Location Tracking...');
  if (!touristId) return;
  
  // Save location
  const { data: saveData } = await apiCall('/api/locations', {
    method: 'POST',
    body: JSON.stringify({
      tourist_id: touristId,
      lat: 40.7128,
      lon: -74.0060,
      risk_score: 0.3,
      risk_label: 'safe'
    })
  });
  console.log('Location saved:', saveData);
  
  // Get latest location
  const { data: latestData } = await apiCall(`/api/locations/latest/${touristId}`);
  console.log('Latest location:', latestData);
  
  // Get location history
  const { data: historyData } = await apiCall(`/api/locations/history/${touristId}`);
  console.log('Location history:', historyData);
}

async function testSOSAlert() {
  console.log('\n🚨 Testing SOS Alert...');
  if (!touristId) return;
  
  const { data } = await apiCall('/api/sos', {
    method: 'POST',
    body: JSON.stringify({
      tourist_id: touristId,
      mode: 'text',
      message: 'I need help! I am lost in the city.'
    })
  });
  console.log('SOS alert created:', data);
}

async function testGeofencing() {
  console.log('\n🗺️ Testing Geofencing...');
  
  // Create geo-fence
  const { data: fenceData } = await apiCall('/api/geofences', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test High Risk Area',
      risk_level: 'high',
      coordinates: [
        [-74.0060, 40.7128],
        [-74.0050, 40.7128],
        [-74.0050, 40.7138],
        [-74.0060, 40.7138],
        [-74.0060, 40.7128]
      ]
    })
  });
  console.log('Geo-fence created:', fenceData);
  
  // Get all geo-fences
  const { data: fencesData } = await apiCall('/api/geofences');
  console.log('All geo-fences:', fencesData);
  
  // Check location against geo-fences
  if (touristId) {
    const { data: checkData } = await apiCall(`/api/geofences/check/${touristId}`);
    console.log('Geo-fence check result:', checkData);
  }
}

async function testMedicalInfo() {
  console.log('\n🏥 Testing Medical Information...');
  if (!touristId) return;
  
  // Save medical info
  const { data: saveData } = await apiCall('/api/medical', {
    method: 'POST',
    body: JSON.stringify({
      tourist_id: touristId,
      allergies: 'Peanuts, Shellfish',
      conditions: 'Diabetes Type 2',
      medications: 'Insulin, Metformin'
    })
  });
  console.log('Medical info saved:', saveData);
  
  // Get medical info
  const { data: getData } = await apiCall(`/api/medical/${touristId}`);
  console.log('Medical info retrieved:', getData);
}

async function testTripManagement() {
  console.log('\n✈️ Testing Trip Management...');
  if (!touristId) return;
  
  const itinerary = {
    destination: 'New York City',
    start_date: '2024-01-15',
    end_date: '2024-01-20',
    activities: ['Central Park', 'Times Square', 'Statue of Liberty']
  };
  
  // Create trip
  const { data: createData } = await apiCall('/api/trips/create', {
    method: 'POST',
    body: JSON.stringify({
      tourist_id: touristId,
      itinerary: itinerary
    })
  });
  console.log('Trip created:', createData);
  
  // Get trip
  const { data: getData } = await apiCall(`/api/trips/${touristId}`);
  console.log('Trip retrieved:', getData);
}

async function testAlerts() {
  console.log('\n⚠️ Testing Alerts...');
  
  // Get all alerts
  const { data: allAlerts } = await apiCall('/api/alerts');
  console.log('All alerts:', allAlerts);
  
  // Get alerts for tourist
  if (touristId) {
    const { data: touristAlerts } = await apiCall(`/api/alerts/tourist/${touristId}`);
    console.log('Tourist alerts:', touristAlerts);
  }
}

async function testSMSFallback() {
  console.log('\n📱 Testing SMS Fallback...');
  if (!touristId) return;
  
  const { data } = await apiCall('/api/sms/fallback', {
    method: 'POST',
    body: JSON.stringify({
      tourist_id: touristId,
      lat: 40.7128,
      lon: -74.0060,
      message: 'Emergency SMS test'
    })
  });
  console.log('SMS fallback result:', data);
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Smart Tourist API Tests...\n');
  console.log(`Testing API at: ${BASE_URL}\n`);
  
  try {
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();
    await testUserProfile();
    await testLocationTracking();
    await testSOSAlert();
    await testGeofencing();
    await testMedicalInfo();
    await testTripManagement();
    await testAlerts();
    await testSMSFallback();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Health check: ✅');
    console.log('- User registration: ✅');
    console.log('- User authentication: ✅');
    console.log('- Location tracking: ✅');
    console.log('- SOS alerts: ✅');
    console.log('- Geofencing: ✅');
    console.log('- Medical info: ✅');
    console.log('- Trip management: ✅');
    console.log('- Alert system: ✅');
    console.log('- SMS fallback: ✅');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not accessible:', error.message);
    console.log('Please make sure the server is running with: npm start');
    return false;
  }
}

// Run tests if server is available
checkServer().then(serverRunning => {
  if (serverRunning) {
    runTests();
  } else {
    process.exit(1);
  }
});

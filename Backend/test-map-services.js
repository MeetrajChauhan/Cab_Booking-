/**
 * Quick Test Suite for OpenStreetMap Integration
 * Run this file to verify all map services are working correctly
 * 
 * Usage: node test-map-services.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/map';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(colors.green, `✓ ${message}`);
}

function logError(message) {
  log(colors.red, `✗ ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ ${message}`);
}

function logTest(message) {
  log(colors.yellow, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(colors.yellow, `Test: ${message}`);
  log(colors.yellow, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

// ========================================
// Test Cases
// ========================================

async function testGeocoding() {
  logTest('Geocoding - Address to Coordinates');

  try {
    logInfo('Requesting coordinates for "Times Square, New York"...');
    
    const response = await axios.get(`${BASE_URL}/get-coordinates`, {
      params: {
        address: 'Times Square, New York',
      },
      timeout: 15000,
    });

    if (response.data.success && response.data.data) {
      const { ltd, lng, display_name } = response.data.data;
      logSuccess('Geocoding works!');
      logInfo(`Address: ${display_name}`);
      logInfo(`Coordinates: ${ltd}, ${lng}`);
      return true;
    } else {
      logError('Unexpected response format');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    logError(`Geocoding failed: ${error.message}`);
    return false;
  }
}

async function testDistanceTime() {
  logTest('Routing - Distance & Duration');

  try {
    logInfo('Requesting distance between "Times Square" and "Brooklyn Bridge"...');
    
    const response = await axios.get(`${BASE_URL}/get-distance-time`, {
      params: {
        origin: 'Times Square, New York',
        destination: 'Brooklyn Bridge, New York',
      },
      timeout: 15000,
    });

    if (response.data.success && response.data.data) {
      const { distance, duration } = response.data.data;
      logSuccess('Distance & Duration calculation works!');
      logInfo(`Distance: ${distance.text} (${distance.value} meters)`);
      logInfo(`Duration: ${duration.text} (${duration.value} seconds)`);
      
      // Calculate estimated fare
      const distanceKm = distance.value / 1000;
      const durationMin = duration.value / 60;
      const baseFare = 50;
      const perKmRate = 15;
      const perMinRate = 3;
      const estimatedFare = Math.round(baseFare + (distanceKm * perKmRate) + (durationMin * perMinRate));
      
      logInfo(`Estimated Car Fare: ₹${estimatedFare}`);
      return true;
    } else {
      logError('Unexpected response format');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    logError(`Distance/Duration failed: ${error.message}`);
    return false;
  }
}

async function testAutocomplete() {
  logTest('Autocomplete - Location Suggestions');

  try {
    logInfo('Requesting suggestions for "times"...');
    
    const response = await axios.get(`${BASE_URL}/get-suggestions`, {
      params: {
        input: 'times',
      },
      timeout: 15000,
    });

    if (response.data.success && Array.isArray(response.data.data)) {
      logSuccess('Autocomplete works!');
      logInfo(`Found ${response.data.data.length} suggestions:`);
      response.data.data.slice(0, 3).forEach((suggestion, index) => {
        logInfo(`  ${index + 1}. ${suggestion}`);
      });
      return true;
    } else {
      logError('Unexpected response format');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    logError(`Autocomplete failed: ${error.message}`);
    return false;
  }
}

async function testReverseGeocode() {
  logTest('Reverse Geocoding - Coordinates to Address');

  try {
    logInfo('Requesting address for coordinates (40.7128, -74.0060)...');
    
    // Note: This endpoint might not be exposed via HTTP
    // Testing the service directly
    const mapService = require('./services/map.service');
    const address = await mapService.getReverseGeocode(40.7128, -74.0060);
    
    logSuccess('Reverse geocoding works!');
    logInfo(`Address: ${address}`);
    return true;
  } catch (error) {
    logError(`Reverse geocoding failed: ${error.message}`);
    return false;
  }
}

async function testHaversineDistance() {
  logTest('Haversine Distance - Local Calculation');

  try {
    logInfo('Testing local distance calculation (no API call)...');
    
    // Test service directly
    const mapService = require('./services/map.service');
    
    // Times Square to Brooklyn Bridge (approximate)
    const distance = mapService.calculateDistance(
      40.7580, -73.9855,  // Times Square
      40.7061, -73.9969   // Brooklyn Bridge
    );
    
    logSuccess('Haversine distance calculation works!');
    logInfo(`Distance: ${distance.toFixed(2)} km`);
    logInfo(`(Note: This is straight-line distance, OSRM gives actual route distance)`);
    return true;
  } catch (error) {
    logError(`Haversine calculation failed: ${error.message}`);
    return false;
  }
}

async function testErrorHandling() {
  logTest('Error Handling - Invalid Inputs');

  try {
    logInfo('Testing with empty address parameter...');
    
    const response = await axios
      .get(`${BASE_URL}/get-coordinates`, {
        params: { address: '' },
        timeout: 10000,
      })
      .catch((error) => error.response);

    if (response && response.status === 400) {
      logSuccess('Error handling works - returns 400 for invalid input');
      logInfo(`Error message: ${response.data.message}`);
      return true;
    } else {
      logError('Unexpected error response');
      return false;
    }
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
    return false;
  }
}

// ========================================
// Main Test Runner
// ========================================

async function runAllTests() {
  logInfo('Starting Map Service Tests...\n');

  const results = [];

  logInfo('Make sure your backend server is running on http://localhost:3000');
  logInfo('Press Ctrl+C to stop\n');

  // Give server time to start if needed
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Test 1: Geocoding
    results.push({
      name: 'Geocoding',
      passed: await testGeocoding(),
    });

    // Test 2: Distance & Time
    results.push({
      name: 'Distance & Duration',
      passed: await testDistanceTime(),
    });

    // Test 3: Autocomplete
    results.push({
      name: 'Autocomplete',
      passed: await testAutocomplete(),
    });

    // Test 4: Error Handling
    results.push({
      name: 'Error Handling',
      passed: await testErrorHandling(),
    });

    // Print Summary
    logTest('TEST SUMMARY');
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    results.forEach((result) => {
      const status = result.passed ? '✓' : '✗';
      const color = result.passed ? colors.green : colors.red;
      log(color, `${status} ${result.name}`);
    });

    logTest(`RESULTS: ${passed}/${total} tests passed`);

    if (passed === total) {
      logSuccess('\n🎉 All tests passed! Your OpenStreetMap integration is working correctly!\n');
      process.exit(0);
    } else {
      logError(`\n⚠️  ${total - passed} test(s) failed. Check the errors above.\n`);
      process.exit(1);
    }
  } catch (error) {
    logError(`Unexpected error during tests: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runAllTests();

/**
 * Smoke Tests
 * 
 * Basic tests to verify system is running correctly
 * Tests: /api/health, /api/status, /api/mock/*, /api/schema/property
 */

import axios from 'axios';

// ========================================
// CONFIGURATION
// ========================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 5000; // 5 seconds

// ========================================
// TEST UTILITIES
// ========================================

let passedTests = 0;
let failedTests = 0;

function logTest(name, passed, message = '') {
  if (passed) {
    console.log(`✅ ${name}`);
    passedTests++;
  } else {
    console.log(`❌ ${name}: ${message}`);
    failedTests++;
  }
}

async function testEndpoint(name, path, expectedStatus = 200) {
  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      timeout: TIMEOUT,
      validateStatus: () => true // Don't throw on any status
    });
    
    const passed = response.status === expectedStatus;
    logTest(name, passed, `Expected ${expectedStatus}, got ${response.status}`);
    
    return { passed, response };
  } catch (error) {
    logTest(name, false, error.message);
    return { passed: false, error };
  }
}

// ========================================
// TESTS
// ========================================

async function runSmokeTests() {
  console.log('\n🧪 Running Smoke Tests...\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Test 1: Health check
  await testEndpoint('Health Check', '/api/health');
  
  // Test 2: Status endpoint
  const statusResult = await testEndpoint('Status Endpoint', '/api/status');
  if (statusResult.passed && statusResult.response) {
    const data = statusResult.response.data;
    
    // Verify status structure
    logTest(
      'Status has OFFLINE_MODE',
      typeof data.OFFLINE_MODE === 'boolean',
      'OFFLINE_MODE not found or not boolean'
    );
    
    logTest(
      'Status has timestamp',
      typeof data.timestamp === 'string',
      'timestamp not found or not string'
    );
    
    // Verify no secrets are exposed
    const jsonStr = JSON.stringify(data);
    const hasSecrets = jsonStr.includes('AIza') || jsonStr.includes('sk-') || jsonStr.includes('key');
    logTest(
      'Status does not expose secrets',
      !hasSecrets,
      'Possible secret values found in status response'
    );
  }
  
  // Test 3: Mock endpoints
  const mockEndpoints = [
    '/api/mock/property',
    '/api/mock/flood',
    '/api/mock/zoning',
    '/api/mock/road_access',
    '/api/mock/redflags'
  ];
  
  for (const endpoint of mockEndpoints) {
    const name = `Mock Endpoint ${endpoint}`;
    const result = await testEndpoint(name, endpoint);
    
    if (result.passed && result.response) {
      const data = result.response.data;
      
      // Verify _meta field
      logTest(
        `${name} has _meta`,
        data._meta && data._meta.source === 'mock',
        '_meta field missing or incorrect'
      );
    }
  }
  
  // Test 4: Property schema endpoint
  const schemaResult = await testEndpoint('Property Schema', '/api/schema/property');
  if (schemaResult.passed && schemaResult.response) {
    const data = schemaResult.response.data;
    
    logTest(
      'Schema has $schema',
      data.$schema !== undefined,
      '$schema field not found'
    );
    
    logTest(
      'Schema has properties',
      data.properties !== undefined,
      'properties field not found'
    );
  }
  
  // Test 5: Invalid endpoint returns 404
  await testEndpoint('Invalid Endpoint Returns 404', '/api/invalid-endpoint', 404);
  
  // ========================================
  // SUMMARY
  // ========================================
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:\n`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  Total: ${passedTests + failedTests}\n`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.\n');
    process.exit(1);
  }
}

// ========================================
// RUN TESTS
// ========================================

runSmokeTests().catch(error => {
  console.error('\n❌ Smoke tests failed with error:', error.message);
  process.exit(1);
});

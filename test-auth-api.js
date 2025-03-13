/**
 * Quick test script for auth API endpoints
 * Run with: node test-auth-api.js
 */

// Check if fetch is available
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.error("This script requires node-fetch. Install with: npm install node-fetch");
  process.exit(1);
}

const API_BASE = 'https://auth-user-api-production.up.railway.app';
const FRONTEND_URL = 'https://frontend-production-c2bc.up.railway.app';

async function testEndpoint(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Add default options
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Origin': FRONTEND_URL,
      ...options.headers
    },
    ...options
  };
  
  console.log(`Testing ${fetchOptions.method} ${url}`);
  
  try {
    const response = await fetch(url, fetchOptions);
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    let body;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('CORS Headers:', corsHeaders);
    console.log('Response:', body);
    console.log('-----------------------------------');
    return { success: response.ok, status: response.status, body, corsHeaders };
  } catch (error) {
    console.error(`Error accessing ${url}:`, error.message);
    console.log('-----------------------------------');
    return { success: false, error: error.message };
  }
}

async function testOptions(endpoint) {
  return testEndpoint(endpoint, { 
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });
}

async function runTests() {
  console.log('=== TESTING AUTH API ENDPOINTS ===');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`API Base URL: ${API_BASE}`);
  console.log('-----------------------------------');

  // Test basic health endpoints
  await testEndpoint('/');
  await testEndpoint('/health');
  await testEndpoint('/health-check');
  
  // Test auth endpoints
  await testEndpoint('/api/auth/status');
  await testOptions('/api/auth/status');
  await testEndpoint('/api/auth/debug');
  await testEndpoint('/api/auth/debug/cors');
  
  // Test OPTIONS for critical endpoints
  await testOptions('/api/auth/signin');
  await testOptions('/api/auth/google-token');
  
  console.log('=== TESTS COMPLETED ===');
}

// Run the tests
runTests().catch(err => {
  console.error('Test script failed:', err);
}); 
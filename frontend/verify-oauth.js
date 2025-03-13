/**
 * Verification script for OAuth and CORS configurations
 * 
 * This script tests various configurations to ensure:
 * 1. CORS is properly configured
 * 2. OAuth endpoints are reachable
 * 3. Callback URLs are properly configured
 * 
 * Run with: node verify-oauth.js
 */

const fetch = require('node-fetch');
const appJson = require('./app.json');

// Configuration
const config = {
  // Read from app.json
  backendUrl: appJson.expo.extra.backendUrl,
  frontendUrl: appJson.expo.extra.frontendUrl,
  googleClientId: appJson.expo.extra.googleClientId
};

// Test endpoints
const endpoints = [
  { name: 'CORS Test', url: `${config.backendUrl}/api/cors/test`, method: 'GET' },
  { name: 'Auth Status', url: `${config.backendUrl}/api/auth/status`, method: 'GET' },
  { name: 'Debug Endpoint', url: `${config.backendUrl}/api/auth/debug`, method: 'GET' },
  { name: 'CORS Preflight - Signup', url: `${config.backendUrl}/api/auth/signup`, method: 'OPTIONS',
    headers: {
      'Origin': config.frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  },
  { name: 'CORS Preflight - Google Token', url: `${config.backendUrl}/api/auth/google-token`, method: 'OPTIONS',
    headers: {
      'Origin': config.frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  }
];

// Helper function to format response for display
const formatResponse = (response) => {
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    corsHeaders: {
      'access-control-allow-origin': headers['access-control-allow-origin'],
      'access-control-allow-methods': headers['access-control-allow-methods'],
      'access-control-allow-headers': headers['access-control-allow-headers'],
      'access-control-allow-credentials': headers['access-control-allow-credentials']
    },
    allHeaders: headers
  };
};

// Main verification function
async function verifyConfiguration() {
  console.log('🔍 Verifying OAuth and CORS Configuration');
  console.log('=======================================');
  console.log('Backend URL:', config.backendUrl);
  console.log('Frontend URL:', config.frontendUrl);
  console.log('Google Client ID:', config.googleClientId);
  console.log('Redirect URI:', `${config.frontendUrl}/auth/google/callback`);
  console.log('=======================================\n');

  // Test each endpoint
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers
      });
      
      const formattedResponse = formatResponse(response);
      
      console.log('✅ Status:', formattedResponse.status, formattedResponse.statusText);
      console.log('📋 CORS Headers:');
      Object.entries(formattedResponse.corsHeaders).forEach(([key, value]) => {
        if (value) {
          console.log(`   - ${key}: ${value}`);
        }
      });
      
      if (endpoint.method === 'OPTIONS') {
        if (formattedResponse.corsHeaders['access-control-allow-origin']) {
          console.log('✅ CORS preflight request successful!');
        } else {
          console.log('❌ CORS preflight request failed! Missing CORS headers.');
        }
      }
      
      console.log('\n');
    } catch (error) {
      console.error('❌ Error testing endpoint:', error.message);
      console.log('\n');
    }
  }

  // Verify OAuth redirect
  console.log('🔗 Verifying Google OAuth redirect...');
  const googleRedirectUri = encodeURIComponent(`${config.frontendUrl}/auth/google/callback`);
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${googleRedirectUri}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
  
  console.log('Google OAuth URL:', googleAuthUrl);
  console.log('To verify OAuth flow:');
  console.log('1. Open the above URL in a browser');
  console.log('2. Complete Google authentication');
  console.log('3. You should be redirected to your app\n');

  console.log('✅ Verification complete!');
}

// Run the verification
verifyConfiguration().catch(error => {
  console.error('❌ Verification failed:', error);
}); 
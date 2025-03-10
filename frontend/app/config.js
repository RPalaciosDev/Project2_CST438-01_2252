import { Platform } from 'react-native';

// Base API URL for backend services - handle different platforms
export const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:8080' 
    : 'http://10.0.2.2:8080'; // Use 10.0.2.2 for Android emulator

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  SIGNIN: '/api/auth/signin',
  SIGNUP: '/api/auth/signup',
  LOGOUT: '/api/auth/signout',
  ME: '/api/auth/me'
};

// Other configuration settings
export const APP_CONFIG = {
  APP_NAME: 'Love Tiers',
  VERSION: '1.0.0'
}; 

// Debug info - helps trace configuration issues
console.log('App Configuration:', {
  platform: Platform.OS,
  apiUrl: API_URL,
  authEndpoints: AUTH_ENDPOINTS
});

// Default export combining all config values
const config = {
  API_URL,
  AUTH_ENDPOINTS,
  APP_CONFIG
};

export default config; 
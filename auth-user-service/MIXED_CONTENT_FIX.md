# Fixing Mixed Content Errors in the Frontend

## Problem

The frontend application is making requests to `http://auth-user-service-production.up.railway.app` but should be using `https://auth-user-service-production.up.railway.app` to avoid mixed content errors.

## Solution

### 1. Fix the Authorization URL

Find all instances where the OAuth2 authorization URL is defined and ensure it uses HTTPS:

```javascript
// INCORRECT ❌
const authServiceUrl = 'http://auth-user-service-production.up.railway.app';
// or
const googleAuthUrl = 'http://auth-user-service-production.up.railway.app/oauth2/authorization/google';

// CORRECT ✅
const authServiceUrl = 'https://auth-user-service-production.up.railway.app';
// or
const googleAuthUrl = 'https://auth-user-service-production.up.railway.app/oauth2/authorization/google';
```

### 2. Fix API Service Configuration

If you're using Axios or another HTTP client:

```javascript
// INCORRECT ❌
const apiClient = axios.create({
  baseURL: 'http://auth-user-service-production.up.railway.app',
  // ...
});

// CORRECT ✅
const apiClient = axios.create({
  baseURL: 'https://auth-user-service-production.up.railway.app',
  // ...
});
```

### 3. Environment Variables

If using environment variables, update them to use HTTPS:

```javascript
// .env or .env.production file
// INCORRECT ❌
REACT_APP_AUTH_API_URL=http://auth-user-service-production.up.railway.app

// CORRECT ✅
REACT_APP_AUTH_API_URL=https://auth-user-service-production.up.railway.app
```

### 4. Add Protocol Enforcement in Code

Add a function to ensure all URLs use HTTPS in production:

```javascript
function ensureHttps(url) {
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// Then use it when constructing URLs
const authUrl = ensureHttps(process.env.REACT_APP_AUTH_API_URL);
```

## Finding the Issue in React Native / Expo Apps

In React Native or Expo apps, look for:

1. API configuration files (often in `src/api` or `src/services`)
2. Auth-related components (often in `src/components/auth` or `src/screens/auth`)
3. Environment variables in `.env` files
4. Constants files where API URLs are defined

## Example of Fixed Code for 'Sign In with Google' Button:

```jsx
import React from 'react';
import { Button } from 'react-native';

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    // Use HTTPS for the auth service URL
    const googleAuthUrl = 'https://auth-user-service-production.up.railway.app/oauth2/authorization/google';
    
    // Build the URL with appropriate parameters
    const redirectUri = encodeURIComponent(`${window.location.origin}/oauth2/redirect`);
    const authUrl = `${googleAuthUrl}?redirect_uri=${redirectUri}`;
    
    // Redirect to Google authentication
    window.location.href = authUrl;
  };

  return (
    <Button 
      title="Sign in with Google" 
      onPress={handleGoogleSignIn} 
    />
  );
};

export default GoogleSignInButton;
```

## Temporary Workaround for Testing

If you can't immediately update the frontend code, you can test by:

1. Using a browser extension like HTTPS Everywhere
2. Temporarily disabling mixed content warnings in your browser (for testing only)
3. Adding a development proxy that upgrades HTTP to HTTPS requests 
# Frontend OAuth2 Integration Guide

This document explains how to handle OAuth2 authentication in your frontend application.

## OAuth2 Authentication Flow

1. User clicks on "Sign in with Google" button on your frontend
2. User is redirected to Google for authentication
3. After successful authentication, Google redirects to our auth service
4. Our auth service processes the OAuth2 response and redirects to your frontend application with a JWT token and user information

## Frontend Implementation

### 1. OAuth2 Login Button

```javascript
function handleGoogleLogin() {
  // Make sure to use HTTPS, not HTTP
  window.location.href = 'https://auth-user-service-production.up.railway.app/oauth2/authorization/google';
}
```

### 2. Handling the Redirect

The OAuth2 process will redirect to the path `/oauth2/redirect` on your frontend domain. Your frontend needs to have a route that handles this path:

```javascript
// In your router configuration, ensure you have a route for /oauth2/redirect
// Example for React Router:
<Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />
```

Then create a component to handle the OAuth2 redirect:

```javascript
// OAuthRedirectHandler.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuthRedirectHandler() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Store authentication data
      const userData = {
        id: params.get('userId'),
        username: params.get('username'),
        email: params.get('email'),
        token: token
      };
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Navigate to the home/dashboard page after successful login
      navigate('/dashboard');
    } else {
      // Handle authentication failure
      navigate('/login?error=authentication_failed');
    }
  }, [navigate]);
  
  return (
    <div>
      Processing authentication response...
    </div>
  );
}

export default OAuthRedirectHandler;
```

### 3. Using the JWT Token for API Requests

```javascript
// Set up axios instance with the JWT token
const api = axios.create({
  baseURL: 'https://auth-user-service-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add an interceptor to include the token in all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Important Notes

1. **HTTPS Only**: Always use `https://` URLs, never `http://`, which will cause mixed content errors.

2. **Token Storage**: Store the JWT token securely in localStorage or a cookie with appropriate protections.

3. **Error Handling**: Add error handling for cases where the token is invalid or missing.

4. **Query Parameters**: The auth service passes these parameters to your frontend:
   - `token`: JWT token for authentication
   - `userId`: User's ID in the database
   - `email`: User's email address
   - `username`: User's display name
   - `auth_time`: Timestamp of authentication
   - `auth_status`: "success" if authentication was successful
   - `login_type`: Type of authentication (e.g., "oauth2_google")

5. **Security**: Consider clearing URL parameters after extracting them to avoid exposing the token in browser history.

## Troubleshooting

If you're experiencing issues with OAuth2 authentication:

1. Ensure all URLs are using HTTPS
2. Check browser console for errors
3. Verify the redirect URI in Google Cloud Console matches our configuration
4. Try testing in an incognito window to avoid cookie/cache issues
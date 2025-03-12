# OAuth2 Client Configuration Guide

This document provides guidance for configuring the front-end application to correctly handle OAuth2 authentication with our auth-user-service.

## OAuth2 Flow

The current OAuth2 flow works as follows:

1. User clicks "Sign in with Google" on the frontend
2. Frontend redirects to `https://auth-user-service-production.up.railway.app/oauth2/authorization/google`
3. User completes Google authentication
4. Our service redirects back to the frontend at `https://frontend-production-c2bc.up.railway.app/oauth2/redirect` with a JWT token and user info

## Fixing the "Too Many Redirects" Error

If you're experiencing a "Too Many Redirects" error, try the following:

### Frontend Configuration

```javascript
// Example of correct OAuth2 redirect handling

// 1. Use the correct authorization URL
const googleAuthUrl = 'https://auth-user-service-production.up.railway.app/oauth2/authorization/google';

// 2. Implement proper redirect handling
function handleGoogleSignIn() {
  // Clear any existing auth cookies/storage before redirecting
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_state');
  
  // Store a state parameter to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('auth_state', state);
  
  // Redirect to the auth server with state parameter
  window.location.href = `${googleAuthUrl}?state=${state}&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/redirect')}`;
}

// 3. Implement the OAuth redirect handler
function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userId = params.get('userId');
  const username = params.get('username');
  const email = params.get('email');
  
  if (token) {
    // Store the token
    localStorage.setItem('auth_token', token);
    
    // Store user info
    localStorage.setItem('user', JSON.stringify({
      id: userId,
      username: username,
      email: email
    }));
    
    // Redirect to the main app
    window.location.href = '/dashboard';
  } else {
    // Handle error
    console.error('Authentication failed: No token received');
    window.location.href = '/login?error=authentication_failed';
  }
}
```

### Common Causes of Redirect Loops

1. **Cookie Issues**: Clear cookies for both the frontend and auth service domains
2. **Using HTTP instead of HTTPS**: Ensure all URLs use HTTPS in production 
3. **Missing or Invalid Redirect URL**: Verify the redirect_uri parameter
4. **CORS Configuration**: Check that CORS is properly configured on the auth service

### Testing OAuth Flow

To test the OAuth flow without causing a redirect loop:

1. Open an incognito/private browsing window (to avoid cached cookies)
2. Navigate to the frontend application
3. Try the "Sign in with Google" option
4. Watch the Network tab in developer tools to see the redirect chain

## Troubleshooting

If problems persist:

1. Check server logs for errors related to OAuth2
2. Verify all environment variables are correctly set
3. Ensure Google OAuth credentials are correctly configured
4. Check that the auth service is accessible from the frontend domain

For additional support, contact the backend team or refer to the Spring Security OAuth2 documentation. 
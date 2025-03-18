import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import React from 'react';

// Register for the authentication callback
WebBrowser.maybeCompleteAuthSession();

// Define the discovery document for Google OAuth
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Get the redirect URI based on the platform
const getRedirectUri = () => {
  const scheme = Constants.expoConfig?.scheme || 'tierlistapp';
  
  // For web in production, use the deployed URL
  if (Platform.OS === 'web' && process.env.NODE_ENV === 'production') {
    // Use the production URL - updated to match the actual Railway deployment
    const productionRedirectUri = 'https://frontend-production-c2bc.up.railway.app/auth/google/callback';
    console.log('Production Redirect URI for Google OAuth:', productionRedirectUri);
    console.log('Make sure this is added to Google Cloud Console > Credentials > Authorized redirect URIs');
    return productionRedirectUri;
  }
  
  // For web in development, use localhost
  if (Platform.OS === 'web' && process.env.NODE_ENV !== 'production') {
    // For local development on web
    const devRedirectUri = 'http://localhost:19006/auth/google/callback';
    console.log('Development Redirect URI for Google OAuth:', devRedirectUri);
    console.log('Make sure this is added to Google Cloud Console > Credentials > Authorized redirect URIs');
    return devRedirectUri;
  }
  
  // For native platforms, use Expo's AuthSession
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: typeof scheme === 'string' ? scheme : Array.isArray(scheme) ? scheme[0] : 'tierlistapp',
    path: 'auth/google/callback',
  });
  
  console.log('Native Redirect URI being used for Google OAuth:', redirectUri);
  console.log('Make sure this exact URI is added to Google Cloud Console > Credentials');
  return redirectUri;
};

// Set up Google OAuth request - ONLY USE THIS INSIDE REACT COMPONENTS
const useGoogleAuth = () => {
  // Using React hooks - this must be called inside a React component
  const redirectUri = getRedirectUri();
  
  // Your Google client ID should be stored in app.json or .env file
  const CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
    '90481875753-p89h3cguug4634l6qj5jbe5ei11omguo.apps.googleusercontent.com';
  
  return AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code',
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
    discovery
  );
};

// Add a non-hook version that can be used outside of React components
const getGoogleAuthHandler = () => {
  // This version doesn't use React hooks, so it's safe to use anywhere
  const redirectUri = getRedirectUri();
  const CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
    '90481875753-p89h3cguug4634l6qj5jbe5ei11omguo.apps.googleusercontent.com';
  
  return {
    promptAsync: async () => {
      try {
        // Create a manual auth request URL
        const authUrl = `${discovery.authorizationEndpoint}?` +
          `client_id=${CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent('openid profile email')}` +
          `&access_type=offline` +
          `&prompt=consent`;
        
        // Use the web browser directly
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri
        );
        
        // Parse the response
        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('?')[1]);
          return {
            type: 'success',
            params: {
              code: params.get('code'),
            }
          };
        }
        
        return result;
      } catch (error) {
        console.error('Auth error:', error);
        return {
          type: 'error',
          error,
        };
      }
    }
  };
};

// Process auth response to get the access token
const fetchAccessTokenFromCode = async (code: string, redirectUri: string) => {
  try {
    const CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
      '90481875753-p89h3cguug4634l6qj5jbe5ei11omguo.apps.googleusercontent.com';
    const CLIENT_SECRET = Constants.expoConfig?.extra?.googleClientSecret || 
      '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';
    
    console.log('Fetching tokens using code, client ID and redirect URI:', redirectUri);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Error fetching tokens:', tokenResponse.status, errorText);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Raw token data keys received:', Object.keys(tokenData));
    
    // Check for errors in the response
    if (tokenData.error) {
      throw new Error(`Google OAuth error: ${tokenData.error} - ${tokenData.error_description || 'No description'}`);
    }
    
    // Log token data for debugging (without showing the actual tokens)
    console.log('Token response contains:', {
      hasAccessToken: !!tokenData.access_token,
      hasIdToken: !!tokenData.id_token,
      hasRefreshToken: !!tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    });
    
    // Neither token is present
    if (!tokenData.access_token && !tokenData.id_token) {
      console.error('Full token response:', JSON.stringify(tokenData));
      throw new Error('No tokens returned from Google OAuth server');
    }
    
    // IMPORTANT: Directly log id_token to verify it exists
    if (tokenData.id_token) {
      console.log('ID token exists in the raw response! Length:', tokenData.id_token.length);
      console.log('ID token preview:', tokenData.id_token.substring(0, 15) + '...');
    } else {
      console.error('NO ID TOKEN IN GOOGLE RESPONSE - THIS WILL CAUSE AUTH FAILURES');
    }
    
    // Return with consistent property names - CRITICAL: map Google's snake_case to our camelCase
    return { 
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token, // THIS IS THE IMPORTANT MAPPING
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    };
  } catch (error) {
    console.error('Error fetching access token:', error);
    // Additional logging
    if (error instanceof Response) {
      console.error('Response status:', error.status);
    }
    throw error;
  }
};

// Exchange the Google tokens for our application JWT
const exchangeGoogleTokenForJWT = async (token: string, API_URL: string) => {
  try {
    console.log(`Exchanging Google token for JWT at ${API_URL}/api/auth/google-token`);
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Try to determine if it's an ID token by checking for typical JWT format
    const isIdToken = token.split('.').length === 3;
    console.log('Token appears to be an:', isIdToken ? 'ID Token (JWT format)' : 'Access Token');
    
    if (isIdToken) {
      // If it's an ID token, log the payload part (for debugging)
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        console.log('ID Token contains email:', !!payload.email);
        console.log('ID Token contains sub:', !!payload.sub);
      } catch (e) {
        console.warn('Could not decode token payload:', e);
      }
    }
    
    // Add additional logging to track the full URL
    const fullUrl = `${API_URL}/api/auth/google-token`;
    console.log('Full API URL being used:', fullUrl);
    
    // Send the token to the backend
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token: token }),
    });
    
    if (!response.ok) {
      // Try to get the error details from the response
      try {
        const errorData = await response.text();
        console.error('Error response status:', response.status);
        console.error('Error response headers:', JSON.stringify(response.headers));
        console.error('Error response body:', errorData);
        
        // Throw detailed error
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorData}`);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    // Parse the response data
    const userData = await response.json();
    
    // Log the complete data structure for debugging
    console.log('Full user data structure received from backend:', JSON.stringify(userData, null, 2));
    console.log('User object fields available:', Object.keys(userData));
    
    return userData;
  } catch (error) {
    console.error('Error exchanging Google token for JWT:', error);
    console.error('API URL used:', API_URL);
    throw error;
  }
};

// Set up URL listener to handle deep links
const setupURLListener = (callback: (url: string) => void) => {
  // Set up a listener for URL events
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });
  
  // Get the initial URL that opened the app
  Linking.getInitialURL().then((url) => {
    if (url) {
      callback(url);
    }
  });
  
  return () => {
    subscription.remove();
  };
};

// Add a debug function to test the token against the backend
const debugGoogleToken = async (token: string, API_URL: string) => {
  try {
    console.log(`Debugging Google token at ${API_URL}/api/auth/debug-google-token`);
    console.log('Token length:', token.length);
    console.log('Token type check:', typeof token);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Check if the token has the format of a JWT
    const isJwt = token.split('.').length === 3;
    console.log('Token appears to be a JWT:', isJwt);
    
    // If it looks like a JWT, try to decode the payload
    if (isJwt) {
      try {
        const payloadBase64 = token.split('.')[1];
        // Base64 decode and parse as JSON
        const payload = JSON.parse(atob(payloadBase64));
        console.log('JWT payload fields:', Object.keys(payload));
        // Check specifically for email field which is what the backend needs
        console.log('JWT contains email field:', !!payload.email);
        if (payload.email) {
          console.log('Email value:', payload.email);
        }
      } catch (error) {
        console.error('Failed to decode JWT payload:', error);
      }
    }
    
    // Construct the full URL for debug endpoint
    const fullUrl = `${API_URL}/api/auth/debug-google-token`;
    console.log('Full debug URL:', fullUrl);
    
    // Send the token for debugging
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Debug endpoint error:', response.status, errorText);
      throw new Error(`Debug endpoint returned error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Debug response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error debugging Google token:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

// Update handleGoogleAuth to use the correct API URL
export const handleGoogleAuth = async () => {
    try {
        console.log("Starting Google auth flow");
        
        // Use the non-hook version that's safe outside of React components
        const googleAuth = getGoogleAuthHandler();
        
        // Check if googleAuth was properly initialized
        if (!googleAuth || !googleAuth.promptAsync) {
            throw new Error("OAuth config is not properly initialized");
        }
        
        // This will open a web browser for authentication
        const result = await googleAuth.promptAsync();
        console.log('Google auth result:', result);
        
        if (result.type === 'success') {
            // In the WebBrowser approach, we get params directly
            if (result.params && result.params.code) {
                const { code } = result.params;
                
                if (!code) {
                    throw new Error('No authorization code found in the response');
                }
                
                // Get the redirect URI (same as was used to start the flow)
                const redirectUri = getRedirectUri();
                
                // Exchange the code for access token and ID token
                const tokenData = await fetchAccessTokenFromCode(code, redirectUri);
                
                // DEBUGGING: Log the exact structure and content of tokenData
                console.log('Token data keys:', Object.keys(tokenData));
                console.log('ID token check - exists:', !!tokenData.idToken);
                console.log('ID token first few chars:', tokenData.idToken ? tokenData.idToken.substring(0, 10) + '...' : 'N/A');
                
                // Use the correct API URL for the backend
                const API_URL = 'https://auth-user-service-production.up.railway.app';
                
                console.log('Using backend API URL:', API_URL);
                
                // Explicitly check if we got an ID token in the response
                if (!tokenData.idToken) {
                    console.error('No ID token received from Google - this is required for our backend');
                    
                    // Try alternate property name if the original tokenData might have a different structure
                    // Use type assertion to avoid TypeScript error
                    const alternateIdToken = (tokenData as any).id_token;
                    if (alternateIdToken) {
                        console.log('Found ID token under id_token property instead');
                        tokenData.idToken = alternateIdToken;
                    }
                }
                
                // IMPORTANT: Use the ID token which contains user profile data
                // The ID token is a JWT that contains user info including email
                const tokenToUse = tokenData.idToken || tokenData.accessToken;
                
                if (!tokenToUse) {
                    throw new Error('No valid token available to send to the backend');
                }
                
                // Log which token is being used
                console.log('Using token type:', tokenData.idToken ? 'ID Token' : 'Access Token');
                
                // If using access token, warn about potential issues
                if (!tokenData.idToken && tokenData.accessToken) {
                    console.warn('USING ACCESS TOKEN INSTEAD OF ID TOKEN - THIS MAY CAUSE BACKEND ERRORS');
                }
                
                // Debug the token first to see what's happening
                try {
                    await debugGoogleToken(tokenToUse, API_URL);
                } catch (debugError) {
                    console.warn('Token debugging failed but continuing:', debugError);
                }
                
                return await exchangeGoogleTokenForJWT(tokenToUse, API_URL);
            } else {
                throw new Error('No authorization code found in the response');
            }
        } else if (result.type === 'error') {
            throw new Error(`Google authentication failed: ${result.error}`);
        } else {
            throw new Error(`Google authentication failed: ${result.type}`);
        }
    } catch (error) {
        console.log('Google auth error:', error);
        throw error;
    }
};

export {
  useGoogleAuth,
  getGoogleAuthHandler,
  getRedirectUri,
  fetchAccessTokenFromCode,
  exchangeGoogleTokenForJWT,
  setupURLListener,
  debugGoogleToken,
}; 
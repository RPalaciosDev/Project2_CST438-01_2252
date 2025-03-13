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
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: scheme,
    path: 'auth/google/callback',
    // Native
    useProxy: Platform.OS !== 'web',
  });
  
  console.log('Redirect URI:', redirectUri);
  return redirectUri;
};

// Set up Google OAuth request
const useGoogleAuth = () => {
  // Creating this outside of React components can cause the "Hooks can only be called inside of
  // the body of a function component" error. Let's fix that by providing a proper
  // implementation that can be safely used in non-component contexts.
  
  // For direct usage in components:
  if (typeof React !== 'undefined' && React.useContext) {
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
  }
  
  // For usage outside React components (like in regular functions):
  // This returns a compatible interface but doesn't use hooks
  // This avoids the React Error #321 when used outside components
  return {
    request: null,
    response: null,
    promptAsync: async () => {
      // Use the AuthSession.startAsync approach which doesn't require hooks
      const redirectUri = getRedirectUri();
      const CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
        '90481875753-p89h3cguug4634l6qj5jbe5ei11omguo.apps.googleusercontent.com';
      
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
    
    const tokenData = await tokenResponse.json();
    return tokenData;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }
};

// Exchange the Google tokens for our application JWT
const exchangeGoogleTokenForJWT = async (accessToken: string, API_URL: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: accessToken }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging Google token for JWT:', error);
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

export {
  useGoogleAuth,
  getRedirectUri,
  fetchAccessTokenFromCode,
  exchangeGoogleTokenForJWT,
  setupURLListener,
}; 
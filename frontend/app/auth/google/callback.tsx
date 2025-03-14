import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchAccessTokenFromCode, getRedirectUri, exchangeGoogleTokenForJWT } from '../../../services/oauth';
import { useAuthStore } from '../../../services/auth';
import Constants from 'expo-constants';

/**
 * This component handles the OAuth callback from Google.
 * It should be placed at /app/auth/google/callback.tsx to match the
 * redirect URI we specified in our OAuth configuration.
 */
export default function GoogleCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setUser = useAuthStore(state => state.setUser);
  
  // Use the correct API URL for the auth service
  const API_URL = 'https://auth-user-service-production.up.railway.app';
  
  console.log("Using API URL in callback:", API_URL);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the authorization code from the URL params
        const code = params.code as string;
        
        if (!code) {
          throw new Error('No authorization code found in the callback');
        }
        
        console.log('Received authorization code:', code);
        
        // Get the redirect URI (must match what we used to request the code)
        const redirectUri = getRedirectUri();
        
        // Exchange authorization code for access token
        const tokenData = await fetchAccessTokenFromCode(code, redirectUri);
        
        // Log what tokens we got back
        console.log('Received tokens:', {
          hasAccessToken: !!tokenData.accessToken,
          hasIdToken: !!tokenData.idToken,
          tokenType: tokenData.tokenType
        });
        
        if (!tokenData.accessToken && !tokenData.idToken) {
          throw new Error('No tokens returned from Google');
        }
        
        // DEBUGGING: Log detailed token info
        console.log('All token data keys:', Object.keys(tokenData));
        if (!tokenData.idToken) {
          console.error('CRITICAL ERROR: No ID token in tokenData - the backend will fail');
        } else {
          console.log('ID token length:', tokenData.idToken.length);
          console.log('ID token starts with:', tokenData.idToken.substring(0, 10) + '...');
        }
        
        // IMPORTANT: Prefer ID token if available, otherwise use access token
        // The ID token contains the user's email address which is needed by the backend
        const tokenToUse = tokenData.idToken || tokenData.accessToken;
        
        console.log('Using token type for backend:', tokenData.idToken ? 'ID Token' : 'Access Token');
        
        // If we're sending an access token, warn about potential issues
        if (!tokenData.idToken && tokenData.accessToken) {
          console.warn('⚠️ USING ACCESS TOKEN INSTEAD OF ID TOKEN - THIS WILL CAUSE BACKEND ERRORS');
        }
        
        // If we have an ID token, try to decode it for debugging
        if (tokenData.idToken) {
          try {
            const parts = tokenData.idToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              console.log('ID token payload contains:', Object.keys(payload));
              console.log('Has email:', !!payload.email);
              console.log('Has sub:', !!payload.sub);
              if (payload.email) {
                console.log('Email value:', payload.email);
              }
            }
          } catch (e) {
            console.warn('Could not decode ID token:', e);
          }
        }
        
        // Exchange Google token for our application JWT
        console.log('Exchanging token with backend at:', API_URL);
        const authData = await exchangeGoogleTokenForJWT(tokenToUse, API_URL);
        
        console.log('Exchanged Google token for app JWT');
        
        // Update the auth store with the user data
        await useAuthStore.getState().setUser({
          token: authData.token,
          user: {
            id: authData.id,
            username: authData.username,
            email: authData.email,
            roles: authData.roles
          }
        });
        
        // Redirect to home page
        router.replace('/home');
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        // Redirect to login page with error
        router.replace({
          pathname: '/sign-in',
          params: { error: 'Authentication failed. Please try again.' }
        });
      }
    }
    
    handleCallback();
  }, [params.code, router, API_URL]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF4B6E" />
      <Text style={styles.text}>Completing authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
}); 
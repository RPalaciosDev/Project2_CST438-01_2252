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
  const API_URL = Constants.expoConfig?.extra?.backendUrl || 'https://auth-user-api-production.up.railway.app';

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
        
        if (!tokenData.access_token) {
          throw new Error('No access token returned from Google');
        }
        
        console.log('Received access token');
        
        // Exchange Google token for our application JWT
        const authData = await exchangeGoogleTokenForJWT(tokenData.access_token, API_URL);
        
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
  }, [params.code, router]);
  
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
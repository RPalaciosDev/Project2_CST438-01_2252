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
        console.log('Received auth data:', {
          id: authData.id,
          username: authData.username,
          email: authData.email,
          isNewAccount: authData.isNewAccount,
          hasGender: !!authData.gender,
          hasLookingFor: !!authData.lookingFor,
          hasAge: authData.age > 0,
          hasPicture: !!authData.picture
        });
        
        // Debug: Log all available fields in authData
        console.log('All available fields in authData:', Object.keys(authData));
        console.log('authData.user fields:', authData.user ? Object.keys(authData.user) : 'No user object');
        
        // Check if data is nested under a 'user' property
        const userData = authData.user || authData;
        
        // Update the auth store with the user data and new user status
        const authStore = useAuthStore.getState();
        await authStore.setUser({
          token: authData.token,
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            gender: userData.gender,
            lookingFor: userData.lookingFor,
            age: userData.age,
            roles: userData.roles
          }
        });
        
        // Set isNewUser flag correctly to ensure proper startup flow
        if (authData.isNewAccount) {
          authStore.setIsNewUser(true);
        }
        
        // CRITICAL: Directly fetch full user data from the /me endpoint to ensure we have all fields
        try {
          console.log('Fetching complete user profile from /me endpoint');
          const meResponse = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${authData.token}`
            }
          });
          
          if (meResponse.ok) {
            const fullUserData = await meResponse.json();
            console.log('Full user profile received:', fullUserData);
            
            // Check if we got proper gender and lookingFor fields
            const hasGender = fullUserData.gender != null && 
                            fullUserData.gender !== '' && 
                            fullUserData.gender !== 'undefined';
                            
            const hasLookingFor = fullUserData.lookingFor != null && 
                                fullUserData.lookingFor !== '' && 
                                fullUserData.lookingFor !== 'undefined';
                                
            const hasAge = fullUserData.age != null && fullUserData.age > 0;
            
            // More aggressive routing - send to onboarding if ANY required field is missing
            const needsOnboarding = !hasGender || !hasLookingFor || !hasAge;
            
            console.log('User profile check from /me endpoint:', {
              hasGender, 
              hasLookingFor, 
              hasAge,
              gender: fullUserData.gender,
              lookingFor: fullUserData.lookingFor,
              age: fullUserData.age
            });
            
            // Write a detailed log entry
            console.warn('GOOGLE LOGIN - PROFILE CHECK - ' + new Date().toISOString() + ': ' +
              'User ' + userData.email + ' - ' +
              'Needs onboarding: ' + needsOnboarding + 
              '. Fields from /me: gender=' + (fullUserData.gender || 'missing') + 
              ', lookingFor=' + (fullUserData.lookingFor || 'missing') + 
              ', age=' + (fullUserData.age || 0)
            );
            
            if (needsOnboarding) {
              console.log('Missing required profile fields - redirecting to startup flow');
              authStore.setIsNewUser(true);
              router.replace('/startup');
              return; // Exit early
            }
          } else {
            console.warn('Failed to fetch /me endpoint:', meResponse.status);
          }
        } catch (meError) {
          console.error('Error checking /me endpoint:', meError);
        }
        
        // Fallback to the original checks if /me endpoint fails
        const hasGender = userData.gender != null && userData.gender !== '' && userData.gender !== 'undefined';
        const hasLookingFor = userData.lookingFor != null && userData.lookingFor !== '' && userData.lookingFor !== 'undefined';
        const hasAge = userData.age != null && userData.age > 0;
        
        // Be more aggressive about routing to onboarding - ANY missing field or ANY sign of a
        // new account should trigger onboarding
        const needsOnboarding = authData.isNewAccount || 
                              !hasGender || 
                              !hasLookingFor || 
                              !hasAge || 
                              typeof userData.gender === 'undefined' ||
                              typeof userData.lookingFor === 'undefined';
        
        console.log('User profile completeness check:', { 
          hasGender, 
          hasLookingFor, 
          hasAge,
          needsOnboarding,
          gender: String(userData.gender), // Convert to string for logging
          lookingFor: String(userData.lookingFor), // Convert to string for logging
          age: userData.age
        });
        
        // Write a persistent log entry
        console.warn('LOGIN SUCCESS LOG - ' + new Date().toISOString() + ': ' +
          'User ' + userData.email + ' logged in via Google OAuth. ' +
          'Needs onboarding: ' + needsOnboarding + 
          (needsOnboarding ? (' (Reason: ' + 
            (authData.isNewAccount ? 'New account' : 
             !hasGender ? 'Missing gender' :
             !hasLookingFor ? 'Missing lookingFor' :
             !hasAge ? 'Missing age' : 'Unknown') + 
           ')') : '') +
          '. Fields present: gender=' + hasGender + 
          ' (' + (String(userData.gender) || 'empty') + ')' +
          ', lookingFor=' + hasLookingFor + 
          ' (' + (String(userData.lookingFor) || 'empty') + ')' +
          ', age=' + (userData.age || 0)
        );
        
        if (needsOnboarding) {
          console.log('Redirecting to startup flow...');
          authStore.setIsNewUser(true); // Ensure new user flag is set for startup flow
          router.replace('/startup');
        } else {
          console.log('Redirecting to home...');
          router.replace('/');
        }
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
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Simple auth check - move to protected routes
export default function RootLayout() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isLoading) {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to the sign-in page
        router.replace('/sign-in');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to the home page
        router.replace('/');
      }
      setIsNavigating(false);
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading || isNavigating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          An error occurred while loading the app
        </Text>
        <Text style={{ color: 'gray', textAlign: 'center' }}>
          Please try again later
        </Text>
      </View>
    );
  }

  return <Slot />;
} 
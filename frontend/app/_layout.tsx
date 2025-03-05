import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../services/auth';

export default function RootLayout() {
  const { loadStoredAuth } = useAuthStore();

  // Initialize auth state on app startup
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="sign-in"
          options={{ 
            headerShown: false,
            gestureEnabled: false // Prevent going back with gesture
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{ 
            headerShown: false,
            gestureEnabled: false // Prevent going back to login
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../services/auth';
import { StyleProvider } from './context/StyleContext';

export default function RootLayout() {
  const { loadStoredAuth } = useAuthStore();

  // initialize auth state on app startup
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <StyleProvider> 
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
              gestureEnabled: false 
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
              gestureEnabled: false // prevent going back to login
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </StyleProvider>
  );
}

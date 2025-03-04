import { Platform, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useAuthStore } from './services/auth';

export default function RootLayout() {
  const loadStoredAuth = useAuthStore(state => state.loadStoredAuth);
  
  useEffect(() => {
    loadStoredAuth().catch(error => {
      console.error('Failed to load authentication:', error);
    });
  }, [loadStoredAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
          redirect={true}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
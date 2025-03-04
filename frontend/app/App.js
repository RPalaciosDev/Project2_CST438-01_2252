import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded, error] = useFonts({
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <Slot />;
} 
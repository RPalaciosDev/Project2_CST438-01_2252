import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load stored authentication on component mount
    const loadAuth = async () => {
      try {
        await loadStoredAuth();
      } catch (err) {
        setError('Failed to load authentication');
      }
    };
    
    loadAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    // Redirect based on authentication status
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/home');
      } else {
        router.replace('/sign-in');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF4B6E" />
      <Text>Loading...</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    color: '#FF4B6E',
    textAlign: 'center',
  }
});
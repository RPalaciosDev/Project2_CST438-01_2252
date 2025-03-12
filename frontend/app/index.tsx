import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import axios from 'axios';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Load stored authentication on component mount
    const loadAuth = async () => {
      try {
        setError(null);
        await loadStoredAuth();
      } catch (err) {
        console.error('Auth loading error:', err);
        if (axios.isAxiosError(err)) {
          setError(`Authentication error: ${err.message}. Please check your connection.`);
        } else {
          setError('Failed to load authentication data. Please try again.');
        }
      }
    };
    
    loadAuth();
  }, [loadStoredAuth, retrying]);

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

  // Handle retry
  const handleRetry = () => {
    setRetrying(true);
    // Reset retry flag after a short delay to prevent rapid retries
    setTimeout(() => setRetrying(false), 500);
  };

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF4B6E" />
      <Text style={styles.loadingText}>Loading...</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD6D6',
    width: '80%',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4B6E',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
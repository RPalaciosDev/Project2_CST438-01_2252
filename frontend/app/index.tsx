import { useEffect, useState, useRef } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import axios from 'axios';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const isMounted = useRef(false);

  // Set mounted ref after first render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Load stored authentication on component mount
    const loadAuth = async () => {
      try {
        console.log('Index: Loading stored authentication...');
        setError(null);
        await loadStoredAuth();

        // Check and log the current auth state after loading
        const currentState = useAuthStore.getState();
        console.log('Index: Auth state after loading:', {
          isAuthenticated: currentState.isAuthenticated,
          hasUser: !!currentState.user,
          userId: currentState.user?.id,
          hasCompletedOnboarding: currentState.user?.hasCompletedOnboarding === true ? 'true' : 'false/undefined'
        });
      } catch (err) {
        console.error('Index: Auth loading error:', err);
        if (axios.isAxiosError(err)) {
          setError(`Authentication error: ${err.message}. Please check your connection.`);
        } else {
          setError('Failed to load authentication data. Please try again.');
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      loadAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadStoredAuth, retrying]);

  useEffect(() => {
    // Redirect to auth-check which will handle all authentication and onboarding routing
    if (!isLoading && isMounted.current) {
      console.log('Index: Ready to navigate, isAuthenticated:', isAuthenticated);

      // Use setTimeout to ensure navigation happens after mounting
      const timer = setTimeout(() => {
        if (!isMounted.current) return;

        if (isAuthenticated) {
          console.log('Index: Redirecting to auth-check for authenticated user');
          router.replace('/auth-check');
        } else {
          console.log('Index: Redirecting to sign-in for unauthenticated user');
          router.replace('/sign-in');
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle retry
  const handleRetry = () => {
    console.log('Index: Retrying authentication load...');
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
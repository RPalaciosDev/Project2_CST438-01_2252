import { Redirect } from 'expo-router';
import { useAuthStore } from './services/auth';
import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setError('App is taking longer than expected to load. Please check your network connection.');
      }
    }, 10000); // 10 seconds
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
  
  return <Redirect href={isAuthenticated ? "/tier-list" : "/sign-in"} />;
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
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Slot, useSegments } from 'expo-router';
import { StyleProvider } from './context/StyleContext';
import { useAuthStore } from '../services/auth';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// Auth protection component to check if user is authenticated
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated, checkStatus, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const isMounted = useRef(false);

  // Public routes that don't require authentication
  const publicRoutes = ['sign-in', 'sign-up', 'auth-check', '(auth)', 'startup'];
  const isPublicRoute = publicRoutes.some(route => segments.includes(route));

  // Set mounted ref after first render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    console.log("Current route segments:", segments);

    const checkAuth = async () => {
      if (!hasCheckedAuth) {
        try {
          const status = await checkStatus();
          console.log("Auth check in layout:", status);
          if (isMounted.current) {
            setHasCheckedAuth(true);
          }
        } catch (err) {
          console.error("Error checking auth:", err);
          if (isMounted.current) {
            setHasCheckedAuth(true); // Still set to true to avoid infinite loop
          }
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [segments]);

  // Handle redirects after auth check is complete
  useEffect(() => {
    if (hasCheckedAuth && isMounted.current) {
      // Don't redirect if we're already on a public route
      if (!isAuthenticated && !isPublicRoute) {
        console.log("Not authenticated, redirecting to sign-in");
        // Use setTimeout to ensure navigation happens after mounting
        setTimeout(() => {
          if (isMounted.current) {
            router.replace('/sign-in');
          }
        }, 50);
      }
    }
  }, [isAuthenticated, hasCheckedAuth, isPublicRoute, segments]);

  if (!hasCheckedAuth && !isPublicRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

// Sidebar component
const Sidebar = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'There was an error logging out. Please try again.');
    }
  };

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/')}
      >
        <MaterialIcons name="home" size={24} color="#333" />
        <Text style={styles.sidebarText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/tierlist')}
      >
        <MaterialIcons name="list" size={24} color="#333" />
        <Text style={styles.sidebarText}>Your Tierlists</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/discover')}
      >
        <MaterialIcons name="explore" size={24} color="#333" />
        <Text style={styles.sidebarText}>Discover</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/profile')}
      >
        <MaterialIcons name="person" size={24} color="#333" />
        <Text style={styles.sidebarText}>Profile</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color="#FF4B6E" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Layout() {
  const segments = useSegments();
  const isAuthPage = segments.includes("sign-in") || segments.includes("sign-up") || segments.includes("startup");

  // Register WebBrowser handler to ensure Google OAuth callback works
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <StyleProvider>
      <AuthWrapper>
        <View style={styles.container}>
          {!isAuthPage && <Sidebar />}
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      </AuthWrapper>
    </StyleProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#FFF9FA',
    borderRightWidth: 1,
    borderRightColor: '#FFE4E8',
    padding: 16,
    paddingTop: 40,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sidebarText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E8',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF4B6E',
  },
});



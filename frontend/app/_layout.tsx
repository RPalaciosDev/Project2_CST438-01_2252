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
  const fetchDailyTierlist = useAuthStore.getState().fetchDailyTierlist;
  const [dailyTierAvailable, setDailyTierAvailable] = useState<boolean | null>(null);
  const [dailyTierCompleted, setDailyTierCompleted] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dailyTemplateId, setDailyTemplateId] = useState<string | null>(null);

  const checkDailyTierlist = async () => {
    try {
      setIsRefreshing(true);
      const dailyData = await fetchDailyTierlist();

      console.log("Daily tierlist check result:", dailyData);

      // Update all state in one place
      setDailyTierAvailable(dailyData?.available || false);
      setDailyTierCompleted(dailyData?.completed || false);
      setDailyTemplateId(dailyData?.templateId || null);

      setIsRefreshing(false);
    } catch (error) {
      console.error('Error checking daily tierlist:', error);
      setDailyTierAvailable(false);
      setDailyTierCompleted(false);
      setDailyTemplateId(null);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkDailyTierlist();
  }, []);

  const handleDailyTierClick = () => {
    if (dailyTierAvailable && !dailyTierCompleted && dailyTemplateId) {
      // Pass the templateId to the tierlists screen
      router.push({
        pathname: '/tierlists',
        params: { dailyTemplateId }
      });
    } else {
      if (dailyTierCompleted) {
        Alert.alert(
          "Already Completed",
          "You have already completed today's daily tier list."
        );
      } else {
        console.log('Daily Tier not available or already completed');
      }
    }
  };

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
      <Text style={styles.logo}>Love Tiers</Text>

      {/* Daily Tier Link with conditional styling and refresh button */}
      <View style={styles.dailyTierContainer}>
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            styles.dailyTierItem,
            !dailyTierAvailable || dailyTierCompleted ? styles.disabledItem : {}
          ]}
          onPress={handleDailyTierClick}
          disabled={!dailyTierAvailable || dailyTierCompleted}
        >
          <MaterialIcons name="stars" size={24} color={!dailyTierAvailable || dailyTierCompleted ? "#999" : "#FF4B6E"} />
          <View style={styles.dailyTierTextContainer}>
            <Text style={[
              styles.sidebarText,
              !dailyTierAvailable || dailyTierCompleted ? styles.disabledText : {}
            ]}>
              Daily Tier
            </Text>
            {dailyTierCompleted && (
              <Text style={styles.completedTag}>Completed</Text>
            )}
            {!dailyTierAvailable && !dailyTierCompleted && (
              <Text style={styles.unavailableTag}>Unavailable</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkDailyTierlist}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#999" />
          ) : (
            <MaterialIcons name="refresh" size={20} color="#999" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/')}
      >
        <MaterialIcons name="home" size={24} color="#333" />
        <Text style={styles.sidebarText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/my-tiers')}
      >
        <MaterialIcons name="list" size={24} color="#333" />
        <Text style={styles.sidebarText}>Your Tierlists</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/browse')}
      >
        <MaterialIcons name="explore" size={24} color="#333" />
        <Text style={styles.sidebarText}>Discover</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/tier-builder')}
      >
        <MaterialIcons name="build" size={24} color="#333" />
        <Text style={styles.sidebarText}>Tier Builder</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sidebarItem}
        onPress={() => router.push('/chats')}
      >
        <MaterialIcons name="chat" size={24} color="#333" />
        <Text style={styles.sidebarText}>Chats</Text>
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
    width: 250,
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sidebarText: {
    color: '#333',
    fontSize: 16,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 10,
  },
  logoutText: {
    color: '#FF4B6E',
    fontSize: 16,
    marginLeft: 12,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF4B6E',
    textAlign: 'center',
  },
  dailyTierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyTierItem: {
    flex: 1,
  },
  dailyTierTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledItem: {
    backgroundColor: '#F0F0F0',
  },
  disabledText: {
    color: '#999',
  },
  completedTag: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontSize: 10,
  },
  unavailableTag: {
    backgroundColor: '#FF5733',
    color: '#FFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontSize: 10,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginLeft: 4,
  },
});



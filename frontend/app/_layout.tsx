import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
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
  const isPublicRoute = publicRoutes.some((route) => segments.includes(route));

  // Set mounted ref after first render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    console.log('Current route segments:', segments);

    const checkAuth = async () => {
      if (!hasCheckedAuth) {
        try {
          const status = await checkStatus();
          console.log('Auth check in layout:', status);
          if (isMounted.current) {
            setHasCheckedAuth(true);
          }
        } catch (err) {
          console.error('Error checking auth:', err);
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
  // useEffect(() => {
  //   if (hasCheckedAuth && isMounted.current) {
  //     // Don't redirect if we're already on a public route
  //     if (!isAuthenticated && !isPublicRoute) {
  //       console.log("Not authenticated, redirecting to sign-in");
  //       // Use setTimeout to ensure navigation happens after mounting
  //       setTimeout(() => {
  //         if (isMounted.current) {
  //           router.replace('/sign-in');
  //         }
  //       }, 50);
  //     }
  //   }
  // }, [isAuthenticated, hasCheckedAuth, isPublicRoute, segments]);

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
  const [dailyTierTitle, setDailyTierTitle] = useState<string>('');
  const [isHovering, setIsHovering] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Animation for sidebar sliding
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sidebarVisible = useRef(true);

  const showSidebar = () => {
    console.log('Showing sidebar');
    sidebarVisible.current = true;
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideSidebar = () => {
    if (!isHovering) {
      console.log('Hiding sidebar');
      sidebarVisible.current = false;
      Animated.timing(slideAnim, {
        toValue: -250, // Width of the sidebar
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Start hide timer when component mounts
  useEffect(() => {
    console.log('Setting up sidebar auto-hide timer');
    const timer = setTimeout(() => {
      console.log('Auto-hide timer triggered');
      hideSidebar();
    }, 6000); // Hide after 6 seconds (increased from 5 seconds)

    return () => {
      console.log('Clearing auto-hide timer');
      clearTimeout(timer);
    };
  }, []);

  // Watch hover state changes to handle showing/hiding
  useEffect(() => {
    if (isHovering) {
      showSidebar();
    } else {
      // Add a slight delay before hiding to prevent accidental hide
      const timer = setTimeout(() => {
        hideSidebar();
      }, 500); // Increased from 300ms to 500ms
      return () => clearTimeout(timer);
    }
  }, [isHovering]);

  // Setup web event handlers
  useEffect(() => {
    // We only run this code on web platform
    if (Platform.OS !== 'web') return;

    // For TypeScript, we need to be careful about accessing browser objects
    const addListeners = () => {
      try {
        // We need to cast to any to avoid TypeScript errors with document/window
        // This is safe because we've already checked Platform.OS === 'web'
        const doc = (global as any).document;
        const win = (global as any).window;

        if (!doc || !win) return;

        const sidebarElement = doc.getElementById('sidebar');
        const triggerElement = doc.getElementById('sidebar-trigger');

        const handleSidebarEnter = () => {
          console.log('Mouse entered sidebar');
          setIsHovering(true);
          showSidebar();
        };

        const handleSidebarLeave = () => {
          console.log('Mouse left sidebar');
          setIsHovering(false);
          setTimeout(() => hideSidebar(), 300); // Small delay before hiding
        };

        const handleTriggerEnter = () => {
          console.log('Mouse entered trigger area');
          setIsHovering(true);
          showSidebar();
        };

        if (sidebarElement) {
          sidebarElement.addEventListener('mouseenter', handleSidebarEnter);
          sidebarElement.addEventListener('mouseleave', handleSidebarLeave);
        }

        if (triggerElement) {
          triggerElement.addEventListener('mouseenter', handleTriggerEnter);
        }

        // Return cleanup function
        return () => {
          if (sidebarElement) {
            sidebarElement.removeEventListener('mouseenter', handleSidebarEnter);
            sidebarElement.removeEventListener('mouseleave', handleSidebarLeave);
          }

          if (triggerElement) {
            triggerElement.removeEventListener('mouseenter', handleTriggerEnter);
          }
        };
      } catch (error) {
        console.error('Error setting up web event listeners:', error);
        return () => {}; // Empty cleanup if there was an error
      }
    };

    // Wait a moment for components to mount
    const cleanup = setTimeout(addListeners, 500);

    return () => {
      clearTimeout(cleanup);
    };
  }, [isWeb]);

  // For mobile, we use touch to toggle the sidebar
  const handleTriggerTouch = () => {
    showSidebar();
  };

  const handleTabHover = () => {
    setIsHovering(true);
  };

  const handleTabHoverExit = () => {
    setIsHovering(false);
  };

  const handleSidebarHover = () => {
    setIsHovering(true);
  };

  const handleSidebarHoverExit = () => {
    setIsHovering(false);
  };

  const checkDailyTierlist = async () => {
    try {
      setIsRefreshing(true);
      const dailyData = await fetchDailyTierlist();

      console.log('Daily tierlist check result:', dailyData);

      // Update all state in one place
      setDailyTierAvailable(dailyData?.available || false);
      setDailyTierCompleted(dailyData?.completed || false);
      setDailyTemplateId(dailyData?.templateId || null);
      setDailyTierTitle(dailyData?.title || 'Daily Tier');

      setIsRefreshing(false);
    } catch (error) {
      console.error('Error checking daily tierlist:', error);
      setDailyTierAvailable(false);
      setDailyTierCompleted(false);
      setDailyTemplateId(null);
      setDailyTierTitle('Daily Tier');
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkDailyTierlist();

    // Set up an interval to periodically check the daily tierlist status
    // This helps ensure the UI reflects the current state even after completion
    const intervalId = setInterval(() => {
      checkDailyTierlist();
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  const handleDailyTierClick = async () => {
    // Check daily status again right before navigation to ensure it's up-to-date
    try {
      const dailyData = await fetchDailyTierlist();
      const isCompleted = dailyData?.completed || false;
      const isAvailable = dailyData?.available || false;
      const currentTemplateId = dailyData?.templateId || null;

      if (isCompleted) {
        Alert.alert('Already Completed', "You have already completed today's daily tier list.");
        return;
      }

      if (!isAvailable || !currentTemplateId) {
        Alert.alert(
          'Daily Tier Unavailable',
          "Today's daily tier list is not available right now. Please check back later.",
        );
        console.log('Daily Tier not available');
        return;
      }

      // Navigate to the tierlist screen with the template ID
      router.push({
        pathname: '/tierlists',
        params: { dailyTemplateId: currentTemplateId },
      });
    } catch (error) {
      console.error('Error checking daily tierlist before navigation:', error);
      Alert.alert(
        'Error',
        'There was an error accessing the daily tier list. Please try again later.',
      );
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
    <>
      {/* Sidebar Tab - always visible when sidebar is hidden */}
      <Animated.View
        style={[
          styles.sidebarTab,
          {
            opacity: slideAnim.interpolate({
              inputRange: [-250, -200, 0],
              outputRange: [1, 0.5, 0],
            }),
          },
        ]}
        pointerEvents="box-none"
      >
        {Platform.OS === 'web' ? (
          <Pressable
            style={styles.tabButton}
            onHoverIn={handleTabHover}
            onHoverOut={handleTabHoverExit}
            onPress={handleTriggerTouch}
            testID="sidebar-tab"
          >
            <MaterialIcons name="menu" size={24} color="#FF4B6E" />
          </Pressable>
        ) : (
          <TouchableOpacity
            style={styles.tabButton}
            onPress={handleTriggerTouch}
            testID="sidebar-tab"
          >
            <MaterialIcons name="menu" size={24} color="#FF4B6E" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Sidebar Content */}
      {Platform.OS === 'web' ? (
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
          nativeID="sidebar"
        >
          <Pressable
            style={{ flex: 1 }}
            onHoverIn={handleSidebarHover}
            onHoverOut={handleSidebarHoverExit}
          >
            <Text style={styles.logo}>Love Tiers</Text>

            {/* Daily Tier Link with conditional styling and refresh button */}
            <View style={styles.dailyTierContainer}>
              <TouchableOpacity
                style={[
                  styles.sidebarItem,
                  styles.dailyTierItem,
                  !dailyTierAvailable || dailyTierCompleted ? styles.disabledItem : {},
                ]}
                onPress={handleDailyTierClick}
                disabled={!dailyTierAvailable || dailyTierCompleted}
              >
                <MaterialIcons
                  name="stars"
                  size={24}
                  color={!dailyTierAvailable || dailyTierCompleted ? '#999' : '#FF4B6E'}
                />
                <View style={styles.dailyTierTextContainer}>
                  <Text
                    style={[
                      styles.sidebarText,
                      !dailyTierAvailable || dailyTierCompleted ? styles.disabledText : {},
                    ]}
                  >
                    {dailyTierTitle.length > 20
                      ? dailyTierTitle.substring(0, 17) + '...'
                      : dailyTierTitle || 'Daily Tier'}
                  </Text>
                  {dailyTierCompleted && <Text style={styles.completedTag}>Completed</Text>}
                  {!dailyTierAvailable && !dailyTierCompleted && (
                    <Text style={styles.unavailableTag}>Unavailable</Text>
                  )}
                </View>
              </TouchableOpacity>
              {/* Only show refresh button if not completed */}
              {!dailyTierCompleted && (
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
              )}
            </View>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/my-tiers')}>
              <MaterialIcons name="list" size={24} color="#333" />
              <Text style={styles.sidebarText}>Your Tierlists</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/browse')}>
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

            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/chats')}>
              <MaterialIcons name="chat" size={24} color="#333" />
              <Text style={styles.sidebarText}>Chats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/')}>
              <MaterialIcons name="person" size={24} color="#333" />
              <Text style={styles.sidebarText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#FF4B6E" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
          nativeID="sidebar"
        >
          <Text style={styles.logo}>Love Tiers</Text>

          {/* Daily Tier Link with conditional styling and refresh button */}
          <View style={styles.dailyTierContainer}>
            <TouchableOpacity
              style={[
                styles.sidebarItem,
                styles.dailyTierItem,
                !dailyTierAvailable || dailyTierCompleted ? styles.disabledItem : {},
              ]}
              onPress={handleDailyTierClick}
              disabled={!dailyTierAvailable || dailyTierCompleted}
            >
              <MaterialIcons
                name="stars"
                size={24}
                color={!dailyTierAvailable || dailyTierCompleted ? '#999' : '#FF4B6E'}
              />
              <View style={styles.dailyTierTextContainer}>
                <Text
                  style={[
                    styles.sidebarText,
                    !dailyTierAvailable || dailyTierCompleted ? styles.disabledText : {},
                  ]}
                >
                  {dailyTierTitle.length > 20
                    ? dailyTierTitle.substring(0, 17) + '...'
                    : dailyTierTitle || 'Daily Tier'}
                </Text>
                {dailyTierCompleted && <Text style={styles.completedTag}>Completed</Text>}
                {!dailyTierAvailable && !dailyTierCompleted && (
                  <Text style={styles.unavailableTag}>Unavailable</Text>
                )}
              </View>
            </TouchableOpacity>
            {/* Only show refresh button if not completed */}
            {!dailyTierCompleted && (
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
            )}
          </View>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/my-tiers')}>
            <MaterialIcons name="list" size={24} color="#333" />
            <Text style={styles.sidebarText}>Your Tierlists</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/browse')}>
            <MaterialIcons name="explore" size={24} color="#333" />
            <Text style={styles.sidebarText}>Discover</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/tier-builder')}>
            <MaterialIcons name="build" size={24} color="#333" />
            <Text style={styles.sidebarText}>Tier Builder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/chats')}>
            <MaterialIcons name="chat" size={24} color="#333" />
            <Text style={styles.sidebarText}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => router.push('/')}>
            <MaterialIcons name="person" size={24} color="#333" />
            <Text style={styles.sidebarText}>Profile</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FF4B6E" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
};

export default function Layout() {
  const segments = useSegments();
  const isAuthPage =
    segments.includes('sign-in') || segments.includes('sign-up') || segments.includes('startup');

  // Register WebBrowser handler to ensure Google OAuth callback works
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <StyleProvider>
      <AuthWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <Slot />
          </View>
          {!isAuthPage && <Sidebar />}
        </View>
      </AuthWrapper>
    </StyleProvider>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    width: 250,
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    width: '100%',
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
  triggerArea: {
    position: 'absolute',
    width: 20,
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  sidebarTab: {
    position: 'absolute',
    left: 0,
    top: '50%',
    zIndex: 101,
    transform: [{ translateY: -20 }],
  },
  tabButton: {
    backgroundColor: '#f8f8f8',
    width: 30,
    height: 50,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
});

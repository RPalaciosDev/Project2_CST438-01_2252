import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Animated,
  Image,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuthStore, fetchUserDataFromApi as apiDataFetcher } from '../services/auth';
import { useStyle } from './context/StyleContext';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Define API URL
const API_URL = (() => {
  // For Railway deployment - ensure HTTPS for production
  if (process.env.NODE_ENV === 'production') {
    return 'https://auth-user-service-production.up.railway.app';
  }
  
  // For local development
  return Platform.OS === 'web' 
      ? 'http://localhost:8080' 
      : 'http://10.0.2.2:8080'; // Use 10.0.2.2 for Android emulator
})();

// Define a styled component for the home page
interface ExtendedStyles extends Record<string, any> {
  container: any;
  scrollContainer: any;
  header: any;
  profileImageContainer: any;
  profileImage: any;
  // ... other style properties
  // Include dynamic style names
  defaultPreview: any;
  vibrantPreview: any;
  pinklovePreview: any;
  [key: string]: any; // Index signature for dynamic styles
}

export default function Home() {
  const router = useRouter();
  const { user, logout, token, updateUserGender, updateUserPreferences } = useAuthStore();
  const { selectedStyle, setSelectedStyle } = useStyle();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for dropdowns
  const [pickerValue, setPickerValue] = useState(selectedStyle);
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  
  // Add state for complete user data from API
  const [apiUserData, setApiUserData] = useState<any>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  
  // State to track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Flag to prevent resetting state from user object after initial load
  const initialLoadComplete = useRef(false);
  
  // Animated value for slide-up button - start at -100 to be hidden initially
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Function to check if required fields are missing and redirect to startup
  const checkMissingFieldsAndRedirect = async (data: any) => {
    if (!data) {
      console.warn("Cannot check user data - data is null or undefined");
      // If we have no data at all, redirect to startup to be safe
      useAuthStore.getState().setIsNewUser(true);
      router.replace('/startup');
      return true;
    }
    
    console.log("Checking user data for required fields:", {
      dataType: typeof data,
      hasDataObject: !!data,
      fields: Object.keys(data).join(', ')
    });
    
    // Check for missing critical fields
    const hasGender = data.gender != null && data.gender !== '' && data.gender !== 'undefined';
    const hasLookingFor = data.lookingFor != null && data.lookingFor !== '' && data.lookingFor !== 'undefined';
    const hasAge = data.age != null && data.age > 0;
    
    console.log("Field values:", {
      gender: String(data.gender || ''),
      lookingFor: String(data.lookingFor || ''),
      age: data.age,
      hasGender,
      hasLookingFor,
      hasAge
    });
    
    const needsOnboarding = !hasGender || !hasLookingFor || !hasAge;
    
    if (needsOnboarding) {
      console.warn(`REDIRECTING TO STARTUP: Missing required fields - Gender: ${hasGender}, LookingFor: ${hasLookingFor}, Age: ${hasAge}`);
      // Set isNewUser flag to ensure proper startup flow
      useAuthStore.getState().setIsNewUser(true);
      router.replace('/startup');
      return true;
    }
    
    console.log("All required fields present - no redirection needed");
    return false;
  };
  
  // Immediate check on component mount
  useEffect(() => {
    // Check immediately if user data in store is missing required fields
    const checkUserData = async () => {
      if (user) {
        await checkMissingFieldsAndRedirect(user);
      } else {
        // If there's no user data at all, we should probably redirect
        console.warn("No user data available on first render");
        // Delay this slightly to avoid race conditions
        setTimeout(async () => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            console.warn("Still no user data after timeout - redirecting to startup");
            useAuthStore.getState().setIsNewUser(true);
            router.replace('/startup');
          } else {
            await checkMissingFieldsAndRedirect(currentUser);
          }
        }, 500);
      }
    };
    
    checkUserData();
  }, []);

  // Function to fetch user data directly from API
  const fetchUserDataFromApi = async () => {
    if (!token) {
      console.log('No token available to fetch user data');
      return null;
    }
    
    setIsLoadingUserData(true);
    
    try {
      console.log(`Fetching complete user data from ${API_URL}/api/auth/me`);
      
      // Make sure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Make the request to the /me endpoint
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: formattedToken
        }
      });
      
      if (response.status === 200) {
        console.log('Successfully fetched complete user data');
        console.log('Full user data received:', response.data);
        
        setApiUserData(response.data);
        return response.data;
      } else {
        console.error('Failed to fetch user data, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching complete user data:', error);
      return null;
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Initial load of user data - runs only once
  useEffect(() => {
    const loadAndVerifyUserData = async () => {
      console.log("Home screen mounted, checking user data...");
      
      // First, try to immediately refresh the user data from the backend API
      try {
        const apiData = await apiDataFetcher();
        
        if (apiData) {
          console.log("API data successfully retrieved:", apiData);
          
          // Directly update the auth store with the fresh data from API
          const authStore = useAuthStore.getState();
          const token = await authStore.token;
          
          if (token) {
            // This is critical - we update the auth store with the complete data
            // This ensures the user object in the store has all the required fields
            await authStore.setUser({
              token: token,
              user: apiData // Use the complete API data object
            });
            
            console.log("Auth store updated with fresh API data");
            
            // Check if redirection is needed due to missing fields
            if (await checkMissingFieldsAndRedirect(apiData)) {
              return; // Stop execution if redirected
            }
          }
          
          if (!initialLoadComplete.current) {
            // Use API data directly rather than relying on store data
            const genderValue = apiData.gender || '';
            const lookingForValue = apiData.lookingFor || '';
            
            console.log("Setting initial values from API:", {
              gender: genderValue,
              lookingFor: lookingForValue
            });
            
            setGender(genderValue);
            setLookingFor(lookingForValue);
            setApiUserData(apiData); // Store the API data in component state
            initialLoadComplete.current = true;
          }
        } else {
          // If API call fails, try the store's fetchCompleteUserData method
          console.log("API direct call failed, trying auth store's fetchCompleteUserData...");
          const userData = await useAuthStore.getState().fetchCompleteUserData();
          
          if (userData) {
            console.log("Data successfully retrieved via fetchCompleteUserData");
            // Check for redirection
            await checkMissingFieldsAndRedirect(userData);
          } else {
            console.warn("All attempts to fetch user data failed!");
          }
        }
      } catch (error) {
        console.error("Error fetching API data:", error);
      }
    };
    
    loadAndVerifyUserData();
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        router.replace('/sign-in');
        return;
      }
      
      try {
        const status = await useAuthStore.getState().checkStatus();
        
        if (!status.isAuthenticated) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please sign in again.",
            [{ text: "OK", onPress: () => handleLogout() }]
          );
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };
    
    verifyToken();
    setPickerValue(selectedStyle);
  }, [selectedStyle, token]);
  
  // Check for changes and animate save button accordingly
  useEffect(() => {
    const userGender = user?.gender || '';
    const userLookingFor = user?.lookingFor || '';
    
    const hasGenderChanged = gender !== userGender && gender !== '';
    const hasPreferencesChanged = lookingFor !== userLookingFor && lookingFor !== '';
    
    const newHasChanges = hasGenderChanged || hasPreferencesChanged;
    setHasChanges(newHasChanges);
    
    // Animate the save button
    Animated.timing(slideAnim, {
      toValue: newHasChanges ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
  }, [gender, lookingFor, user]);

  const handleSelection = (itemValue: string) => {
    if (itemValue) {
      console.log("Selected Style:", itemValue);
      setSelectedStyle(itemValue);
      setPickerValue(itemValue);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    router.replace('/sign-in');
    setLoading(false);
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      const userGender = user?.gender || '';
      const userLookingFor = user?.lookingFor || '';
      
      // Save gender if changed
      if (gender !== userGender && gender !== '') {
        await updateUserGender(gender);
      }
      
      // Save preferences if changed
      if (lookingFor !== userLookingFor && lookingFor !== '') {
        await updateUserPreferences(lookingFor);
      }
      
      // Clear the hasChanges flag since we've saved
      setHasChanges(false);
      
      // Force a refresh of user data
      await useAuthStore.getState().checkStatus();
      
      Alert.alert(
        "Changes Saved",
        "Your profile has been updated successfully."
      );
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert(
        "Error",
        "Failed to save changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get a profile picture or default
  const getProfilePicture = () => {
    try {
      const userPicture = (user as any)?.picture;
      if (userPicture) {
        return { uri: userPicture };
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
    return require('../assets/default-profile.jpg');
  };
  
  // Helper function to get gender value with fallbacks
  const getUserGender = () => {
    // First try to get data from direct API call (most accurate)
    if (apiUserData && apiUserData.gender) {
      return apiUserData.gender;
    }
    
    // Fall back to store data
    if (user) {
      // Attempt to log the object in a way that won't be truncated
      console.log("Gender debug - user object stringified:", JSON.stringify(user));
      console.log("Gender debug:", {
        gender: user.gender,
        genderType: typeof user.gender,
        hasGender: !!user.gender,
        allUserKeys: Object.keys(user)
      });
      
      // Check for all possible field names and cases
      const genderValue = 
        user.gender || 
        (user as any).Gender || 
        (user as any).gender_value || 
        (user as any).genderValue || 
        ((user as any).user && (user as any).user.gender);
      
      // Additional logging if not found
      if (!genderValue) {
        // Instead of just warning, refresh API data as a last resort
        apiDataFetcher().then(freshData => {
          if (freshData && freshData.gender) {
            console.log("Gender found in fresh API data:", freshData.gender);
            setApiUserData(freshData);
          } else {
            console.warn("Gender not found in user object or fresh API data");
          }
        });
      }
      
      return genderValue || 'Not set';
    }
    return 'Not set';
  };
  
  // Helper function to get lookingFor value with fallbacks
  const getUserLookingFor = () => {
    // First try to get data from direct API call (most accurate)
    if (apiUserData && apiUserData.lookingFor) {
      return apiUserData.lookingFor;
    }
    
    // Fall back to store data
    if (user) {
      // Attempt to log the object in a way that won't be truncated
      console.log("LookingFor debug - user object stringified:", JSON.stringify(user));
      console.log("LookingFor debug:", {
        lookingFor: user.lookingFor,
        lookingForType: typeof user.lookingFor,
        hasLookingFor: !!user.lookingFor,
        allUserKeys: Object.keys(user)
      });
      
      // Check for all possible field names and cases
      const lookingForValue = 
        user.lookingFor || 
        (user as any).LookingFor || 
        (user as any).looking_for || 
        (user as any).lookingfor || 
        (user as any).interestedIn || 
        (user as any).interested_in || 
        (user as any).preferences ||
        ((user as any).user && (user as any).user.lookingFor);
      
      // Additional logging if not found
      if (!lookingForValue) {
        // Instead of just warning, refresh API data as a last resort
        apiDataFetcher().then(freshData => {
          if (freshData && freshData.lookingFor) {
            console.log("LookingFor found in fresh API data:", freshData.lookingFor);
            setApiUserData(freshData);
          } else {
            console.warn("LookingFor not found in user object or fresh API data");
          }
        });
      }
      
      return lookingForValue || 'Not set';
    }
    return 'Not set';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={getProfilePicture()} 
              style={styles.profileImage} 
            />
          </View>
          <Text style={styles.title}>Welcome, {user?.name || user?.username || 'User'}!</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>👤</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{user?.username || 'Not available'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'Not available'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.userInfo}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>
              {getUserGender()}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.label}>Looking For:</Text>
            <Text style={styles.value}>
              {getUserLookingFor()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dating Preferences</Text>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>❤️</Text>
            </View>
          </View>
          
          <Text style={styles.sectionLabel}>Your Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={gender} 
              onValueChange={setGender} 
              style={styles.picker}
              dropdownIconColor="#FF4B6E"
            >
              <Picker.Item label="Select your gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Non-Binary" value="Non-Binary" />
              <Picker.Item label="Transgender Male" value="Transgender Male" />
              <Picker.Item label="Transgender Female" value="Transgender Female" />
              <Picker.Item label="Other" value="Other" />
              <Picker.Item label="Prefer not to say" value="Prefer not to say" />
            </Picker>
          </View>
          
          <Text style={styles.sectionLabel}>Looking For</Text>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={lookingFor} 
              onValueChange={setLookingFor} 
              style={styles.picker}
              dropdownIconColor="#FF4B6E"
            >
              <Picker.Item label="Who are you interested in?" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Non-Binary" value="Non-Binary" />
              <Picker.Item label="Transgender Male" value="Transgender Male" />
              <Picker.Item label="Transgender Female" value="Transgender Female" />
              <Picker.Item label="Multiple (see bio)" value="Multiple" />
              <Picker.Item label="Everyone" value="Everyone" />
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>App Preferences</Text>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>⚙️</Text>
            </View>
          </View>
          
          <Text style={styles.sectionLabel}>Tier List Theme</Text>
          <View style={styles.pickerContainer}>
            <Picker 
              selectedValue={pickerValue} 
              onValueChange={handleSelection} 
              style={styles.picker}
              dropdownIconColor="#FF4B6E"
            >
              <Picker.Item label="Select your theme style" value="" />
              <Picker.Item label="Default (White Tiers)" value="default" />
              <Picker.Item label="Vibrant (Colorful Tiers)" value="vibrant" />
              <Picker.Item label="PinkLove (Shades of Pink)" value="pinklove" />
            </Picker>
          </View>
          
          {selectedStyle && (
            <View style={styles.selectedStyleContainer}>
              <Text style={styles.selectedStyleLabel}>Current Theme:</Text>
              <View style={[
                styles.stylePreview, 
                // Use a conditional to avoid type issues
                selectedStyle === 'default' ? styles.defaultPreview : 
                selectedStyle === 'vibrant' ? styles.vibrantPreview : 
                selectedStyle === 'pinklove' ? styles.pinklovePreview : null
              ]}>
                <Text style={styles.stylePreviewText}>{selectedStyle}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/tier-builder')}>
          <Text style={styles.buttonText}>Create New Tier List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/browse')}>
          <Text style={styles.secondaryButtonText}>Browse Tier Lists</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Slide-up save button - only render when there are changes */}
      {hasChanges && (
        <Animated.View 
          style={[
            styles.saveButtonContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSaveChanges}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80, // Add extra padding at bottom for the save button
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
    borderRadius: 65,
    padding: 4,
    backgroundColor: 'white',
    shadowColor: '#FF4B6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFE4E8',
    backgroundColor: '#F0F0F0', // Add background color as fallback
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FFD6DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFE4E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE4E8',
    marginVertical: 15,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 110,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F9F9F9',
    marginBottom: 15,
    shadowColor: '#FFE4E8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    color: '#333',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  selectedStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  selectedStyleLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  stylePreview: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  defaultPreview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  vibrantPreview: {
    backgroundColor: '#6C60FF',
  },
  pinklovePreview: {
    backgroundColor: '#FF4B6E',
  },
  stylePreviewText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF4B6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF4B6E',
  },
  secondaryButtonText: {
    color: '#FF4B6E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FFE4E8',
    marginTop: 10,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFE4E8',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  saveButton: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#FF4B6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#FFCCD5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

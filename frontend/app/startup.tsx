import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { axiosInstance } from '../services/auth';

// Conditionally import ImagePicker to handle web/mobile compatibility issues
let ImagePicker: any = null;
if (Platform.OS !== 'web') {
  // Only import on native platforms
  try {
    ImagePicker = require('expo-image-picker');
  } catch (e) {
    console.warn('expo-image-picker not available:', e);
  }
}

// Define API URL - same as in home.tsx
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

enum OnboardingStep {
  NAME = 0,
  AGE_VERIFICATION = 1,
  GENDER_SELECTION = 2,
  DATING_PREFERENCES = 3,
  PROFILE_PICTURE = 4,
}

// Add a Gender type for type safety
type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Transgender Male' | 'Transgender Female' | 'Other' | 'Prefer not to say';

// Dating preference options
type DatingPreference = 'Male' | 'Female' | 'Non-Binary' | 'Transgender Male' | 'Transgender Female' | 'Other';

// Default profile picture URL - this should be replaced with your actual default image
const DEFAULT_PROFILE_PICTURE = require('../assets/default-profile.jpg');

export default function StartupScreen() {
  const router = useRouter();
  const { user, updateUserName, updateUserAge, updateUserGender, updateUserPreferences, updateUserPicture, logout, deleteUserAccount, setIsNewUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.NAME);
  
  // Name step state
  const [name, setName] = useState(user?.name || user?.username || '');
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [nameError, setNameError] = useState('');
  
  // Age verification step state
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  const [isSubmittingAge, setIsSubmittingAge] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Add a state for showing the custom alert modal
  const [showAgeAlert, setShowAgeAlert] = useState(false);
  
  // Add gender selection state
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [isSubmittingGender, setIsSubmittingGender] = useState(false);
  const [genderError, setGenderError] = useState('');
  const [customGender, setCustomGender] = useState('');
  const [showCustomGenderInput, setShowCustomGenderInput] = useState(false);
  
  // Add dating preferences state
  const [selectedPreferences, setSelectedPreferences] = useState<DatingPreference[]>([]);
  const [isSubmittingPreferences, setIsSubmittingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [customPreference, setCustomPreference] = useState('');
  const [showCustomPreferenceInput, setShowCustomPreferenceInput] = useState(false);
  
  // Add profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSubmittingPicture, setIsSubmittingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');
  
  // Log API URL on component mount
  useEffect(() => {
    console.log("StartupScreen: Using API URL:", API_URL);
  }, []);
  
  const saveNameAndContinue = async () => {
    if (!name.trim()) {
      setNameError('Please enter your name');
      return;
    }

    setIsSubmittingName(true);
    setNameError('');
    
    try {
      // Update user's name
      if (name !== user?.name) {
        const success = await updateUserName(name);
        if (!success) {
          throw new Error('Failed to update your name. Please try again.');
        }
      }
      
      // Advance to age verification step
      setCurrentStep(OnboardingStep.AGE_VERIFICATION);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingName(false);
    }
  };
  
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred yet this year, subtract a year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    // Dismiss the picker on Android after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Only update if a date was actually selected
    if (selectedDate && event.type !== 'dismissed') {
      setDateOfBirth(selectedDate);
    }
  };
  
  const handleUnderageUser = async () => {
    if (Platform.OS === 'web') {
      // For web, show our custom modal instead of Alert
      setShowAgeAlert(true);
    } else {
      // For mobile, use Alert component
      Alert.alert(
        "Age Restriction",
        "We're sorry, but you must be at least 18 years old to use this app.",
        [
          {
            text: "OK",
            onPress: async () => {
              await handleAccountDeletion();
            },
          },
        ]
      );
    }
  };
  
  const handleAccountDeletion = async () => {
    try {
      // Delete user account
      console.log("Deleting account for underage user");
      const deleteSuccess = await deleteUserAccount();
      if (!deleteSuccess) {
        console.error("Failed to delete account");
      }
      
      // Log out and redirect to login
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error("Error during account deletion:", error);
      // Force logout even if deletion fails
      await logout();
      router.replace('/sign-in');
    }
  };
  
  const saveAgeAndContinue = async () => {
    setIsSubmittingAge(true);
    setAgeError('');
    
    try {
      const age = calculateAge(dateOfBirth);
      
      // Check if user is underage
      if (age < 18) {
        handleUnderageUser();
        return;
      }
      
      // Update user's age in the database
      const success = await updateUserAge(age);
      if (!success) {
        throw new Error('Failed to update your age information. Please try again.');
      }
      
      // Advance to gender selection instead of completing
      setCurrentStep(OnboardingStep.GENDER_SELECTION);
    } catch (err) {
      setAgeError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingAge(false);
    }
  };
  
  // Add function to save gender and continue to preferences
  const saveGenderAndContinue = async () => {
    if (!selectedGender) {
      setGenderError('Please select your gender');
      return;
    }

    setIsSubmittingGender(true);
    setGenderError('');
    
    try {
      // Get final gender value (which might be custom)
      const finalGender = selectedGender === 'Other' && customGender.trim() 
        ? customGender.trim() 
        : selectedGender;
      
      // Update user's gender in the database
      const success = await updateUserGender(finalGender);
      if (!success) {
        throw new Error('Failed to update your gender information. Please try again.');
      }
      
      // Advance to dating preferences step
      setCurrentStep(OnboardingStep.DATING_PREFERENCES);
    } catch (err) {
      setGenderError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingGender(false);
    }
  };
  
  // Update function to save preferences and continue to profile picture step
  const savePreferencesAndComplete = async () => {
    if (selectedPreferences.length === 0) {
      setPreferencesError('Please select at least one preference');
      return;
    }

    setIsSubmittingPreferences(true);
    setPreferencesError('');
    
    try {
      // Format preferences as comma-separated string
      let preferencesString = selectedPreferences.join(', ');
      
      // Add custom preference if provided
      if (selectedPreferences.includes('Other') && customPreference.trim()) {
        // Replace "Other" with the actual custom value
        preferencesString = preferencesString.replace('Other', customPreference.trim());
      }
      
      // Update user's preferences in the database
      const success = await updateUserPreferences(preferencesString);
      if (!success) {
        throw new Error('Failed to update your preferences. Please try again.');
      }
      
      // Advance to profile picture step instead of completing
      setCurrentStep(OnboardingStep.PROFILE_PICTURE);
    } catch (err) {
      setPreferencesError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingPreferences(false);
    }
  };
  
  // Add function to pick an image from the gallery
  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll just show a message that this feature is only available in the mobile app
        setPictureError('Image upload is only available in the mobile app. Please use the default image or try again on our mobile app.');
        return;
      } else if (ImagePicker) {
        // Native implementation using expo-image-picker
        // Request permission to access the media library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          setPictureError('We need permission to access your photos to set a profile picture.');
          return;
        }
        
        // Launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          // Set the selected image URI
          setProfilePicture(result.assets[0].uri);
          setPictureError('');
        }
      } else {
        setPictureError('Image picker not available on this platform.');
      }
    } catch (error) {
      setPictureError('Error selecting image. Please try again.');
      console.error('Image picking error:', error);
    }
  };
  
  // Add function to save profile picture or use default and complete onboarding
  const savePictureAndComplete = async (useDefault = false) => {
    setIsSubmittingPicture(true);
    setPictureError('');
    
    console.log("savePictureAndComplete: Starting with useDefault =", useDefault);
    
    try {
      // Use default picture if requested or if no picture was selected
      const pictureUrl = useDefault ? DEFAULT_PROFILE_PICTURE : (profilePicture || DEFAULT_PROFILE_PICTURE);
      
      // In a real implementation, we would upload the image to a server here
      // and get back a URL to use. For now, we'll just use the local URI or default URL.
      
      console.log("Updating profile picture with URL:", 
        pictureUrl.length > 30 ? pictureUrl.substring(0, 30) + "..." : pictureUrl);
      
      // Update user's profile picture in the database
      const success = await updateUserPicture(pictureUrl);
      console.log("Profile picture update success:", success);
      
      if (!success) {
        // If the update fails but we're using the default picture,
        // let's still complete the onboarding with a fallback
        if (useDefault || pictureUrl === DEFAULT_PROFILE_PICTURE) {
          console.log("Using fallback approach to complete onboarding");
          
          // Mark user as having completed onboarding in the backend
          try {
            const token = await SecureStore.getItemAsync('token') || localStorage.getItem('token');
            console.log("Token for API call:", token ? "Found token" : "No token available");
            console.log("Making API call to:", `${API_URL}/api/auth/update-profile`);
            
            const formattedToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`, 
              { hasCompletedOnboarding: true },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': formattedToken
                }
              }
            );
            console.log("API call response status:", response.status);
            console.log("API call response data:", JSON.stringify(response.data));
            console.log("Marked user as having completed onboarding in the backend");
          } catch (error) {
            console.error("Failed to mark user as onboarded in backend:", error);
            if (axios.isAxiosError(error)) {
              console.error("API Error details:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
              });
            }
          }
          
          // Mark user as no longer new (completing onboarding)
          setIsNewUser(false);
          
          // Navigate to home page
          console.log("Navigating to home page after completion");
          router.replace('/home');
          return;
        }
        
        throw new Error('Failed to update your profile picture. Please try again or use the default picture.');
      }
      
      // Mark user as having completed onboarding in the backend
      try {
        const token = await SecureStore.getItemAsync('token') || localStorage.getItem('token');
        console.log("Token for API call:", token ? "Found token" : "No token available");
        console.log("Making API call to:", `${API_URL}/api/auth/update-profile`);
        
        const formattedToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
        const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`, 
          { hasCompletedOnboarding: true },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': formattedToken
            }
          }
        );
        console.log("API call response status:", response.status);
        console.log("API call response data:", JSON.stringify(response.data));
        console.log("Marked user as having completed onboarding in the backend");
      } catch (error) {
        console.error("Failed to mark user as onboarded in backend:", error);
        if (axios.isAxiosError(error)) {
          console.error("API Error details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
      }
      
      // Mark user as no longer new (completing onboarding)
      setIsNewUser(false);
      
      // Navigate to home page
      console.log("Navigating to home page after completion");
      router.replace('/home');
    } catch (err) {
      setPictureError(err instanceof Error ? err.message : 'An error occurred. Please try again or use the default picture.');
    } finally {
      setIsSubmittingPicture(false);
    }
  };
  
  const renderNameStep = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Getting Started</Text>
      <Text style={styles.description}>
        LoveTiers helps you create and share tier lists for anything you love.
        Rate, organize, and discover new content with our easy-to-use platform.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>First, tell us your name:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus
          editable={!isSubmittingName}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      </View>
      
      <View style={styles.featureContainer}>
        <FeatureItem 
          title="Create Tier Lists" 
          description="Build personalized tier lists for games, movies, music, and more"
        />
        <FeatureItem 
          title="Share with Friends" 
          description="Share your tier lists and see what others are ranking"
        />
        <FeatureItem 
          title="Join Discussions" 
          description="Chat about your favorite topics and discover new perspectives"
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isSubmittingName && styles.buttonDisabled]} 
        onPress={saveNameAndContinue}
        disabled={isSubmittingName}
      >
        {isSubmittingName ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  const renderAgeVerificationStep = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Age Verification</Text>
      <Text style={styles.description}>
        Please enter your date of birth. You must be at least 18 years old to use LoveTiers.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your date of birth:</Text>
        
        {Platform.OS === 'web' ? (
          // Always show the web version on web platforms
          <View style={styles.webPickerContainer}>
            <View style={styles.webPickerRow}>
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  newDate.setFullYear(newDate.getFullYear() - 1);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>- Year</Text>
              </TouchableOpacity>
              
              <Text style={styles.webPickerValue}>{format(dateOfBirth, 'yyyy')}</Text>
              
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  const newYear = Math.min(newDate.getFullYear() + 1, new Date().getFullYear());
                  newDate.setFullYear(newYear);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>+ Year</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.webPickerRow}>
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>- Month</Text>
              </TouchableOpacity>
              
              <Text style={styles.webPickerValue}>{format(dateOfBirth, 'MMMM')}</Text>
              
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>+ Month</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.webPickerRow}>
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  newDate.setDate(newDate.getDate() - 1);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>- Day</Text>
              </TouchableOpacity>
              
              <Text style={styles.webPickerValue}>{format(dateOfBirth, 'd')}</Text>
              
              <TouchableOpacity 
                style={styles.webPickerButton}
                onPress={() => {
                  const newDate = new Date(dateOfBirth);
                  newDate.setDate(newDate.getDate() + 1);
                  setDateOfBirth(newDate);
                }}
              >
                <Text style={styles.webPickerButtonText}>+ Day</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // For mobile platforms
          <>
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                {format(dateOfBirth, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <View>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display="spinner"
                    onChange={handleDatePickerChange}
                    maximumDate={new Date()}
                    style={styles.datePicker}
                  />
                ) : (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display="default"
                    onChange={handleDatePickerChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}
          </>
        )}
        
        {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
      </View>
      
      <Text style={styles.ageText}>
        Your age: <Text style={styles.ageBold}>{calculateAge(dateOfBirth)}</Text> years old
      </Text>
      
      <Text style={styles.disclaimer}>
        By continuing, you confirm that the date of birth you entered is accurate. 
        Users under 18 years old are not permitted to use this application.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isSubmittingAge && styles.buttonDisabled]} 
        onPress={saveAgeAndContinue}
        disabled={isSubmittingAge}
      >
        {isSubmittingAge ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete & Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Add function to render gender selection step
  const renderGenderSelectionStep = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Tell Us About Yourself</Text>
      <Text style={styles.description}>
        Select your gender to help us personalize your experience.
      </Text>
      
      <View style={styles.genderOptionsContainer}>
        {['Male', 'Female', 'Non-Binary', 'Transgender Male', 'Transgender Female', 'Other', 'Prefer not to say'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.genderOption,
              selectedGender === gender && styles.genderOptionSelected
            ]}
            onPress={() => {
              setSelectedGender(gender as Gender);
              setShowCustomGenderInput(gender === 'Other');
            }}
          >
            <Text 
              style={[
                styles.genderOptionText,
                selectedGender === gender && styles.genderOptionTextSelected
              ]}
            >
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {showCustomGenderInput && (
        <View style={styles.customGenderContainer}>
          <Text style={styles.inputLabel}>Please specify:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your gender"
            value={customGender}
            onChangeText={setCustomGender}
            autoCapitalize="words"
            autoFocus
            editable={!isSubmittingGender}
          />
        </View>
      )}
      
      {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
      
      <Text style={styles.disclaimer}>
        Your information is private and will only be used to enhance your experience.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isSubmittingGender && styles.buttonDisabled]} 
        onPress={saveGenderAndContinue}
        disabled={isSubmittingGender}
      >
        {isSubmittingGender ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Add function to render dating preferences step
  const renderDatingPreferencesStep = () => {
    // Helper function to toggle preference selection
    const togglePreference = (preference: DatingPreference) => {
      if (selectedPreferences.includes(preference)) {
        // Remove preference if already selected
        setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
        if (preference === 'Other') {
          setShowCustomPreferenceInput(false);
        }
      } else {
        // Add preference if not already selected
        setSelectedPreferences([...selectedPreferences, preference]);
        if (preference === 'Other') {
          setShowCustomPreferenceInput(true);
        }
      }
    };
    
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Dating Preferences</Text>
        <Text style={styles.description}>
          Select all genders you're interested in dating. Your selection helps us match you with compatible people.
        </Text>
        
        <View style={styles.preferencesContainer}>
          {['Male', 'Female', 'Non-Binary', 'Transgender Male', 'Transgender Female', 'Other'].map((preference) => (
            <TouchableOpacity
              key={preference}
              style={[
                styles.preferenceOption,
                selectedPreferences.includes(preference as DatingPreference) && styles.preferenceOptionSelected
              ]}
              onPress={() => togglePreference(preference as DatingPreference)}
            >
              <Text 
                style={[
                  styles.preferenceOptionText,
                  selectedPreferences.includes(preference as DatingPreference) && styles.preferenceOptionTextSelected
                ]}
              >
                {preference}
              </Text>
              {selectedPreferences.includes(preference as DatingPreference) && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {showCustomPreferenceInput && (
          <View style={styles.customPreferenceContainer}>
            <Text style={styles.inputLabel}>Please specify:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter other preference"
              value={customPreference}
              onChangeText={setCustomPreference}
              autoCapitalize="words"
              editable={!isSubmittingPreferences}
            />
          </View>
        )}
        
        {preferencesError ? <Text style={styles.errorText}>{preferencesError}</Text> : null}
        
        <Text style={styles.disclaimer}>
          You can always change your preferences later in your profile settings.
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, isSubmittingPreferences && styles.buttonDisabled]} 
          onPress={savePreferencesAndComplete}
          disabled={isSubmittingPreferences}
        >
          {isSubmittingPreferences ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Add function to render profile picture step
  const renderProfilePictureStep = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Add Profile Picture</Text>
      <Text style={styles.description}>
        Upload a profile picture or use our default option. This step is optional and can be skipped.
      </Text>
      
      <View style={styles.profilePictureContainer}>
        <Image
          source={{ uri: profilePicture || DEFAULT_PROFILE_PICTURE }}
          style={styles.profilePicturePreview}
        />
        
        <TouchableOpacity 
          style={styles.pictureButton}
          onPress={pickImage}
          disabled={isSubmittingPicture}
        >
          <Text style={styles.pictureButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
      
      {pictureError ? <Text style={styles.errorText}>{pictureError}</Text> : null}
      
      <Text style={styles.disclaimer}>
        Your profile picture will be visible to other users.
      </Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.secondaryButton, isSubmittingPicture && styles.buttonDisabled]} 
          onPress={async () => {
            // Mark user as having completed onboarding in the backend
            try {
              const token = await SecureStore.getItemAsync('token') || localStorage.getItem('token');
              console.log("Skip button: Token for API call:", token ? "Found token" : "No token available");
              console.log("Skip button: Making API call to:", `${API_URL}/api/auth/update-profile`);
              
              const formattedToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
              const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`, 
                { hasCompletedOnboarding: true },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': formattedToken
                  }
                }
              );
              console.log("Skip button: API call response status:", response.status);
              console.log("Skip button: API call response data:", JSON.stringify(response.data));
              console.log("Marked user as having completed onboarding in the backend (from skip)");
            } catch (error) {
              console.error("Failed to mark user as onboarded in backend:", error);
              if (axios.isAxiosError(error)) {
                console.error("Skip button API Error details:", {
                  status: error.response?.status,
                  data: error.response?.data,
                  message: error.message
                });
              }
            }
            
            // Skip the whole picture step
            setIsNewUser(false);
            console.log("Skip button: Navigating to home page after skipping picture");
            router.replace('/home');
          }}
          disabled={isSubmittingPicture}
        >
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.alternateButton, isSubmittingPicture && styles.buttonDisabled]} 
          onPress={() => savePictureAndComplete(true)}
          disabled={isSubmittingPicture}
        >
          <Text style={styles.alternateButtonText}>Use Default</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isSubmittingPicture && styles.buttonDisabled]} 
          onPress={() => savePictureAndComplete(false)}
          disabled={isSubmittingPicture || !profilePicture}
        >
          {isSubmittingPicture ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            Welcome to LoveTiers{user?.name ? `, ${user.name}` : ''}!
          </Text>
          
          {currentStep === OnboardingStep.NAME && renderNameStep()}
          {currentStep === OnboardingStep.AGE_VERIFICATION && renderAgeVerificationStep()}
          {currentStep === OnboardingStep.GENDER_SELECTION && renderGenderSelectionStep()}
          {currentStep === OnboardingStep.DATING_PREFERENCES && renderDatingPreferencesStep()}
          {currentStep === OnboardingStep.PROFILE_PICTURE && renderProfilePictureStep()}
        </View>
      </ScrollView>
      
      {/* Custom alert modal for web */}
      {Platform.OS === 'web' && (
        <Modal
          visible={showAgeAlert}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Age Restriction</Text>
              <Text style={styles.modalText}>
                We're sorry, but you must be at least 18 years old to use this app.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  setShowAgeAlert(false);
                  await handleAccountDeletion();
                }}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const FeatureItem = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Text style={styles.featureIconText}>✓</Text>
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'web' ? '100%' : '100%',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#FF4B6E',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#FFE4E8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#FFF9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E8',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E8',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#FFE4E8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  datePicker: {
    width: '100%',
    marginTop: 8,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  errorText: {
    color: '#FF4B6E',
    marginTop: 8,
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  featureContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4B6E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  button: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF4B6E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#FFB6C1',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ageText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  ageBold: {
    fontWeight: 'bold',
    color: '#FF4B6E',
  },
  webPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  webPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  webPickerButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  webPickerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  webPickerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF4B6E',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  genderOptionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  genderOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#FFE4E8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  genderOptionSelected: {
    backgroundColor: '#FFE4E8',
    borderColor: '#FF4B6E',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666666',
  },
  genderOptionTextSelected: {
    color: '#FF4B6E',
    fontWeight: 'bold',
  },
  customGenderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  preferencesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  preferenceOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#FFE4E8',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  preferenceOptionSelected: {
    backgroundColor: '#FFE4E8',
    borderColor: '#FF4B6E',
  },
  preferenceOptionText: {
    fontSize: 16,
    color: '#666666',
  },
  preferenceOptionTextSelected: {
    color: '#FF4B6E',
    fontWeight: 'bold',
  },
  customPreferenceContainer: {
    width: '100%',
    marginBottom: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4B6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profilePictureContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  profilePicturePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  pictureButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  pictureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFB6C1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alternateButton: {
    backgroundColor: '#FFB6C1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  alternateButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
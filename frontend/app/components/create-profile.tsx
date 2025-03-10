import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../services/auth';
import axios from 'axios';

export default function CreateProfile() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [interests, setInterests] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      setError('Failed to select image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please add a profile picture');
      return;
    }

    if (!description.trim()) {
      setError('Please add a description about yourself');
      return;
    }

    if (!age.trim()) {
      setError('Please enter your age');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Upload image first
      const formData = new FormData();
      const fileType = image.split('.').pop() || 'jpg';
      
      // Append the image file to FormData
      formData.append('file', {
        uri: image,
        name: `profile_${user?.id}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload image to server
      const imageResponse = await axios.post(
        'http://localhost:8084/api/images/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const imageUrl = imageResponse.data.s3Url;

      // Create profile with image URL
      const profileData = {
        userId: user?.id,
        imageUrl,
        description,
        interests: interests.split(',').map(item => item.trim()),
        age: parseInt(age, 10),
        location,
      };

      // Send profile data to server
      await axios.post(
        'http://localhost:8081/api/profiles',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Navigate to home screen after successful profile creation
      router.replace('/home');
    } catch (err) {
      console.error('Profile creation error:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Your Profile</Text>
          <Text style={styles.subtitle}>Let others get to know you better</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerButtonText}>
                {image ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            maxLength={3}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, State"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>About Me</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Interests</Text>
          <TextInput
            style={styles.input}
            placeholder="Music, Hiking, Movies, etc. (comma separated)"
            value={interests}
            onChangeText={setInterests}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    padding: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    boxShadow: '0px 4px 8px rgba(255, 228, 232, 0.3)',
    elevation: 8,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#FF4B6E',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#FFE4E8',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFE4E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    color: '#FF4B6E',
    fontSize: 16,
  },
  imagePickerButton: {
    backgroundColor: '#FFE4E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  imagePickerButtonText: {
    color: '#FF4B6E',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E8',
    padding: 16,
    borderRadius: 15,
    marginBottom: 16,
    fontSize: 16,
    boxShadow: '0px 2px 3.84px rgba(255, 228, 232, 0.15)',
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    boxShadow: '0px 2px 3.84px rgba(255, 75, 110, 0.25)',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4B6E',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
});
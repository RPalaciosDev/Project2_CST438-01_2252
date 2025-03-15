import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../services/auth';
import axios from 'axios';

// Define the image metadata type
interface ImageMetadata {
  id: string;
  fileName: string;
  s3Url: string;
  uploadedBy: string;
  folder: string;
}

export default function MyTiers() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('https://imageapi-production-af11.up.railway.app/api/images', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('CORS error:', error.message);
      }
      Alert.alert(
        'Error',
        'Failed to load images. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text>Loading images...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>My Tier Lists</Text>
          <Text style={styles.subtitle}>Your uploaded images</Text>
        </View>

        <View style={styles.imageGrid}>
          {images.length === 0 ? (
            <Text style={styles.noImagesText}>No images found</Text>
          ) : (
            images.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.s3Url }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <Text style={styles.imageText} numberOfLines={1}>
                  {image.fileName}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageContainer: {
    width: (windowWidth - 56) / 2, // Accounting for padding and gap
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: (windowWidth - 56) / 2, // Square aspect ratio
  },
  imageText: {
    padding: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  noImagesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
    width: '100%',
  },
}); 
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

// Define the template with images type
interface TemplateWithImages {
  id: string;
  userId: string;
  title: string;
  description: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  images: ImageMetadata[];
}

export default function MyTiers() {
  const [template, setTemplate] = useState<TemplateWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      console.log('Starting template fetch attempt');
      // For debugging, let's try fetching without images first to isolate the issue
      const baseApiUrl = 'https://tier-list-service-production.up.railway.app';
      const templateId = '67d6584e6999d45c678ba23c';
      
      // First try to get just the template without images
      try {
        console.log('Attempting to fetch template without images first');
        const basicResponse = await axios.get(
          `${baseApiUrl}/api/templates/${templateId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
          }
        );
        console.log('Basic template fetch successful:', basicResponse.data);
      } catch (basicError) {
        console.error('Failed to fetch basic template:', basicError);
      }
      
      // Now try with images
      console.log('Now attempting to fetch template with images');
      const apiUrl = `${baseApiUrl}/api/templates/${templateId}/with-images`;
      console.log('Making request to:', apiUrl);
      
      const response = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        }
      );
      setTemplate(response.data);
      console.log('Template fetched successfully:', response.data);
    } catch (error) {
      console.error('Error fetching template:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Error message:', error.message);
        // Log the specific error details from the API if available
        if (error.response?.data?.message) {
          console.error('API error message:', error.response.data.message);
        }
        if (error.response?.data?.error) {
          console.error('API error details:', error.response.data.error);
        }
      }
      Alert.alert(
        'Error',
        `Failed to load template: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text>Loading template...</Text>
      </View>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Tier Lists</Text>
          <Text style={styles.noTemplateText}>Template not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.subtitle}>{template.description}</Text>
          <View style={styles.tagsContainer}>
            {template.tags.map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.imageGrid}>
          {template.images.length === 0 ? (
            <Text style={styles.noImagesText}>No images in this template</Text>
          ) : (
            template.images.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.s3Url }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(e) => console.error('Image loading error:', e.nativeEvent.error, image.s3Url)}
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
    marginBottom: 12,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#FFE0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#FF4B6E',
    fontSize: 12,
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
  noTemplateText: {
    textAlign: 'center',
    color: '#FF4B6E',
    fontSize: 18,
    marginTop: 20,
  },
}); 
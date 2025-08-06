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
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useAuthStore, TIERLIST_API_URL } from '../services/auth';
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
  wasDailyList?: string; // ISO date string
  isCurrentDailyList?: boolean;
}

// Define the template type without images
interface Template {
  id: string;
  userId: string;
  title: string;
  description: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  thumbnailUrl?: string;
  wasDailyList?: string; // ISO date string
}

// Define the completion type
interface Completion {
  id: string;
  userId: string;
  templateId: string;
  completedAt: string;
  templateTitle?: string;
  templateDescription?: string;
  templateThumbnailUrl?: string;
}

// Tab options
type TabType = 'templates' | 'completions';

export default function MyTiers() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchUserTemplates();
    } else {
      fetchUserCompletions();
    }
  }, [activeTab]);

  const fetchUserTemplates = async () => {
    try {
      setLoading(true);
      console.log('Fetching user templates');

      if (!user || !user.id) {
        throw new Error('User ID not available');
      }

      const response = await axios.get(`${TIERLIST_API_URL}/api/templates/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-ID': user.id,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log(`Successfully fetched ${response.data.length} templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching user templates:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to load templates: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCompletions = async () => {
    try {
      setLoading(true);
      console.log('Fetching user completions');

      if (!user || !user.id) {
        throw new Error('User ID not available');
      }

      const response = await axios.get(`${TIERLIST_API_URL}/api/completions/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-ID': user.id,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log(`Successfully fetched ${response.data.length} completions`);
      setCompletions(response.data);
    } catch (error) {
      console.error('Error fetching user completions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to load completions: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateWithImages = async (templateId: string) => {
    try {
      setLoading(true);
      console.log(`Fetching template with images: ${templateId}`);

      const response = await axios.get(
        `${TIERLIST_API_URL}/api/templates/${templateId}/with-images`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      console.log('Successfully fetched template with images');
      setSelectedTemplate(response.data);
    } catch (error) {
      console.error('Error fetching template with images:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to load template details: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTemplatePress = (templateId: string) => {
    fetchTemplateWithImages(templateId);
  };

  const handleCompletionPress = (templateId: string) => {
    fetchTemplateWithImages(templateId);
  };

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'templates' && styles.activeTabButton]}
        onPress={() => setActiveTab('templates')}
      >
        <Text
          style={[styles.tabButtonText, activeTab === 'templates' && styles.activeTabButtonText]}
        >
          My Templates
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'completions' && styles.activeTabButton]}
        onPress={() => setActiveTab('completions')}
      >
        <Text
          style={[styles.tabButtonText, activeTab === 'completions' && styles.activeTabButtonText]}
        >
          Completed Tiers
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => handleTemplatePress(item.id)}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.listItemImage} />
      ) : (
        <View style={[styles.listItemImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listItemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCompletionItem = ({ item }: { item: Completion }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleCompletionPress(item.templateId)}
    >
      {item.templateThumbnailUrl ? (
        <Image source={{ uri: item.templateThumbnailUrl }} style={styles.listItemImage} />
      ) : (
        <View style={[styles.listItemImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {item.templateTitle || 'Unnamed Template'}
        </Text>
        <Text style={styles.listItemDescription} numberOfLines={2}>
          {item.templateDescription || 'No description available'}
        </Text>
        <Text style={styles.completedDate}>
          Completed: {new Date(item.completedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !selectedTemplate && templates.length === 0 && completions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (selectedTemplate) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedTemplate(null)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{selectedTemplate.title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.templateHeader}>
            <Text style={styles.subtitle}>{selectedTemplate.description}</Text>
            <View style={styles.tagsContainer}>
              {selectedTemplate.tags.map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.imageGrid}>
            {selectedTemplate.images.length === 0 ? (
              <Text style={styles.noImagesText}>No images in this template</Text>
            ) : (
              selectedTemplate.images.map((image) => (
                <View key={image.id} style={styles.imageContainer}>
                  <Image
                    source={{ uri: image.s3Url }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e) =>
                      console.error('Image loading error:', e.nativeEvent.error, image.s3Url)
                    }
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tier Lists</Text>
      </View>
      {renderTabSelector()}
      {activeTab === 'templates' ? (
        templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't created any tier lists yet.</Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )
      ) : completions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't completed any tier lists yet.</Text>
        </View>
      ) : (
        <FlatList
          data={completions}
          renderItem={renderCompletionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF4B6E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4B6E',
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF4B6E',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabButtonText: {
    color: '#FF4B6E',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItemImage: {
    width: 120,
    height: 120,
  },
  listItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flex: 1,
  },
  completedDate: {
    fontSize: 12,
    color: '#4CAF50',
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: '#FFE0E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#FF4B6E',
    fontSize: 10,
  },
  moreTagsText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  templateHeader: {
    marginBottom: 24,
    alignItems: 'center',
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageContainer: {
    width: (windowWidth - 48) / 2, // Accounting for padding and gap
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
    height: (windowWidth - 48) / 2, // Square aspect ratio
  },
  imageText: {
    padding: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  noImagesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    padding: 20,
    width: '100%',
  },
});

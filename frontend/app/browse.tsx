import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity, View, Image, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { TIERLIST_API_URL } from '../services/auth';

// Type definitions
type Template = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type TemplatesByTag = {
  [tag: string]: Template[];
};

export default function Browse() {
  const router = useRouter();
  const [topTemplates, setTopTemplates] = useState<Template[]>([]);
  const [templatesByTag, setTemplatesByTag] = useState<TemplatesByTag>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Use the new endpoint we created
      const response = await axios.get(`${TIERLIST_API_URL}/api/templates/all`);
      const allTemplates = response.data;

      // Sort by view count and get top 5
      const sortedByViews = [...allTemplates].sort((a, b) => b.viewCount - a.viewCount);
      setTopTemplates(sortedByViews.slice(0, 5));

      // Organize by tags
      const byTags: TemplatesByTag = {};
      allTemplates.forEach((template: Template) => {
        if (template.tags && template.tags.length > 0) {
          template.tags.forEach(tag => {
            if (!tag) return; // Skip null or empty tags

            if (!byTags[tag]) {
              byTags[tag] = [];
            }
            // Only add if not already in the array
            if (!byTags[tag].some(t => t.id === template.id)) {
              byTags[tag].push(template);
            }
          });
        }
      });

      setTemplatesByTag(byTags);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again later.');
      setLoading(false);
    }
  };

  // Handle template selection - increment view count and navigate
  const handleTemplatePress = async (template: Template) => {
    try {
      // Call the API to increment view count
      // We're using the existing getTemplateById endpoint which already increments the view
      await axios.get(`${TIERLIST_API_URL}/api/templates/${template.id}`);

      // Navigate to the tierlists page with the template ID
      router.push(`/tierlists?templateId=${template.id}`);
    } catch (err) {
      console.error('Error updating view count or navigating:', err);
      // Still navigate even if the view count update fails
      router.push(`/tierlists?templateId=${template.id}`);
    }
  };

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleTemplatePress(item)}
    >
      <Image
        source={{
          uri: item.thumbnailUrl || 'https://via.placeholder.com/150?text=No+Image'
        }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <Text style={styles.templateTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Template[]) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={renderTemplateItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        />
      ) : (
        <Text style={styles.emptyText}>No templates available</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text style={styles.loadingText}>Loading tier lists...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTemplates}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Browse Tier Lists</Text>

      <ScrollView
        showsVerticalScrollIndicator={true}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top viewed templates section - always first */}
        {renderSection('Most Popular', topTemplates)}

        {/* Tag-based sections */}
        {Object.keys(templatesByTag).map(tag => (
          <View key={tag}>
            {renderSection(
              `${tag.charAt(0).toUpperCase() + tag.slice(1)}`,
              templatesByTag[tag]
            )}
          </View>
        ))}

        {/* Add some space at the bottom for better scrolling */}
        <View style={styles.footer} />
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    padding: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginVertical: 15,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  carouselContent: {
    paddingRight: 20,
  },
  templateCard: {
    width: 150,
    marginLeft: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 150,
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  templateTitle: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF4B6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButton: {
    backgroundColor: '#FF4B6E',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: 150,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B6E',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  footer: {
    height: 40,
  }
}); 
import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { TIERLIST_API_URL } from '../services/auth';

// Get screen dimensions for responsive layout
const { width: screenWidth } = Dimensions.get('window');

// Type definitions
type TemplateImage = {
  id: string;
  s3Url: string;
  fileName: string;
};

type Template = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wasDailyList?: string; // ISO date string
  isCurrentDailyList?: boolean;
  images?: TemplateImage[]; // Add images property for full templates
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
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: boolean }>({});
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  // Auto-play timer ref
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Preload all images for the carousel to avoid loading delays
  const preloadCarouselImages = async (templates: Template[]) => {
    if (templates.length === 0) return;

    const imagesToPreload: string[] = [];

    // Collect all unique image URLs from top templates
    templates.forEach(template => {
      if (template.images && template.images.length > 0) {
        template.images.slice(0, 5).forEach(img => {
          if (img.s3Url) imagesToPreload.push(img.s3Url);
        });
      } else if (template.thumbnailUrl) {
        imagesToPreload.push(template.thumbnailUrl);
      }
    });

    // Track preloaded status
    const preloaded: { [key: string]: boolean } = {};

    // Preload all images
    const preloadPromises = imagesToPreload.map(async (imageUrl) => {
      try {
        await Image.prefetch(imageUrl);
        preloaded[imageUrl] = true;
        return true;
      } catch (error) {
        console.error(`Failed to preload image`, error);
        return false;
      }
    });

    await Promise.all(preloadPromises);
    setPreloadedImages(preloaded);
    setIsCarouselReady(true);
  };

  useEffect(() => {
    fetchTemplates();

    // Cleanup function
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, []);

  // Set up auto-rotation for the carousel when templates are loaded
  useEffect(() => {
    // Only start carousel if we have templates, aren't on initial mount, and images are preloaded
    if (topTemplates.length > 0 && !isInitialMount.current && isCarouselReady) {
      // Clear any existing timer
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }

      // Start a new timer for auto rotation - use 4 seconds for more time to load images
      autoplayTimerRef.current = setInterval(() => {
        if (flatListRef.current) {
          try {
            const nextSlide = (activeSlide + 1) % topTemplates.length;
            flatListRef.current.scrollToIndex({
              index: nextSlide,
              animated: true,
              viewPosition: 0.5
            });
            setActiveSlide(nextSlide);
          } catch (error) {
            console.error("Error rotating carousel:", error);
          }
        }
      }, 4000); // 4 seconds
    }

    // Update the ref after first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [topTemplates, activeSlide, isCarouselReady]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Use the new endpoint we created
      const response = await axios.get(`${TIERLIST_API_URL}/api/templates/all`);
      const allTemplates = response.data;

      // Safety check - ensure allTemplates is an array
      if (!Array.isArray(allTemplates)) {
        console.error('Expected array of templates but received:', allTemplates);
        setError('Invalid data format received from server');
        setLoading(false);
        return;
      }

      // Sort by view count and get top 5
      const sortedByViews = [...allTemplates].sort((a, b) => b.viewCount - a.viewCount);
      const top5 = sortedByViews.slice(0, 5);

      if (top5.length === 0) {
        setTopTemplates([]);
        setLoading(false);
        setTemplatesByTag({});
        return;
      }

      // Fetch full details with images for top 5 templates
      const topTemplatesWithImages = await Promise.all(
        top5.map(async (template) => {
          try {
            const detailResponse = await axios.get(
              `${TIERLIST_API_URL}/api/templates/${template.id}/with-images`
            );
            return detailResponse.data;
          } catch (err) {
            console.error(`Error fetching details for template ${template.id}:`, err);
            return template; // Fallback to basic template without images
          }
        })
      );

      setTopTemplates(topTemplatesWithImages);

      // Start preloading images for the carousel
      preloadCarouselImages(topTemplatesWithImages);

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
    if (!template || !template.id) {
      console.error("Cannot handle template press: template is undefined or missing id");
      return;
    }

    try {
      // Call the API to increment view count
      // We're using the existing getTemplateById endpoint which already increments the view
      await axios.get(`${TIERLIST_API_URL}/api/templates/${template.id}`).catch(err => {
        // Log but don't throw error - we still want to navigate
        console.warn(`Error incrementing view count for template ${template.id}:`, err);
      });

      // Navigate to the tierlists page with the template ID
      router.push(`/tierlists?templateId=${template.id}`);
    } catch (err) {
      console.error('Error navigating:', err);
      // Try one more time to navigate
      try {
        router.push(`/tierlists?templateId=${template.id}`);
      } catch (navigateErr) {
        console.error('Second navigation attempt failed:', navigateErr);
        // Show error to user here if needed
      }
    }
  };

  const renderCarouselItem = ({ item, index }: { item: Template, index: number }) => {
    if (!item) {
      console.error('Carousel received undefined item');
      return null;
    }

    // For the main banner, use the template's thumbnail image to maintain consistency
    const mainImageUrl = item.thumbnailUrl ||
      (item.images && item.images.length > 0 ? item.images[0].s3Url : 'https://via.placeholder.com/400?text=No+Image');

    // Get small preview images from the template images
    const previewImageUrls = item.images && item.images.length > 0
      ? item.images.slice(0, 4).map(img => img.s3Url)
      : [];

    // Calculate precise width to ensure proper paging
    const itemWidth = screenWidth - 30; // Full width minus padding

    return (
      <TouchableOpacity
        style={[styles.carouselItem, { width: itemWidth }]}
        onPress={() => handleTemplatePress(item)}
        activeOpacity={0.9}
      >
        {/* Container with background color for letterboxing */}
        <View style={styles.carouselImageContainer}>
          {/* Main background image with preserved aspect ratio */}
          <Image
            source={{ uri: mainImageUrl }}
            style={styles.carouselMainImage}
            resizeMode="contain"
          />
        </View>

        {/* Overlay gradient for better text visibility */}
        <View style={styles.carouselOverlay}>
          {/* Small image previews at the bottom */}
          {previewImageUrls.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {previewImageUrls.map((imageUrl, idx) => (
                <Image
                  key={`preview-${idx}`}
                  source={{ uri: imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Text content */}
          <View style={styles.carouselContent}>
            <Text style={styles.carouselTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
            <Text style={styles.carouselDescription} numberOfLines={3}>{item.description || 'No description'}</Text>
            <View style={styles.viewCountContainer}>
              <Text style={styles.viewCount}>{item.viewCount || 0} views</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTemplateItem = ({ item }: { item: Template }) => {
    if (!item) return null;

    return (
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
        <Text style={styles.templateTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
      </TouchableOpacity>
    );
  };

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
          contentContainerStyle={styles.horizontalListContent}
        />
      ) : (
        <Text style={styles.emptyText}>No templates available</Text>
      )}
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    try {
      if (viewableItems && viewableItems.length > 0) {
        setActiveSlide(viewableItems[0].index);
      }
    } catch (error) {
      console.error('Error in onViewableItemsChanged:', error);
    }
  }).current;

  // Calculate item width for getItemLayout
  const ITEM_WIDTH = screenWidth - 30;

  // Get item layout for FlatList for better performance and proper scrolling
  const getItemLayout = (data: any, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

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
        {/* Featured carousel for top 5 templates */}
        <View style={styles.featuredContainer}>
          <Text style={styles.featuredTitle}>Featured Tier Lists</Text>

          {topTemplates.length > 0 ? (
            <View>
              {!isCarouselReady ? (
                <View style={[styles.carouselLoadingContainer, { width: screenWidth - 30, height: 280 }]}>
                  <ActivityIndicator size="large" color="#FF4B6E" />
                  <Text style={styles.carouselLoadingText}>Loading featured tier lists...</Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={topTemplates}
                  renderItem={renderCarouselItem}
                  keyExtractor={item => item.id}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  decelerationRate="fast"
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                    minimumViewTime: 100
                  }}
                  onScrollToIndexFailed={(info) => {
                    console.warn('Failed to scroll to index', info.index);
                    // Workaround for the error
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                      if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({ index: 0, animated: true });
                        setActiveSlide(0);
                      }
                    });
                  }}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                />
              )}

              {/* Pagination dots */}
              <View style={styles.paginationContainer}>
                {topTemplates.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeSlide ? styles.paginationDotActive : {}
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No featured templates available</Text>
          )}
        </View>

        {/* Categories Header */}
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Categories</Text>
        </View>

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
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  templateCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  templateTitle: {
    padding: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    padding: 15,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B6E',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  backButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
  horizontalListContent: {
    paddingRight: 10,
  },

  // Carousel styles
  featuredContainer: {
    marginBottom: 20,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  carouselItem: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 0, // Remove horizontal margin to ensure proper paging
  },
  carouselImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000', // Background color for letterboxing
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselMainImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 15,
  },
  carouselContent: {
    justifyContent: 'flex-end',
  },
  carouselTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  carouselDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCount: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FF4B6E',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Add the categories header styles
  categoriesHeader: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 25,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  carouselLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  carouselLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 
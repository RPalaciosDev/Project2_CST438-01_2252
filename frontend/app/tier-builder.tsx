import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuthStore } from '../services/auth';
import axios from 'axios';
import { IMAGE_API_URL, TIERLIST_API_URL } from '../services/auth';

// Define the image metadata type
interface ImageMetadata {
  id: string;
  fileName: string;
  s3Url: string;
  uploadedBy: string;
  folder: string;
}

// Define the template type
interface TierTemplate {
  title: string;
  description: string;
  tags: string[];
  systemTags: string[]; // Tags automatically generated from filenames
  imageIds: string[];
  thumbnailUrl?: string;
}

// Define the tag frequency type
interface TagFrequencies {
  frequencies: Record<string, number>;
  lastUpdated: number;
  count: number;
}

export default function TierBuilder() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [tagFrequencies, setTagFrequencies] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<TierTemplate>({
    title: '',
    description: '',
    tags: [],
    systemTags: [],
    imageIds: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const { token, user } = useAuthStore();
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const thumbnailScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchImages();
    fetchTagFrequencies();
  }, []);

  // Control button animation based on selected images
  useEffect(() => {
    Animated.timing(buttonAnimation, {
      toValue: selectedImages.size > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [selectedImages.size]);

  // Properly hide action button when no images selected
  const actionButtonStyles = useMemo(() => {
    return [
      styles.actionButtonContainer,
      {
        transform: [{
          translateY: buttonAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0]
          })
        }],
        opacity: buttonAnimation.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 0.5, 1]
        }),
        pointerEvents: selectedImages.size > 0 ? 'auto' as const : 'none' as const
      }
    ];
  }, [buttonAnimation, selectedImages.size]);

  // Update imageIds whenever selected images change
  useEffect(() => {
    setTemplate(prev => ({
      ...prev,
      imageIds: Array.from(selectedImages)
    }));
  }, [selectedImages]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting image fetch attempt');

      const apiUrl = `${IMAGE_API_URL}/api/images`;
      console.log('Making request to:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Fetched ${response.data.length} images successfully`);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        setError(`Failed to load images: ${error.message}`);
      } else {
        setError('Failed to load images: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTagFrequencies = async () => {
    setLoadingTags(true);
    setTagError(null);

    try {
      console.log('Starting tag frequencies fetch attempt');

      const apiUrl = `${IMAGE_API_URL}/api/tags/frequencies`;
      console.log('Making request to:', apiUrl);

      const response = await axios.get<TagFrequencies>(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Fetched ${response.data.count} tag frequencies`);
      setTagFrequencies(response.data.frequencies);
    } catch (error) {
      console.error('Error fetching tag frequencies:', error);
      setTagError('Failed to load tag frequencies. Falling back to local calculation.');
      // If the API fails, fall back to local calculation
      calculateTagFrequenciesLocally();
    } finally {
      setLoadingTags(false);
    }
  };

  // Fallback method for calculating tag frequencies locally if the API fails
  const calculateTagFrequenciesLocally = () => {
    console.log('Calculating tag frequencies locally');
    const frequencies: Record<string, number> = {};

    images.forEach(image => {
      if (image.fileName) {
        const parts = splitFileName(image.fileName);
        parts.forEach(part => {
          if (part.trim() !== '' && !part.endsWith('.webp') && !part.endsWith('.jpg')) {
            frequencies[part] = (frequencies[part] || 0) + 1;
          }
        });
      }
    });

    setTagFrequencies(frequencies);
  };

  const splitFileName = (fileName: string): string[] => {
    return fileName.split('/');
  };

  // Get all unique filename parts using the fetched tag frequencies
  const uniqueFilenameParts = useMemo(() => {
    // Convert the tag frequencies object into a sorted array of tags
    return Object.keys(tagFrequencies).sort();
  }, [tagFrequencies]);

  // Toggle button selection
  const handleButtonPress = (part: string) => {
    setSelectedParts(prev => {
      const newSelectedParts = new Set(prev);
      if (newSelectedParts.has(part)) {
        newSelectedParts.delete(part);
      } else {
        newSelectedParts.add(part);
      }
      return newSelectedParts;
    });
  };

  // Toggle image selection
  const handleImagePress = (imageId: string) => {
    setSelectedImages(prev => {
      const newSelectedImages = new Set(prev);
      if (newSelectedImages.has(imageId)) {
        newSelectedImages.delete(imageId);
      } else {
        newSelectedImages.add(imageId);
      }
      return newSelectedImages;
    });
  };

  // Filter images based on selected parts
  const filteredImages = useMemo(() => {
    if (selectedParts.size === 0) {
      return [];
    }

    return images.filter(image => {
      const parts = splitFileName(image.fileName);
      return Array.from(selectedParts).some(selectedPart =>
        parts.some(part => part.includes(selectedPart))
      );
    });
  }, [images, selectedParts]);

  // Handle action button press
  const handleActionButtonPress = () => {
    if (selectedImages.size === 0) {
      Alert.alert("No Images Selected", "Please select at least one image to create a tier list.");
      return;
    }

    // Extract tags from filenames of selected images
    const systemTags = new Set<string>();
    selectedImages.forEach(imageId => {
      const image = findImageById(imageId);
      if (image && image.fileName) {
        const parts = splitFileName(image.fileName);
        parts.forEach(part => {
          if (part.trim() !== '' && !part.endsWith('.webp') && !part.endsWith('.jpg') && !part.endsWith('.jpeg') && !part.endsWith('.png')) {
            systemTags.add(part);
          }
        });
      }
    });

    // Update template with system tags and image IDs
    setTemplate(prev => ({
      ...prev,
      systemTags: Array.from(systemTags),
      imageIds: Array.from(selectedImages)
    }));

    setModalVisible(true);
  };

  // Handle adding tags
  const handleAddTags = () => {
    if (tagsInput.trim()) {
      // Split by comma, trim each tag, and filter out empty strings
      const newTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      // Only add non-empty tags to the template
      if (newTags.length > 0) {
        setTemplate(prev => {
          // Make sure prev.tags is an array
          const currentTags = Array.isArray(prev.tags) ? [...prev.tags] : [];
          // Filter out any null or empty values from existing tags
          const cleanedCurrentTags = currentTags
            .filter(tag => tag !== null && tag !== undefined && tag !== '')
            .map(tag => String(tag)); // Convert any non-string values to strings

          return {
            ...prev,
            tags: [...cleanedCurrentTags, ...newTags]
          };
        });
      }
      setTagsInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Clear all selected filters
  const handleClearFilters = () => {
    setSelectedParts(new Set());
    setSelectedImages(new Set());
  };

  // Find image object by ID
  const findImageById = (imageId: string): ImageMetadata | undefined => {
    return images.find(img => img.id === imageId);
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (imageId: string) => {
    const image = findImageById(imageId);
    if (image) {
      setSelectedThumbnail(imageId);
      setTemplate(prev => ({
        ...prev,
        thumbnailUrl: image.s3Url
      }));
    }
  };

  // Handle form submission
  const handleSubmitTemplate = async () => {
    // Validate form
    if (!template.title.trim()) {
      Alert.alert("Error", "Please provide a title for your tier list");
      return;
    }

    if (template.imageIds.length === 0) {
      Alert.alert("Error", "Please select at least one image");
      return;
    }

    // If no thumbnail was explicitly selected but images are present, 
    // use the first selected image as the thumbnail
    let thumbnailUrl = template.thumbnailUrl;
    if (!thumbnailUrl && template.imageIds.length > 0) {
      const firstImage = findImageById(template.imageIds[0]);
      if (firstImage) {
        thumbnailUrl = firstImage.s3Url;
        setTemplate(prev => ({
          ...prev,
          thumbnailUrl: firstImage.s3Url
        }));
      }
    }

    setSubmitting(true);

    try {
      // Debug the entire template state
      console.log('Current template before submission:', JSON.stringify(template, null, 2));

      // Ensure tags is always a clean array with no null values
      const currentTags = Array.isArray(template.tags) ? [...template.tags] : [];
      const currentSystemTags = Array.isArray(template.systemTags) ? [...template.systemTags] : [];

      // Combine both types of tags
      const allTags = [...currentSystemTags, ...currentTags];

      // Ensure each tag is a string and not null/undefined/empty
      const cleanedTags = allTags
        .filter(tag => tag !== null && tag !== undefined && tag !== '')
        .map(tag => String(tag)); // Explicitly convert each tag to a string

      console.log('Cleaned tags:', cleanedTags);
      console.log('Cleaned tags JSON.stringify:', JSON.stringify(cleanedTags));

      // Create the template object to submit
      const templateToSubmit = {
        title: template.title || "", // Never null
        description: template.description || "", // Never null
        tags: cleanedTags.length > 0 ? cleanedTags : [], // Always an array, never null
        imageIds: Array.isArray(template.imageIds) ? template.imageIds : [], // Always an array
        thumbnailUrl: thumbnailUrl || "" // Never null
      };

      console.log('Template to submit:', JSON.stringify(templateToSubmit, null, 2));

      // Send to regular endpoint
      const apiUrl = `${TIERLIST_API_URL}/api/templates`;
      console.log('Submitting template to:', apiUrl);

      const response = await axios.post(apiUrl, templateToSubmit, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-ID': user?.id || 'anonymous',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('Template submitted successfully:', JSON.stringify(response.data, null, 2));

      // Close modal immediately after successful submission
      setModalVisible(false);

      // Then show success message
      Alert.alert(
        "Success",
        "Your tier list template has been created!",
        [{
          text: "OK",
          onPress: () => {
            // Reset states after alert is dismissed
            setTemplate({
              title: '',
              description: '',
              tags: [],
              systemTags: [],
              imageIds: []
            });
            setSelectedThumbnail(null);
            setSelectedImages(new Set());
            setSelectedParts(new Set());
          }
        }]
      );

    } catch (error) {
      console.error('Error submitting template:', error);
      let errorMessage = 'Failed to create tier list template';

      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
        errorMessage = `${errorMessage}: ${error.response.data.message || error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Render image item
  const renderImageItem = ({ item }: { item: ImageMetadata }) => (
    <TouchableOpacity
      style={[
        styles.imageContainer,
        selectedImages.has(item.id) && styles.selectedImageContainer
      ]}
      onPress={() => handleImagePress(item.id)}
      activeOpacity={0.8}
      accessibilityLabel={`Image ${item.fileName.split('/').pop()}`}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedImages.has(item.id) }}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.s3Url }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={`Image from ${item.folder}`}
        />
      </View>
      {selectedImages.has(item.id) && (
        <View style={styles.selectionIndicator}>
          <View style={styles.checkmark} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render tags
  const renderTag = (tag: string, index: number, isSystemTag: boolean) => (
    <View
      key={`${isSystemTag ? 'system' : 'user'}-${index}`}
      style={[
        styles.tag,
        isSystemTag && styles.systemTag
      ]}
    >
      <Text style={[styles.tagText, isSystemTag && styles.systemTagText]}>{tag}</Text>
      {!isSystemTag && (
        <TouchableOpacity
          onPress={() => handleRemoveTag(tag)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityLabel={`Remove tag ${tag}`}
        >
          <Text style={styles.tagRemove}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Thumbnail navigation
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailScrollRef.current) return;

    const scrollAmount = direction === 'left' ? -120 : 120;
    thumbnailScrollRef.current.scrollTo({
      x: scrollAmount,
      animated: true,
    });
  };

  if (loading || loadingTags) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text style={styles.loadingText}>
          {loading ? 'Loading images...' : 'Loading categories...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to Load Images</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchImages}
          accessibilityLabel="Retry loading images"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If there was an error loading tag frequencies but images loaded, 
  // show a warning but continue with local calculations
  const shouldShowTagWarning = tagError && !loadingTags;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal={false}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Select Categories</Text>
            {selectedParts.size > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {shouldShowTagWarning && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                Using locally calculated categories due to server error.
              </Text>
            </View>
          )}

          <View style={styles.filterButtons}>
            {uniqueFilenameParts.map((part) => {
              const count = tagFrequencies[part] || 0;
              return (
                <TouchableOpacity
                  key={part}
                  style={[
                    styles.partButton,
                    selectedParts.has(part) && styles.selectedPartButton
                  ]}
                  onPress={() => handleButtonPress(part)}
                  accessibilityLabel={`${selectedParts.has(part) ? 'Selected ' : ''}Category ${part} (${count} images)`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.partButtonText,
                      selectedParts.has(part) && styles.selectedPartButtonText
                    ]}
                  >
                    {part} <Text style={styles.countText}>({count})</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedParts.size > 0 && (
            <FlatList
              data={filteredImages}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id}
              numColumns={6}
              style={styles.imageList}
              contentContainerStyle={styles.imageListContent}
              initialNumToRender={18}
              maxToRenderPerBatch={24}
              windowSize={5}
              ListEmptyComponent={
                <Text style={styles.noImagesText}>No images match the selected criteria</Text>
              }
              ListFooterComponent={filteredImages.length > 0 ? (
                <Text style={styles.resultCountText}>
                  Showing {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
                </Text>
              ) : null}
            />
          )}
        </ScrollView>

        {/* Action Button */}
        <Animated.View style={actionButtonStyles} pointerEvents={selectedImages.size > 0 ? 'auto' : 'none'}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleActionButtonPress}
          >
            <Text style={styles.actionButtonText}>
              Create Tier List with {selectedImages.size} {selectedImages.size === 1 ? 'image' : 'images'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Template Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Tier List Template</Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Give your tier list a name"
              value={template.title}
              onChangeText={(text) => setTemplate(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your tier list (optional)"
              value={template.description}
              onChangeText={(text) => setTemplate(prev => ({ ...prev, description: text }))}
              multiline
            />

            <Text style={styles.inputLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tags separated by commas"
                value={tagsInput}
                onChangeText={setTagsInput}
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTags}>
                <Text style={styles.tagAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {(template.tags.length > 0 || template.systemTags.length > 0) && (
              <View>
                <Text style={styles.tagSectionLabel}>Tags ({template.systemTags.length} auto-generated, {template.tags.length} custom)</Text>
                <View style={styles.tagsContainer}>
                  {template.systemTags.map((tag, index) => renderTag(tag, index, true))}
                  {template.tags.map((tag, index) => renderTag(tag, index, false))}
                </View>
              </View>
            )}

            <Text style={styles.imagesSelectedText}>
              {template.imageIds.length} images selected
            </Text>

            {template.imageIds.length > 0 && (
              <View style={styles.thumbnailSection}>
                <Text style={styles.inputLabel}>Select Thumbnail</Text>
                <Text style={styles.thumbnailHelp}>Choose an image to represent this tier list</Text>

                <View style={styles.thumbnailNavigation}>
                  <ScrollView
                    ref={thumbnailScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.thumbnailScroll}
                  >
                    {template.imageIds.map(imageId => {
                      const image = findImageById(imageId);
                      if (!image) return null;

                      return (
                        <TouchableOpacity
                          key={imageId}
                          style={[
                            styles.thumbnailOption,
                            selectedThumbnail === imageId && styles.thumbnailSelected
                          ]}
                          onPress={() => handleThumbnailSelect(imageId)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: image.s3Url }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                          {selectedThumbnail === imageId && (
                            <View style={styles.thumbnailCheck}>
                              <Text style={styles.thumbnailCheckText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.navButtonsContainer}>
                    <TouchableOpacity
                      style={styles.navButton}
                      accessibilityLabel="Previous thumbnail"
                      onPress={() => scrollThumbnails('left')}
                    >
                      <Text style={styles.navButtonText}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.navButton}
                      accessibilityLabel="Next thumbnail"
                      onPress={() => scrollThumbnails('right')}
                    >
                      <Text style={styles.navButtonText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitTemplate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Template</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Reduced padding to account for action button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for the action button
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  partButton: {
    backgroundColor: '#FFE0E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 6,
  },
  selectedPartButton: {
    backgroundColor: '#FF4B6E',
  },
  partButtonText: {
    color: '#FF4B6E',
    fontWeight: '500',
  },
  selectedPartButtonText: {
    color: '#FFFFFF',
  },
  imageList: {
    flex: 1,
    marginTop: 16,
  },
  imageListContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    maxWidth: '16%',
  },
  selectedImageContainer: {
    borderWidth: 2,
    borderColor: '#FF4B6E',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1, // Square aspect ratio for the container
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF4B6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 8,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#FFF',
    transform: [{ rotate: '-45deg' }],
  },
  noImagesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  actionButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginRight: 8,
  },
  tagAddButton: {
    backgroundColor: '#FF4B6E',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tagAddButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#FFE0E5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    alignItems: 'center',
  },
  tagText: {
    color: '#FF4B6E',
    marginRight: 4,
    fontSize: 12,
  },
  tagRemove: {
    color: '#FF4B6E',
    fontWeight: 'bold',
    fontSize: 16,
    width: 16,
    textAlign: 'center',
  },
  imagesSelectedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF4B6E',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FFB6C1',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF4B6E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  clearButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  resultCountText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
    fontSize: 14,
  },
  thumbnailSection: {
    marginBottom: 20,
  },
  thumbnailHelp: {
    color: '#666',
    marginBottom: 8,
  },
  thumbnailNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailScroll: {
    flex: 1,
  },
  thumbnailOption: {
    width: 100,
    height: 100,
    marginRight: 8,
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: '#FF4B6E',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4B6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailCheckText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningBanner: {
    backgroundColor: '#FFE0E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#FF4B6E',
    fontWeight: 'bold',
  },
  countText: {
    color: '#666',
    fontSize: 14,
  },
  systemTag: {
    backgroundColor: '#E0E5FF',
    borderWidth: 1,
    borderColor: '#4B6EFF',
  },
  systemTagText: {
    color: '#4B6EFF',
  },
  tagSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
}); 
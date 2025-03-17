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
  imageIds: string[];
}

export default function TierBuilder() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<TierTemplate>({
    title: '',
    description: '',
    tags: [],
    imageIds: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const { token, userId } = useAuthStore();

  useEffect(() => {
    fetchImages();
  }, []);

  // Control button animation based on selected images
  useEffect(() => {
    Animated.timing(buttonAnimation, {
      toValue: selectedImages.size > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [selectedImages.size]);

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

  const splitFileName = (fileName: string): string[] => {
    return fileName.split('/');
  };

  // Get all unique filename parts from all images
  const uniqueFilenameParts = useMemo(() => {
    const allParts = new Set<string>();
    
    images.forEach(image => {
      const parts = splitFileName(image.fileName);
      parts.forEach(part => {
        if (part.trim() !== '' && !part.endsWith('.webp') && !part.endsWith('.jpg')) {
          allParts.add(part);
        }
      });
    });
    
    return Array.from(allParts).sort();
  }, [images]);

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
    setModalVisible(true);
  };

  // Handle adding tags
  const handleAddTags = () => {
    if (tagsInput.trim()) {
      const newTags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
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

    setSubmitting(true);

    try {
      const apiUrl = `${TIERLIST_API_URL}/api/templates`;
      console.log('Submitting template to:', apiUrl);
      
      // Remove userId and viewCount from request body - only send the TierlistTemplateRequest fields
      const templateToSubmit = {
        title: template.title,
        description: template.description,
        tags: template.tags,
        imageIds: template.imageIds
      };
      
      console.log('Template to submit:', templateToSubmit);
      
      const response = await axios.post(apiUrl, templateToSubmit, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-ID': userId || 'anonymous' // Add the X-User-ID header as required by the controller
        }
      });
      
      console.log('Template submitted successfully:', response.data);
      
      // Reset form and close modal
      setTemplate({
        title: '',
        description: '',
        tags: [],
        imageIds: []
      });
      setModalVisible(false);
      
      // Clear selections immediately after successful submission
      setSelectedImages(new Set());
      setSelectedParts(new Set());
      
      // Show success message
      Alert.alert(
        "Success",
        "Your tier list template has been created successfully!",
        [
          { 
            text: "OK", 
            onPress: () => {
              // No need to clear selections again here since we already did it
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting template:', error);
      let errorMessage = 'Failed to create template. Please try again.';
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage = `Error: ${error.response.data.message || error.message}`;
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
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: item.s3Url }} 
          style={styles.image} 
          resizeMode="contain"
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
  const renderTag = (tag: string, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.tag}
      onPress={() => handleRemoveTag(tag)}
    >
      <Text style={styles.tagText}>{tag}</Text>
      <Text style={styles.tagRemove}>×</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
      </View>
    );
  }

  if (error) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.buttonContainer} horizontal={false}>
        <View style={styles.filterButtons}>
          {uniqueFilenameParts.map((part) => (
            <TouchableOpacity
              key={part}
              style={[
                styles.partButton,
                selectedParts.has(part) && styles.selectedPartButton
              ]}
              onPress={() => handleButtonPress(part)}
            >
              <Text 
                style={[
                  styles.partButtonText,
                  selectedParts.has(part) && styles.selectedPartButtonText
                ]}
              >
                {part}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedParts.size > 0 && (
          <FlatList
            data={filteredImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={styles.imageList}
            contentContainerStyle={styles.imageListContent}
            ListEmptyComponent={
              <Text style={styles.noImagesText}>No images match the selected criteria</Text>
            }
          />
        )}
      </ScrollView>

      {/* Action Button */}
      <Animated.View
        style={[
          styles.actionButtonContainer,
          {
            transform: [{
              translateY: buttonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleActionButtonPress}
        >
          <Text style={styles.actionButtonText}>
            Create Tier List with {selectedImages.size} {selectedImages.size === 1 ? 'image' : 'images'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Template Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
            
            {template.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {template.tags.map(renderTag)}
              </View>
            )}
            
            <Text style={styles.imagesSelectedText}>
              {template.imageIds.length} images selected
            </Text>
            
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
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  selectedImageContainer: {
    borderWidth: 3,
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
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4B6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
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
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  tagRemove: {
    color: '#FF4B6E',
    fontWeight: 'bold',
    fontSize: 16,
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
}); 
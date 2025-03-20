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
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuthStore, TIERLIST_API_URL } from '../services/auth';
import axios from 'axios';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

// Define a simpler template type for the listing
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
}

// Define template request for update
interface TemplateRequest {
  title: string;
  description: string;
  tags: string[];
  imageIds?: string[];
  thumbnailUrl?: string;
}

export default function MyTiers() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<TemplateRequest>({
    title: '',
    description: '',
    tags: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    fetchUserTemplates();
  }, []);

  const fetchUserTemplates = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'You need to be logged in to view your tier lists');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching templates for user:', user.id);

      const response = await axios.get(
        `${TIERLIST_API_URL}/api/templates/user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-ID': user.id
          },
        }
      );

      setTemplates(response.data);
      console.log('Templates fetched successfully:', response.data.length);
    } catch (error) {
      console.error('Error fetching templates:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to load your tier lists: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserTemplates();
  };

  const navigateToTemplate = (templateId: string) => {
    router.push(`/tierlists/${templateId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openEditModal = (template: Template) => {
    setCurrentTemplate(template);
    setEditedTemplate({
      title: template.title,
      description: template.description || '',
      tags: [...template.tags],
      thumbnailUrl: template.thumbnailUrl
    });
    setTagsInput('');
    setModalVisible(true);
  };

  const handleAddTags = () => {
    if (!tagsInput.trim()) return;

    const newTags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '' && !editedTemplate.tags.includes(tag));

    if (newTags.length > 0) {
      setEditedTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpdateTemplate = async () => {
    if (!currentTemplate || !user) return;

    if (!editedTemplate.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Updating template:', currentTemplate.id);

      await axios.put(
        `${TIERLIST_API_URL}/api/templates/${currentTemplate.id}`,
        editedTemplate,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-ID': user.id
          },
        }
      );

      console.log('Template updated successfully');
      setModalVisible(false);
      fetchUserTemplates();
      Alert.alert('Success', 'Tier list updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to update tier list: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate || !user) return;

    try {
      setSubmitting(true);
      console.log('Deleting template:', currentTemplate.id);

      await axios.delete(
        `${TIERLIST_API_URL}/api/templates/${currentTemplate.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-ID': user.id
          },
        }
      );

      console.log('Template deleted successfully');
      setDeleteConfirmVisible(false);
      setModalVisible(false);
      fetchUserTemplates();
      Alert.alert('Success', 'Tier list deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      Alert.alert(
        'Error',
        `Failed to delete tier list: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`
      );
    } finally {
      setSubmitting(false);
      setDeleteConfirmVisible(false);
    }
  };

  // Render tags
  const renderTag = (tag: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.tagPill}
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
        <Text>Loading your tier lists...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tier Lists</Text>
        {templates.length === 0 && !loading && (
          <Text style={styles.emptyMessage}>You haven't created any tier lists yet</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF4B6E"]}
          />
        }
      >
        {templates.map((template) => (
          <View key={template.id} style={styles.templateCard}>
            <View style={styles.templateHeader}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{template.viewCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{formatDate(template.createdAt)}</Text>
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {template.description || 'No description provided'}
              </Text>

              {template.thumbnailUrl && (
                <Image
                  source={{ uri: template.thumbnailUrl }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.tagsContainer}>
                {template.tags && template.tags.map((tag, index) => (
                  <View key={index} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {(!template.tags || template.tags.length === 0) && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>No tags</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(template)}
              >
                <Ionicons name="create-outline" size={20} color="#FF4B6E" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/tier-builder')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New Tier List</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Template Modal */}
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
            <Text style={styles.modalTitle}>Edit Tier List</Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tier list name"
              value={editedTemplate.title}
              onChangeText={(text) => setEditedTemplate(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your tier list (optional)"
              value={editedTemplate.description}
              onChangeText={(text) => setEditedTemplate(prev => ({ ...prev, description: text }))}
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

            {editedTemplate.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {editedTemplate.tags.map(renderTag)}
              </View>
            )}

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDelete}
                disabled={submitting}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateTemplate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>Delete Tier List?</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this tier list? This action cannot be undone.
            </Text>

            <View style={styles.confirmButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelConfirmButton}
                onPress={cancelDelete}
                disabled={submitting}
              >
                <Text style={styles.cancelConfirmText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleDeleteTemplate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E5',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#FFE0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#FF4B6E',
    fontSize: 12,
  },
  tagRemove: {
    color: '#FF4B6E',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FF4B6E',
    fontSize: 14,
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: '#FF4B6E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    fontSize: 16,
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
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    marginRight: 8,
  },
  tagAddButton: {
    backgroundColor: '#FFE0E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagAddButtonText: {
    color: '#FF4B6E',
    fontWeight: 'bold',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#FF4B6E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  deleteButtonText: {
    color: '#FF4B6E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Confirm modal styles
  confirmModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelConfirmButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelConfirmText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF4B6E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
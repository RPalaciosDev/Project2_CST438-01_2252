import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../services/auth';
import axios from 'axios';
import { CHAT_API_URL } from '../../services/api';
import WebSocketService from '../../services/websocket';

// Define types for conversations
interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: number;
  };
  username?: string; // This will be filled in after fetching user details
}

export default function Chats() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch conversations
  const fetchConversations = async () => {
    if (!user || !token) {
      console.error('User or token not available');
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching conversations from ${CHAT_API_URL}/api/conversations/user/${user.id}`);
      const response = await axios.get(`${CHAT_API_URL}/api/conversations/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Conversations API response:', response.status, Array.isArray(response.data) ? response.data.length : 'not array');

      if (response.data) {
        if (!Array.isArray(response.data)) {
          console.error('Expected array response but got:', response.data);
          setConversations([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        console.log(`Found ${response.data.length} conversations`);

        // Process conversations to get usernames for each participant
        const processedConversations = await Promise.all(
          response.data.map(async (conv: Conversation) => {
            console.log('Processing conversation:', conv.id || conv.conversationId, 'participants:', conv.participants);

            // Find the other user in the conversation
            const otherUserId = conv.participants?.find(id => id !== user.id);

            if (otherUserId) {
              try {
                console.log(`Fetching user details for ${otherUserId}`);
                // Fetch user details (ideally this would come from a user service)
                const userResponse = await axios.get(`${CHAT_API_URL}/api/users/${otherUserId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                console.log('User details response:', userResponse.data);

                return {
                  ...conv,
                  username: userResponse.data.username || 'Unknown User',
                };
              } catch (error) {
                console.error('Error fetching user details:', error);
                return {
                  ...conv,
                  username: 'Unknown User',
                };
              }
            }
            return conv;
          })
        );

        console.log('Processed conversations:', processedConversations);
        setConversations(processedConversations);
      } else {
        console.log('No conversations data in response');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.status, error.response?.data);
      }
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Listen for new matches and refresh conversations
  useEffect(() => {
    if (user && token) {
      // Ensure WebSocket is connected
      if (!WebSocketService.isConnected) {
        WebSocketService.connect(user.id, token)
          .then(() => {
            console.log('WebSocket connected in Chats view');
          })
          .catch((error) => {
            console.error('Failed to connect to WebSocket:', error);
          });
      }

      // Register for match notifications
      WebSocketService.registerCallback('match', (matchData: { userId: string; matchId: string }) => {
        console.log('Received match notification in Chats view, refreshing conversations:', matchData);
        // Force refresh after a short delay to ensure backend has time to create the conversation
        setTimeout(() => {
          console.log('Refreshing conversations after match notification');
          fetchConversations();
        }, 1000);
      });

      // Fetch initial conversations
      console.log('Fetching initial conversations for user', user.id);
      fetchConversations();
    }

    return () => {
      // Clean up on unmount
      WebSocketService.unregisterCallback('match');
    };
  }, [user, token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtext}>
            When you match with someone, your conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id || item.conversationId?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => {
                console.log('Navigating to conversation:', item.id || item.conversationId);
                router.push({
                  pathname: '/chats/conversation',
                  params: {
                    chatId: item.conversationIdString || item.id || item.conversationId?.toString()
                  }
                });
              }}
            >
              <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
              <Text style={styles.lastMessage}>
                {item.lastMessage?.text || "Start a conversation!"}
              </Text>
              {item.lastMessage?.timestamp && (
                <Text style={styles.timestamp}>
                  {new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              )}
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF4B6E',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


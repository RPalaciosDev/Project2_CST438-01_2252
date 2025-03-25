import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../services/auth';
import axios from 'axios';
import { CHAT_API_URL } from '../../services/api';
import WebSocketService from '../../services/websocket';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp?: number;
}

// Define types for the message data
interface NewMessageData {
  id: string;
  sender: string;
  text: string;
  conversationId: string;
  timestamp?: number;
}

export default function ChatScreen() {
  const { chatId, matchId } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const connectWebSocket = async () => {
      if (user && token) {
        try {
          console.log('Attempting to connect to WebSocket service...');
          // Add a timeout for the connection to prevent hanging
          const connectPromise = WebSocketService.connect(user.id, token);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000)
          );

          // Race the connection against a timeout
          await Promise.race([connectPromise, timeoutPromise]);
          setConnected(true);
          console.log('Successfully connected to WebSocket');

          // Register callback for new messages
          WebSocketService.registerCallback('newMessage', (newMessage: NewMessageData) => {
            if (newMessage.conversationId === chatId) {
              setMessages(prev => [newMessage, ...prev]);
            }
          });

          // Subscribe to conversation topic
          WebSocketService.subscribe(`/topic/chat/${chatId}`, (message: { body: string }) => {
            const msgData = JSON.parse(message.body);
            setMessages(prev => [{
              id: msgData.id || Date.now().toString(),
              sender: msgData.sender,
              text: msgData.text,
              timestamp: msgData.timestamp
            }, ...prev]);
          });

        } catch (error) {
          console.error('WebSocket connection error:', error);
          setConnected(false);

          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    // Load existing messages
    loadMessages();

    return () => {
      // Clean up subscriptions when component unmounts
      if (WebSocketService.isConnected) {
        WebSocketService.unsubscribe(`/topic/chat/${chatId}`);
        WebSocketService.unregisterCallback('newMessage');
      }
    };
  }, [user, token, chatId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${CHAT_API_URL}/api/conversations/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setMessages(response.data.map((msg: any) => ({
          id: msg.id,
          sender: msg.senderId,
          text: msg.content,
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !connected) return;

    const newMessage = {
      sender: user?.id,
      text: message.trim(),
      conversationId: chatId,
      timestamp: Date.now()
    };

    // Send via WebSocket
    WebSocketService.sendMessage(`/chat/send/${chatId}`, newMessage);

    // Optimistically add to UI
    setMessages(prev => [{
      id: Date.now().toString(),
      sender: user?.id || 'You',
      text: message.trim(),
      timestamp: Date.now()
    }, ...prev]);

    // Clear input
    setMessage('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!connected && (
        <View style={styles.connectionWarning}>
          <Text style={styles.warningText}>Messaging unavailable. Reconnecting...</Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.message,
            item.sender === user?.id ? styles.sent : styles.received
          ]}>
            <Text style={item.sender === user?.id ? styles.sentText : styles.receivedText}>
              {item.text}
            </Text>
            {item.timestamp && (
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        )}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.disabledButton]}
          onPress={sendMessage}
          disabled={!message.trim() || !connected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFF5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  connectionWarning: {
    backgroundColor: '#FFD7D7',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  warningText: {
    color: '#FF4B6E',
    textAlign: 'center',
  },
  message: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF4B6E',
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  sentText: {
    color: '#FFF',
  },
  receivedText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#DDD',
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#FF4B6E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#FFB0C0',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

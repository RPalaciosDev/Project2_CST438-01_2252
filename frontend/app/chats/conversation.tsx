import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ConversationScreen() {
    const { chatId, userId } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(chatId as string || null);
    const [otherUser, setOtherUser] = useState<{ id: string; username: string } | null>(null);

    // Fetch or create conversation if needed
    useEffect(() => {
        const initializeConversation = async () => {
            if (!user || !token) {
                console.error('User or token not available');
                return;
            }

            // If we have a chatId, use it
            if (chatId) {
                console.log('Using provided chatId:', chatId);
                setConversationId(chatId as string);
                return;
            }

            // If we have a userId, need to get or create conversation
            if (userId) {
                try {
                    console.log('Creating conversation with userId:', userId);
                    // First try to fetch user details
                    const userResponse = await axios.get(`${CHAT_API_URL}/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (userResponse.data) {
                        console.log('User details:', userResponse.data);
                        setOtherUser({
                            id: userResponse.data.id,
                            username: userResponse.data.username || 'Match'
                        });
                    }

                    // Find existing conversation or create new one
                    console.log('Checking for existing conversations');
                    const conversationsResponse = await axios.get(`${CHAT_API_URL}/api/conversations/user/${user.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Check if conversation with this user already exists
                    let existingConversation = null;
                    if (conversationsResponse.data && Array.isArray(conversationsResponse.data)) {
                        console.log('Found conversations:', conversationsResponse.data.length);
                        existingConversation = conversationsResponse.data.find(
                            (c: any) => c.participants && c.participants.includes(userId as string)
                        );

                        if (existingConversation) {
                            console.log('Found existing conversation:', existingConversation);
                        }
                    }

                    if (existingConversation) {
                        const convId = existingConversation.conversationIdString || existingConversation.id || existingConversation.conversationId;
                        console.log('Using existing conversation:', convId);
                        setConversationId(convId);
                    } else {
                        // Create new conversation
                        console.log('Creating new conversation with participants:', [user.id, userId]);
                        const createResponse = await axios.post(`${CHAT_API_URL}/api/conversations`, {
                            participants: [user.id, userId]
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        console.log('Creation response:', createResponse.data);

                        if (createResponse.data) {
                            const newConvId = createResponse.data.conversationIdString ||
                                createResponse.data.id ||
                                createResponse.data.conversationId;
                            console.log('Created new conversation with ID:', newConvId);
                            setConversationId(newConvId);
                        }
                    }
                } catch (error) {
                    console.error('Error initializing conversation:', error);
                    if (axios.isAxiosError(error)) {
                        console.error('Axios error details:', error.response?.status, error.response?.data);
                    }
                }
            }
        };

        initializeConversation();
    }, [user, token, chatId, userId, CHAT_API_URL]);

    // Connect to WebSocket and load messages once we have a conversation ID
    useEffect(() => {
        if (!conversationId) return;

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
                        if (newMessage.conversationId === conversationId) {
                            setMessages(prev => [newMessage, ...prev]);
                        }
                    });

                    // Subscribe to conversation topic
                    WebSocketService.subscribe(`/topic/chat/${conversationId}`, (message: { body: string }) => {
                        try {
                            const msgData = JSON.parse(message.body);
                            setMessages(prev => [{
                                id: msgData.id || Date.now().toString(),
                                sender: msgData.sender,
                                text: msgData.text,
                                timestamp: msgData.timestamp
                            }, ...prev]);
                        } catch (error) {
                            console.error('Error processing message:', error);
                        }
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
        loadMessages();

        return () => {
            // Clean up subscriptions when component unmounts
            if (WebSocketService.isConnected) {
                WebSocketService.unsubscribe(`/topic/chat/${conversationId}`);
                WebSocketService.unregisterCallback('newMessage');
            }
        };
    }, [user, token, conversationId]);

    const loadMessages = async () => {
        if (!conversationId || !token) {
            console.log('Cannot load messages: missing conversationId or token');
            return;
        }

        setLoading(true);
        try {
            console.log(`Loading messages for conversation ${conversationId}`);
            const response = await axios.get(`${CHAT_API_URL}/api/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Messages response:', response.status, Array.isArray(response.data) ? `${response.data.length} messages` : 'not an array');

            if (response.data && Array.isArray(response.data)) {
                const messagesList = response.data.map((msg: any) => ({
                    id: msg.id || msg._id || Date.now().toString(),
                    sender: msg.senderId,
                    text: msg.content,
                    timestamp: msg.timestamp
                }));
                console.log(`Loaded ${messagesList.length} messages`);
                setMessages(messagesList);
            } else {
                console.log('No messages found or invalid response format');
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            if (axios.isAxiosError(error)) {
                console.error('Axios error details:', error.response?.status, error.response?.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = () => {
        if (!message.trim() || !connected || !conversationId) return;

        const newMessage = {
            sender: user?.id,
            text: message.trim(),
            conversationId: conversationId,
            timestamp: Date.now()
        };

        // Send via WebSocket
        WebSocketService.sendMessage(`/chat/send/${conversationId}`, newMessage);

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
                <Text>Loading conversation...</Text>
            </View>
        );
    }

    if (!conversationId) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Could not load conversation</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Back to Chats</Text>
                </TouchableOpacity>
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
        paddingVertical: 8,
        backgroundColor: '#FFF',
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#FF4B6E',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#FFB0C0',
    },
    sendButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#FF4B6E',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
}); 
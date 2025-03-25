import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useLocalSearchParams } from 'expo-router';
import useAuthStore, { CHAT_API_URL } from 'services/auth';
import { randomUUID } from 'crypto';

export default function ChatScreen() {
    const { chatId } = useLocalSearchParams();
    const { user } = useAuthStore();
    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const stompClientRef = useRef(null);

    console.log('ChatScreen', chatId);

    useEffect(() => {
        if (!chatId) {
            return;
        }

        fetch(`${CHAT_API_URL}/api/chat/${chatId}`, {
            headers: {
                'X-User-Id': user?.id || '',
            }
        })
            .then((response) => response.json())
            .then((data) => {
                const messages = data?.map((message) => ({
                    id: message?.id,
                    sender: message?.senderId === user?.id ? 'You' : 'Other',
                    content: message?.message,
                }));
                console.log('Chat messages:', messages);
                setChatMessages(messages);
            })
            .catch((error) => {
                console.error('Failed to fetch chat messages:', error);
            });
    }, [chatId]);

    useEffect(() => {
        const socket = new SockJS(`${CHAT_API_URL}/ws`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: (str) => {
                // console.log(str);
            },
            onConnect: () => {
                console.log('Connected to WebSocket');
                stompClient.subscribe('/topic/public', (response) => {
                    console.log('Received message:', response.body);
                });

                stompClient.subscribe(`/topic/${chatId}`, (response) => {
                    console.log('Received message:', response.body);
                    const message = JSON.parse(response.body);
                    setChatMessages((prev) => [...prev, message]);
                });

                stompClient.publish({
                    destination: '/chat/addUser',
                    body: JSON.stringify({
                        sender: user?.id,
                        type: "JOIN"
                    })
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        stompClient.activate();
        // @ts-ignore
        stompClientRef.current = stompClient;

        return () => {
            stompClient.deactivate();
        };
    }, [chatId]);

    const sendMessage = () => {
        const stompClient = stompClientRef.current;
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/chat/sendMessage/' + chatId,
                body: JSON.stringify({
                    sender: user?.id,
                    content: message,
                    conversationId: chatId,
                    id: randomUUID(),
                    type: 'CHAT'
                }),
            });
        } else {
            console.error('Stomp client is not connected');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={chatMessages}
                keyExtractor={(item) => item?.id}
                renderItem={({ item }) => (
                    <View style={[styles.message, item?.sender === "You" ? styles.sent : styles.received]}>
                        <Text style={styles.messageText}>{item?.content}</Text>
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
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
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
    messageText: {
        color: '#FFF',
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
    sendButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

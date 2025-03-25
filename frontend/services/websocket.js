import { Client } from '@stomp/stompjs';
import { CHAT_API_URL } from './api';
import { Platform } from 'react-native';

// Define a null SockJS by default
let SockJS = null;

// Only try to import SockJS on web platform
if (Platform.OS === 'web') {
    try {
        // Use dynamic import to avoid issues with native platforms
        SockJS = require('sockjs-client').default || require('sockjs-client');
    } catch (error) {
        console.error('Error importing SockJS, falling back to direct WebSocket', error);
    }
}

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = {};
        this.connectPromise = null;
        this.callbacks = {};
        this.isConnected = false;
    }

    connect(userId, token) {
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            try {
                // Use the sockjs endpoint for web, direct WebSocket for native
                const sockjsUrl = `${CHAT_API_URL}/ws`;
                const wsUrl = `${CHAT_API_URL.replace('http', 'ws')}/ws`;

                console.log(`Connecting to WebSocket at: ${Platform.OS === 'web' && SockJS ? sockjsUrl : wsUrl}`);

                const connectionOptions = {
                    connectHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                    debug: (str) => {
                        console.log('STOMP Debug:', str);
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    onConnect: () => {
                        console.log('WebSocket Connected!');
                        this.isConnected = true;

                        // Subscribe to user-specific topics
                        this.subscribe(`/topic/user/${userId}/matches`, (message) => {
                            console.log('Received match notification:', message);
                            if (this.callbacks['match']) {
                                this.callbacks['match'](JSON.parse(message.body));
                            }
                        });

                        resolve(true);
                    },
                    onDisconnect: () => {
                        console.log('WebSocket Disconnected');
                        this.isConnected = false;
                    },
                    onStompError: (frame) => {
                        console.error('STOMP error:', frame);
                        reject(new Error(`WebSocket Error: ${frame.headers.message}`));
                    },
                    onWebSocketError: (event) => {
                        console.error('WebSocket error:', event);
                        this.isConnected = false;
                        reject(new Error('WebSocket connection error'));
                    },
                };

                // Add the appropriate connection method based on platform
                if (Platform.OS === 'web' && SockJS) {
                    connectionOptions.webSocketFactory = () => new SockJS(sockjsUrl);
                } else {
                    connectionOptions.brokerURL = wsUrl;
                }

                this.client = new Client(connectionOptions);
                this.client.activate();
            } catch (error) {
                console.error('Error creating STOMP client:', error);
                this.connectPromise = null;
                reject(error);
            }
        });

        return this.connectPromise;
    }

    subscribe(destination, callback) {
        if (!this.client || !this.isConnected) {
            console.warn('Cannot subscribe - WebSocket not connected');
            return null;
        }

        if (!this.subscriptions[destination]) {
            this.subscriptions[destination] = this.client.subscribe(destination, callback);
            console.log(`Subscribed to ${destination}`);
        }

        return this.subscriptions[destination];
    }

    unsubscribe(destination) {
        if (this.subscriptions[destination]) {
            this.subscriptions[destination].unsubscribe();
            delete this.subscriptions[destination];
            console.log(`Unsubscribed from ${destination}`);
        }
    }

    registerCallback(event, callback) {
        this.callbacks[event] = callback;
    }

    unregisterCallback(event) {
        delete this.callbacks[event];
    }

    sendMessage(destination, body) {
        if (!this.client || !this.isConnected) {
            console.warn('Cannot send message - WebSocket not connected');
            return false;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    disconnect() {
        if (this.client) {
            Object.keys(this.subscriptions).forEach((destination) => {
                this.unsubscribe(destination);
            });

            this.client.deactivate();
            this.client = null;
            this.connectPromise = null;
            this.isConnected = false;
        }
    }
}

export default new WebSocketService(); 
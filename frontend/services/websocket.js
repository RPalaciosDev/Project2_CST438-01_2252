import { Client } from '@stomp/stompjs';
import { CHAT_API_URL } from './api';
import { Platform } from 'react-native';

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
                const wsUrl = `${CHAT_API_URL.replace('http', 'ws')}/ws`;
                console.log(`Connecting to WebSocket at: ${wsUrl}`);

                this.client = new Client({
                    brokerURL: wsUrl,
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
                });

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
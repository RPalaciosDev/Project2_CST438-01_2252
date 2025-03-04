import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import axios from 'axios';
import { User, AuthState } from '../../types';

const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:8081' 
    : 'http://10.0.2.2:8081'; // Use 10.0.2.2 for Android emulator or your computer's actual IP address

const storage = {
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    getItem: async (key: string) => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },
    removeItem: async (key: string) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            console.log(`Attempting to login to ${API_URL}/sign-in`);
            
            const response = await axios.post(`${API_URL}/sign-in`, {
                email: email.trim(),
                password,
            }, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Login response received:', JSON.stringify(response.status));

            const { token, user } = response.data;
            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            await Promise.all([
                storage.setItem('token', token),
                storage.setItem('user', JSON.stringify(user))
            ]);

            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Login failed. Please try again.';
            
            if (axios.isAxiosError(error)) {
                console.error('Login network error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    url: API_URL,
                    platform: Platform.OS
                });
            } else {
                console.error('Login error:', errorMessage);
            }
            
            set({ error: errorMessage, isLoading: false, isAuthenticated: false });
            throw error;
        }
    },

    register: async (username: string, email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await axios.post(`${API_URL}/auth/register`, {
                username,
                email,
                password,
            });

            const { token, user } = response.data;

            await storage.setItem('token', token);
            await storage.setItem('user', JSON.stringify(user));

            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: 'Registration failed', isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            set({ isLoading: true, error: null });
            await storage.removeItem('token');
            await storage.removeItem('user');
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
            set({ error: 'Logout failed', isLoading: false });
            throw error;
        }
    },

    loadStoredAuth: async () => {
        try {
            set({ isLoading: true, error: null });
            const [token, userJson] = await Promise.all([
                storage.getItem('token'),
                storage.getItem('user'),
            ]);

            if (token && userJson) {
                const user = JSON.parse(userJson) as User;
                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (err) {
            console.error('Load stored auth error:', err);
            set({ error: 'Failed to load authentication', isLoading: false });
        }
    },
}));

export default useAuthStore; 

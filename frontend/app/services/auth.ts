import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import axios from 'axios';
import { User, AuthState } from '../../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { token, user } = response.data;

            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));

            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: 'Login failed', isLoading: false });
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

            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));

            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: 'Registration failed', isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            set({ isLoading: true, error: null });
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
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
                SecureStore.getItemAsync('token'),
                SecureStore.getItemAsync('user'),
            ]);

            if (token && userJson) {
                const user = JSON.parse(userJson) as User;
                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Load stored auth error:', error);
            // Clear potentially corrupted data
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            set({ error: 'Failed to load authentication', isLoading: false });
        }
    },
})); 
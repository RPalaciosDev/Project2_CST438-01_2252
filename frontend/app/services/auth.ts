import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import axios from 'axios';
import { User, AuthState } from '../../types';
import { API_URL, AUTH_ENDPOINTS } from '../config';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 15000
});

// Interceptor for debugging
api.interceptors.request.use(request => {
    console.log('Request:', request.method, request.url);
    return request;
});

api.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.config.url);
        return response;
    },
    error => {
        if (error.response) {
            console.error('API Error:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config.url
            });
        } else if (error.request) {
            console.error('No response received:', {
                request: error.request._currentUrl || error.request.responseURL,
                message: error.message
            });
        } else {
            console.error('Request setup error:', error.message);
        }
        return Promise.reject(error);
    }
);

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

// Enhanced logging middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (config: any) => (set: any, get: any, api: any) => config(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => {
    console.log('  applying', args);
    set(...args);
    console.log('  new state', get());
  },
  get,
  api
);

export const useAuthStore = create(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log((set: any) => ({
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

            console.log(`Attempting to login to ${API_URL}${AUTH_ENDPOINTS.SIGNIN}`);
            
            const response = await api.post(AUTH_ENDPOINTS.SIGNIN, {
                email: email.trim(),
                password,
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
            console.log(`Attempting to register at ${API_URL}${AUTH_ENDPOINTS.SIGNUP}`);
            
            const response = await api.post(AUTH_ENDPOINTS.SIGNUP, {
                username,
                email,
                password,
            });

            const { token, user } = response.data;
            
            await Promise.all([
                storage.setItem('token', token),
                storage.setItem('user', JSON.stringify(user))
            ]);

            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Registration failed. Please try again.';
            
            if (axios.isAxiosError(error)) {
                console.error('Registration network error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    url: API_URL,
                    platform: Platform.OS
                });
            } else {
                console.error('Registration error:', errorMessage);
            }
            
            set({ error: errorMessage, isLoading: false });
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
  }))
);

export default useAuthStore; 

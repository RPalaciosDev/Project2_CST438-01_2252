import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import axios from 'axios';
import { User, AuthState } from '../types';

// Make sure we always use HTTPS for production URLs
const ensureHttps = (url: string): string => {
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};

// Create axios instance with better timeout and retry configuration
const axiosInstance = axios.create({
    timeout: 30000, // 30 seconds timeout
});

// Add retry logic for network failures
axiosInstance.interceptors.response.use(null, async error => {
    console.log('API error intercepted:', error.message);
    
    // Only retry for network errors or 5xx server errors, not for 4xx client errors
    const shouldRetry = 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        (error.response && error.response.status >= 500);
    
    if (shouldRetry && error.config && error.config.__retryCount < 2) {
        error.config.__retryCount = error.config.__retryCount || 0;
        error.config.__retryCount += 1;
        
        console.log(`Retrying request (${error.config.__retryCount}/2)...`);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * error.config.__retryCount));
        
        return axiosInstance(error.config);
    }
    
    return Promise.reject(error);
});

// Updated to support different environments - development, production, and Railway
const API_URL = (() => {
    // For Railway deployment - ensure HTTPS for production
    if (process.env.NODE_ENV === 'production') {
        return 'https://auth-user-service-production.up.railway.app';
    }
    
    // For local development
    return Platform.OS === 'web' 
        ? 'http://localhost:8080' 
        : 'http://10.0.2.2:8080'; // Use 10.0.2.2 for Android emulator or your computer's actual IP address
})();

// Services URLs for other microservices - ensure HTTPS for production
export const TIERLIST_API_URL = process.env.NODE_ENV === 'production' 
    ? ensureHttps('https://tierlist-service-production.up.railway.app')
    : 'http://localhost:8082';

export const CHAT_API_URL = process.env.NODE_ENV === 'production'
    ? ensureHttps(process.env.CHAT_API_URL || 'https://chat.yourdomain.com')
    : 'http://localhost:8083';
    
export const IMAGE_API_URL = process.env.NODE_ENV === 'production'
    ? ensureHttps('https://imageapi-production-af11.up.railway.app')
    : 'http://localhost:8084';

// Special instance for registration with longer timeout
const registrationAxios = axios.create({
    timeout: 60000, // 60 seconds for registration
});

// Add the same retry logic
registrationAxios.interceptors.response.use(null, async error => {
    console.log('Registration API error intercepted:', error.message);
    
    const shouldRetry = 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        (error.response && error.response.status >= 500);
    
    if (shouldRetry && error.config && error.config.__retryCount < 3) { // More retries for registration
        error.config.__retryCount = error.config.__retryCount || 0;
        error.config.__retryCount += 1;
        
        console.log(`Retrying registration (${error.config.__retryCount}/3)...`);
        
        // Longer wait for registration
        await new Promise(resolve => setTimeout(resolve, 2000 * error.config.__retryCount));
        
        return registrationAxios(error.config);
    }
    
    return Promise.reject(error);
});

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

            console.log(`Attempting to login to ${API_URL}/api/auth/signin`);
            
            const response = await axiosInstance.post(`${API_URL}/api/auth/signin`, {
                username: email.trim(), // Backend expects username but we're using email
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Login response received:', JSON.stringify(response.status));

            const { token, id, username, email: userEmail, roles } = response.data;
            if (!token) {
                throw new Error('Invalid response from server');
            }

            const user = { id, username, email: userEmail, roles };

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
            
            console.log(`Attempting registration at ${API_URL}/api/auth/signup`);
            
            // First request: signup the user - using special registration instance
            const signupResponse = await registrationAxios.post(`${API_URL}/api/auth/signup`, {
                username,
                email,
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Registration response:', signupResponse.status);
            
            // Since signup returns a success message but not credentials,
            // we need to login the user after successful registration
            if (signupResponse.status === 200) {
                // Now login to get the token
                const loginResponse = await axiosInstance.post(`${API_URL}/api/auth/signin`, {
                    username: email.trim(), // or username, depending on your backend
                    password,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                const { token, id, username: userName, email: userEmail, roles } = loginResponse.data;
                const user = { id, username: userName, email: userEmail, roles };

                await storage.setItem('token', token);
                await storage.setItem('user', JSON.stringify(user));

                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                throw new Error('Registration failed');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            
            // More specific error message for timeout
            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                set({ 
                    error: 'Registration timed out. Our servers might be experiencing high load. Please try again later.',
                    isLoading: false 
                });
            } else {
                set({ error: 'Registration failed', isLoading: false });
            }
            
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
                try {
                    const user = JSON.parse(userJson) as User;
                    set({ token, user, isAuthenticated: true, isLoading: false });
                } catch (parseError) {
                    console.error('Failed to parse stored user data:', parseError);
                    // Clear invalid storage data
                    await Promise.all([
                        storage.removeItem('token'),
                        storage.removeItem('user')
                    ]);
                    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
                }
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

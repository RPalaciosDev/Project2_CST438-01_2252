import * as SecureStore from 'expo-secure-store';
import { Platform, Linking } from 'react-native';
import { create } from 'zustand';
import axios from 'axios';
import { User, AuthState } from '../types';
import { getGoogleAuthHandler, fetchAccessTokenFromCode, exchangeGoogleTokenForJWT, getRedirectUri } from './oauth';

// Make sure we always use HTTPS for production URLs
const ensureHttps = (url: string): string => {
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};

// Create axios instance with better timeout and retry configuration
export const axiosInstance = axios.create({
    timeout: 30000, // 30 seconds timeout
    withCredentials: true, // Add credentials for CORS requests
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to include auth token in requests
axiosInstance.interceptors.request.use(async config => {
    try {
        const token = await storage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Added token to request:', config.url);
        }
    } catch (error) {
        console.error('Error setting auth header:', error);
    }
    return config;
}, error => {
    return Promise.reject(error);
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
        return ensureHttps('https://auth-user-service-production.up.railway.app');
    }

    // For local development
    return Platform.OS === 'web'
        ? 'http://localhost:8080'
        : 'http://10.0.2.2:8080'; // Use 10.0.2.2 for Android emulator or your computer's actual IP address
})();

// Verify the API endpoint is correct during initialization
console.log('API URL initialized as:', API_URL);

// Services URLs for other microservices - ensure HTTPS for production
export const TIERLIST_API_URL = process.env.NODE_ENV === 'production'
    ? ensureHttps('https://tier-list-service-production.up.railway.app')
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
    withCredentials: true, // Add credentials for CORS requests
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
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

// Add the same token interceptor to registration axios
registrationAxios.interceptors.request.use(async config => {
    try {
        const token = await storage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Added token to registration request:', config.url);
        }
    } catch (error) {
        console.error('Error setting auth header for registration:', error);
    }
    return config;
}, error => {
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

// Add this new function to check auth status properly
export const checkAuthStatus = async () => {
    try {
        console.log(`Checking auth status at ${API_URL}/api/auth/status`);
        const response = await axiosInstance.get(`${API_URL}/api/auth/status`, {
            // Add maxRedirects option to help with debugging
            maxRedirects: 0,
            validateStatus: function (status) {
                console.log(`Auth status response status: ${status}`);
                return status < 500; // Accept any status code less than 500 to see redirects
            }
        });

        console.log('Auth status response:', response.data);

        if (response.status === 302) {
            console.log('Redirect location:', response.headers.location || response.headers.Location);
        }

        return response.data;
    } catch (error) {
        console.error('Auth status check failed:', error);
        if (axios.isAxiosError(error) && error.response) {
            console.log('Error response status:', error.response.status);
            console.log('Error response headers:', error.response.headers);
        }
        throw error;
    }
};

// Add this function if it doesn't exist or fix it if it does
// The validateToken function should safely validate a token with proper error handling
export const validateToken = async (token: string) => {
    try {
        console.log('validateToken: Validating token');
        if (!token) {
            console.log('validateToken: No token provided');
            return false;
        }

        // Make a request to the API to validate the token
        const response = await axiosInstance.get(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
            }
        });

        console.log('validateToken: Response status:', response.status);
        return response.status === 200;
    } catch (error) {
        console.error('validateToken: Error validating token:', error);
        return false;
    }
};

// Add a function to initiate OAuth flow
export const initiateGoogleAuth = () => {
    // This needs to be a full browser navigation, not an XHR request
    const authUrl = `${API_URL}/oauth2/authorization/google`;
    console.log(`Redirecting to Google Auth at ${authUrl}`);

    // Use Linking which works on both web and mobile
    Linking.openURL(authUrl)
        .catch(err => {
            console.error('Failed to open auth URL:', err);
        });
};

// Add this function to handle the Google OAuth flow
export const handleGoogleAuth = async () => {
    try {
        console.log("Starting Google auth flow");

        // Use the non-hook version that's safe outside of React components
        const googleAuth = getGoogleAuthHandler();

        // Check if googleAuth was properly initialized
        if (!googleAuth || !googleAuth.promptAsync) {
            throw new Error("OAuth config is not properly initialized");
        }

        // This will open a web browser for authentication
        const result = await googleAuth.promptAsync();
        console.log('Google auth result:', result);

        if (result.type === 'success') {
            // In the WebBrowser approach, we get params directly
            if (result.params && result.params.code) {
                const { code } = result.params;

                if (!code) {
                    throw new Error('No authorization code found in the response');
                }

                // Get the redirect URI (same as was used to start the flow)
                const redirectUri = getRedirectUri();

                // Exchange the code for tokens
                const tokenData = await fetchAccessTokenFromCode(code, redirectUri);

                // IMPORTANT: Use the ID token which contains user profile data
                // The ID token is a JWT that contains user info including email
                if (!tokenData.idToken) {
                    console.error("No ID token received from Google - this is required for our backend");
                    throw new Error("Authentication failed - ID token not received from Google");
                }

                // Exchange the ID token for our app's JWT
                const API_URL = process.env.NODE_ENV === 'production'
                    ? 'https://auth-user-service-production.up.railway.app' // Railway deployed auth service
                    : 'http://localhost:8080';

                console.log("Using ID token for backend authentication - length:",
                    tokenData.idToken.length,
                    "preview:", tokenData.idToken.substring(0, 10) + "...");

                return await exchangeGoogleTokenForJWT(tokenData.idToken, API_URL);
            } else {
                throw new Error('No authorization code found in the response');
            }
        } else if (result.type === 'error') {
            throw new Error(`Google authentication failed: ${result.error}`);
        } else {
            throw new Error(`Google authentication failed: ${result.type}`);
        }
    } catch (error) {
        console.log('Google auth error:', error);
        throw error;
    }
};

// Define a helper function that's accessible outside the store
export const fetchUserDataFromApi = async (token?: string | null): Promise<any> => {
    try {
        console.log(`Fetching complete user data from ${API_URL}/api/auth/me`);

        // Get token from storage if not provided
        let accessToken = token;
        if (!accessToken) {
            accessToken = await storage.getItem('token');
        }

        if (!accessToken) {
            console.log('No token available to fetch user data');
            return null;
        }

        // Make sure token is properly formatted
        const formattedToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;

        // Make the request to the /me endpoint
        const response = await axiosInstance.get(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: formattedToken
            }
        });

        if (response.status === 200) {
            console.log('Successfully fetched complete user data');

            // Log the full structure to debug
            console.log('Full user data structure:', JSON.stringify(response.data, null, 2));
            console.log('Fields available in user data:', Object.keys(response.data));

            // Check for critical fields explicitly
            console.log('Gender field:', response.data.gender);
            console.log('LookingFor field:', response.data.lookingFor);
            console.log('hasCompletedOnboarding field:', response.data.hasCompletedOnboarding);

            // If the user has all required fields but hasCompletedOnboarding is not set,
            // set it retroactively to prevent future onboarding loops
            if (
                response.data.gender &&
                response.data.lookingFor &&
                (response.data.age > 0) &&
                response.data.hasCompletedOnboarding !== true
            ) {
                console.log('User has all required fields but hasCompletedOnboarding is not set. Setting it now...');

                try {
                    const updateResponse = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                        { hasCompletedOnboarding: true },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': formattedToken
                            }
                        }
                    );

                    if (updateResponse.status === 200) {
                        console.log('Successfully updated hasCompletedOnboarding flag');
                        // Update the response data to reflect this change
                        response.data.hasCompletedOnboarding = true;
                    }
                } catch (updateError) {
                    console.error('Failed to update hasCompletedOnboarding flag:', updateError);
                }
            }

            // Update the local storage with the complete user data
            await storage.setItem('user', JSON.stringify(response.data));

            return response.data;
        } else {
            console.error('Failed to fetch user data, status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching complete user data:', error);
        return null;
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isNewUser: false,

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

            // Store token immediately
            await storage.setItem('token', token);

            // Fetch complete user data to ensure we have all fields
            const userData = await fetchUserDataFromApi(token);

            if (userData) {
                // Use the complete user data
                set({
                    token,
                    user: userData,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                console.log('Login successful with complete user data');
            } else {
                // Fallback to basic user data if complete data fetch fails
                const basicUser = { id, username, email: userEmail, roles };
                await storage.setItem('user', JSON.stringify(basicUser));

                set({
                    token,
                    user: basicUser,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                console.log('Login successful with basic user data (complete data fetch failed)');
            }
        } catch (error) {
            console.error('Login error:', error);

            const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
                ? error.response.data.message
                : error instanceof Error
                    ? error.message
                    : 'Login failed. Please check your credentials and try again.';

            set({ isLoading: false, error: errorMessage, isAuthenticated: false });
            throw error; // Re-throw to let calling code handle it
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

            // Handle the response data which now includes the token directly
            if (signupResponse.status === 200) {
                const { token, id, username: userName, email: userEmail, roles } = signupResponse.data;
                const user = { id, username: userName, email: userEmail, roles };

                console.log('Received token and user from signup:', { hasToken: !!token, id });

                if (token) {
                    // Save the token and user to storage
                    await storage.setItem('token', token);
                    await storage.setItem('user', JSON.stringify(user));

                    // Update state with the new user information and token
                    set({ token, user, isAuthenticated: true, isLoading: false, isNewUser: true });
                } else {
                    // Fallback to the old method if token not received (backwards compatibility)
                    console.log('No token received from signup, falling back to login');

                    const loginResponse = await axiosInstance.post(`${API_URL}/api/auth/signin`, {
                        username: email.trim(),
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

                    set({ token, user, isAuthenticated: true, isLoading: false, isNewUser: true });
                }
            } else {
                throw new Error('Registration failed');
            }
        } catch (error) {
            console.error('Registration failed:', error);

            // More specific error message for timeout
            if (axios.isAxiosError(error)) {
                const axiosError = error as any;
                if (axiosError.code === 'ECONNABORTED') {
                    set({
                        error: 'Registration timed out. Our servers might be experiencing high load. Please try again later.',
                        isLoading: false
                    });
                } else if (axiosError.response?.status === 500) {
                    console.error('Server error details:', axiosError.response?.data);
                    set({
                        error: 'Server error during registration. This might be due to an email or username already in use, or the server is experiencing issues.',
                        isLoading: false
                    });
                } else {
                    set({
                        error: `Registration failed: ${axiosError.message || 'Unknown error'}`,
                        isLoading: false
                    });
                }
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

    // Update checkStatus to use validateToken and ensure proper user data handling
    checkStatus: async () => {
        try {
            console.log('checkStatus: Starting authentication check');
            set({ isLoading: true, error: null });

            // First check if we have a token stored
            const token = await storage.getItem('token');
            console.log('checkStatus: Retrieved token from storage:', token ? 'yes' : 'no');

            if (token) {
                // Validate the token by making a request to /me endpoint
                console.log('checkStatus: Validating token...');

                // Use the standalone validateToken function with proper error handling
                const isValid = await validateToken(token);
                console.log('checkStatus: Token validation result:', isValid);

                if (isValid) {
                    // If token is valid, get fresh user data
                    console.log('checkStatus: Token is valid, getting user data');
                    try {
                        // Make a direct request to get fresh user data
                        const response = await axiosInstance.get(`${API_URL}/api/auth/me`, {
                            headers: {
                                Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
                            }
                        });

                        if (response.status === 200 && response.data) {
                            const user = response.data;

                            // Log important user fields
                            console.log('checkStatus: Retrieved user data:', {
                                id: user.id,
                                hasCompletedOnboarding: user.hasCompletedOnboarding === true ? 'true' : 'false/undefined',
                                isNewUser: user.isNewUser || false
                            });

                            // Ensure user data is stored with correct flags
                            await storage.setItem('user', JSON.stringify(user));
                            set({ token, user, isAuthenticated: true, isLoading: false });
                            console.log('checkStatus: Authentication successful, user state updated');
                            return { isAuthenticated: true };
                        } else {
                            console.log('checkStatus: User data retrieval failed:', response.status);
                        }
                    } catch (e) {
                        console.error('checkStatus: Error getting fresh user data:', e);

                        // Fall back to stored user data if API call fails
                        console.log('checkStatus: Falling back to stored user data');
                        const userJson = await storage.getItem('user');
                        if (userJson) {
                            try {
                                const user = JSON.parse(userJson) as User;
                                console.log('checkStatus: Using stored user data:', {
                                    id: user.id,
                                    hasCompletedOnboarding: user.hasCompletedOnboarding === true ? 'true' : 'false/undefined'
                                });
                                set({ token, user, isAuthenticated: true, isLoading: false });
                                return { isAuthenticated: true };
                            } catch (parseError) {
                                console.error('checkStatus: Error parsing stored user data:', parseError);
                            }
                        }
                    }
                } else {
                    // If token is invalid, clear storage
                    console.log('checkStatus: Token is invalid, clearing storage');
                    await Promise.all([
                        storage.removeItem('token'),
                        storage.removeItem('user')
                    ]);
                }
            }

            // If we don't have a valid token or failed validation
            console.log('checkStatus: No valid token, returning not authenticated');
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            return { isAuthenticated: false };
        } catch (error) {
            console.error('checkStatus: Error checking status:', error);
            set({ error: 'Failed to check authentication status', isLoading: false });
            return { isAuthenticated: false };
        }
    },

    // Add method for Google login
    loginWithGoogle: async () => {
        try {
            set({ isLoading: true, error: null });

            // Handle the Google login flow
            const authData = await handleGoogleAuth();
            console.log('Google auth completed, received auth data:', {
                hasToken: !!authData.token,
                userId: authData.id,
                email: authData.email
            });

            // Determine if this is a new user based on the response
            // If the response includes a field indicating this is a new user, set isNewUser to true
            const isNewUser = authData.isNewAccount || false;

            // Create user object from auth data
            const user = {
                id: authData.id,
                username: authData.username,
                email: authData.email,
                roles: authData.roles
            };

            // IMPORTANT: Store the token and user in local storage
            await storage.setItem('token', authData.token);
            await storage.setItem('user', JSON.stringify(user));
            console.log('Token and user stored in local storage after Google login');

            set({
                token: authData.token,
                user,
                isAuthenticated: true,
                isLoading: false,
                isNewUser: isNewUser
            });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Google login failed. Please try again.';

            console.error('Google login error:', errorMessage);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Add setUser method
    setUser: async (userData: { token: string, user: User }) => {
        try {
            set({ isLoading: true, error: null });

            // Store the token and user data
            await storage.setItem('token', userData.token);
            await storage.setItem('user', JSON.stringify(userData.user));

            // Update state
            set({
                token: userData.token,
                user: userData.user,
                isAuthenticated: true,
                isLoading: false
            });

            return true;
        } catch (error) {
            console.error('Error setting user data:', error);
            set({ error: 'Failed to set user data', isLoading: false });
            return false;
        }
    },

    setIsNewUser: (isNew: boolean) => {
        set({ isNewUser: isNew });
    },

    // Add a new method to update the user's name
    updateUserName: async (name: string) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Updating user name to "${name}" at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { name },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new name
                const updatedUser = { ...user, name: name };

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update user name');
            }
        } catch (error) {
            console.error('Update user name error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update name',
                isLoading: false
            });
            return false;
        }
    },

    // Add method to update user's age
    updateUserAge: async (age: number) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Updating user age to ${age} at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { age },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new age
                const updatedUser = { ...user, age };

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update user age');
            }
        } catch (error) {
            console.error('Update user age error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update age',
                isLoading: false
            });
            return false;
        }
    },

    // Add method to delete user account
    deleteUserAccount: async () => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Deleting user account at ${API_URL}/api/auth/delete-account`);

            const response = await axiosInstance.delete(`${API_URL}/api/auth/delete-account`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                // Clear local storage
                await Promise.all([
                    storage.removeItem('token'),
                    storage.removeItem('user')
                ]);

                // Update state
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isNewUser: false
                });

                return true;
            } else {
                throw new Error('Failed to delete user account');
            }
        } catch (error) {
            console.error('Delete user account error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to delete account',
                isLoading: false
            });
            return false;
        }
    },

    // Add method to update user's gender
    updateUserGender: async (gender: string) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Updating user gender to "${gender}" at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { gender },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new gender
                const updatedUser = { ...user, gender };

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update user gender');
            }
        } catch (error) {
            console.error('Update user gender error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update gender',
                isLoading: false
            });
            return false;
        }
    },

    // Add method to update user's dating preferences
    updateUserPreferences: async (lookingFor: string) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Updating user preferences to "${lookingFor}" at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { lookingFor },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new preferences
                const updatedUser = { ...user, lookingFor };

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update user preferences');
            }
        } catch (error) {
            console.error('Update user preferences error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update preferences',
                isLoading: false
            });
            return false;
        }
    },

    // Add method to update user's profile picture
    updateUserPicture: async (pictureUrl: string) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Updating user profile picture to "${pictureUrl}" at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { picture: pictureUrl },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new picture
                const updatedUser = { ...user, picture: pictureUrl };

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update user profile picture');
            }
        } catch (error) {
            console.error('Update user profile picture error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update profile picture',
                isLoading: false
            });
            return false;
        }
    },

    // Improve fetchCompleteUserData method for better debugging
    fetchCompleteUserData: async () => {
        try {
            set({ isLoading: true, error: null });

            // Get the current token
            const token = get().token;

            // Fetch data using the external function
            const userData = await fetchUserDataFromApi(token);

            if (userData) {
                // Log the data structure for debugging
                console.log('User data to be applied to store:', JSON.stringify(userData, null, 2));

                // Update user state with the complete data
                set({
                    user: userData,
                    isLoading: false
                });

                console.log('User state updated with complete data');
                return userData;
            }

            set({ isLoading: false });
            return null;
        } catch (error) {
            console.error('Error fetching complete user data:', error);
            set({ error: 'Failed to fetch user data', isLoading: false });
            return null;
        }
    },

    // Daily Tierlist API methods
    fetchDailyTierlist: async () => {
        try {
            // Log the API URL being used
            console.log("Fetching daily tierlist from:", TIERLIST_API_URL);

            // Check if user is authenticated
            if (!get().token) {
                console.log("User not authenticated, cannot fetch daily tierlist");
                return { available: false, message: "Not authenticated" };
            }

            const response = await axios.get(`${TIERLIST_API_URL}/api/daily`, {
                headers: {
                    'X-User-ID': get().user?.id
                }
            });

            // Log successful response
            console.log("Daily tierlist fetch successful:", response.status);

            return response.data;
        } catch (err) {
            console.error("Error in fetchDailyTierlist:", err);

            // Enhanced error logging
            if (axios.isAxiosError(err)) {
                console.log("Status:", err.response?.status);
                console.log("Response data:", err.response?.data);
            }

            // Return a valid default response
            return {
                available: false,
                completed: false,
                message: "Error fetching daily tierlist"
            };
        }
    },

    markDailyTierlistCompleted: async () => {
        try {
            // Get user from state instead of storage
            const { user } = get();
            const userId = user?.id;

            if (!userId) {
                console.warn('No user ID available when marking daily tierlist completed');
                return { success: false, message: "User not authenticated" };
            }

            const response = await axiosInstance.post(`${TIERLIST_API_URL}/api/daily/complete`, {}, {
                headers: {
                    'X-User-ID': userId
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error marking daily tierlist completed:', error);
            throw error;
        }
    },

    setDailyTierlist: async (templateId: string) => {
        try {
            // Get user from state instead of storage
            const { user } = get();
            const userId = user?.id;

            if (!userId) {
                console.warn('No user ID available when setting daily tierlist');
                return { success: false, message: "User not authenticated" };
            }

            const response = await axiosInstance.post(`${TIERLIST_API_URL}/api/daily/${templateId}`, {}, {
                headers: {
                    'X-User-ID': userId
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error setting daily tierlist:', error);
            throw error;
        }
    },

    // Add method to update hasCompletedOnboarding flag
    updateOnboardingStatus: async (completed: boolean) => {
        try {
            set({ isLoading: true, error: null });

            const { token, user } = get();

            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            console.log(`Setting hasCompletedOnboarding to ${completed} at ${API_URL}/api/auth/update-profile`);

            const response = await axiosInstance.post(`${API_URL}/api/auth/update-profile`,
                { hasCompletedOnboarding: completed },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Update the user in state with the new onboarding status
                const updatedUser = { ...user, hasCompletedOnboarding: completed };

                // Log the updated user to verify the flag is set correctly
                console.log('User updated with hasCompletedOnboarding:', completed);
                console.log('Updated user data:', updatedUser);

                // Store updated user info
                await storage.setItem('user', JSON.stringify(updatedUser));

                // Update state
                set({ user: updatedUser, isLoading: false });
                return true;
            } else {
                throw new Error('Failed to update onboarding status');
            }
        } catch (error) {
            console.error('Update onboarding status error:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update onboarding status',
                isLoading: false
            });
            return false;
        }
    },
}));

export default useAuthStore; 

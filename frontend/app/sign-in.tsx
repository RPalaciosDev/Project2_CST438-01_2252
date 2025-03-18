import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import axios, { AxiosError } from 'axios';

// Create axios instance with better timeout and retry configuration for health checks
const healthCheckAxios = axios.create({
    timeout: 5000, // 5 seconds is enough for health check
});

// Make sure we always use HTTPS for production URLs
const ensureHttps = (url: string): string => {
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};

export default function SignIn() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [apiStatus, setApiStatus] = useState('');
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, token, isAuthenticated, loginWithGoogle } = useAuthStore(state => ({
        login: state.login,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loginWithGoogle: state.loginWithGoogle
    }));

    // Check API connectivity
    const checkApiStatus = async () => {
        setIsCheckingApi(true);
        setApiStatus('Checking API connection...');
        try {
            // Use Railway deployed URL for production, fallback to local for development
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'https://auth-user-service-production.up.railway.app'  // Ensure HTTPS
                : Platform.OS === 'web' 
                    ? 'http://localhost:8080' 
                    : 'http://10.0.2.2:8080';
            
            // Try to get a simple response from the API to verify connection
            try {
                // Try actuator/health first (Spring Boot standard endpoint)
                await healthCheckAxios.get(`${baseUrl}/actuator/health`);
                setApiStatus('API connection successful!');
            } catch (actuatorError) {
                try {
                    // Fall back to just hitting the base URL
                    await healthCheckAxios.get(`${baseUrl}`);
                    setApiStatus('API reachable, ready to authenticate!');
                } catch (baseError) {
                    throw baseError; // Re-throw to be caught by outer catch
                }
            }
        } catch (error: any) {
            console.error('API check error:', error);
            setApiStatus(`API connection failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsCheckingApi(false);
        }
    };

    // Check API status on component mount
    useEffect(() => {
        checkApiStatus();
    }, []);

    // Check if user is already authenticated and redirect if needed
    useEffect(() => {
        if (isAuthenticated && token) {
            router.replace('/home');
        }
    }, [isAuthenticated, token, router]);

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Username and password are required');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            await login(username, password);
            // Check if this is a new user (unlikely for regular login, but possible for first-time social login)
            const { isNewUser } = useAuthStore.getState();
            if (isNewUser) {
                router.replace('/startup');
            } else {
                router.replace('/home');
            }
        } catch (err) {
            console.error('Sign in error:', err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<any>;
                // Handle specific error responses
                if (axiosError.response?.status === 401) {
                    setError('Invalid username or password');
                } else if (axiosError.response?.status === 400) {
                    if (typeof axiosError.response.data === 'string') {
                        setError(axiosError.response.data);
                    } else if (axiosError.response.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
                        setError(axiosError.response.data.message as string);
                    } else {
                        setError('Invalid login data');
                    }
                } else if (axiosError.response?.status === 500) {
                    setError('Server error. Please try again later.');
                } else if (axiosError.code === 'ECONNABORTED') {
                    setError('Request timed out. The server might be under high load. Please try again later.');
                } else if (!axiosError.response) {
                    setError('Network error. Please check your connection.');
                } else {
                    setError(`Login failed: ${axiosError.response?.status}`);
                }
            } else {
                setError('Unable to connect to the server. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        
        try {
            await loginWithGoogle();
            // Check if this is a new user
            const { isNewUser } = useAuthStore.getState();
            if (isNewUser) {
                router.replace('/startup');
            } else {
                router.replace('/home');
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to sign in with Google');
            }
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={styles.title}>Sign In</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.form}>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your username or email"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!isLoading}
                />
                
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                />
                
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>
                
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>
                
                <TouchableOpacity
                    style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
                
                <Link href="/sign-up" asChild>
                    <TouchableOpacity style={styles.linkButton}>
                        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
            
            {apiStatus ? (
                <View style={styles.apiStatus}>
                    <Text style={styles.apiStatusText}>{apiStatus}</Text>
                    {isCheckingApi && <ActivityIndicator size="small" color="#666" />}
                    <TouchableOpacity onPress={checkApiStatus}>
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        width: '100%',
        maxWidth: 400,
        padding: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#FFE4E8',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#FF4B6E',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FFE4E8',
        padding: 16,
        borderRadius: 15,
        marginBottom: 16,
        fontSize: 16,
        shadowColor: '#FFE4E8',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 2,
    },
    button: {
        backgroundColor: '#FF4B6E',
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FF4B6E',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#FFB6C1',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        paddingHorizontal: 10,
        color: '#666',
    },
    googleButton: {
        backgroundColor: '#4285F4',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 15,
    },
    googleButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF4B6E',
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 14,
    },
    apiStatus: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#FFE4E8',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    apiStatusText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 10,
    },
    refreshText: {
        color: '#FF4B6E',
        fontSize: 14,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        alignItems: 'center',
    },
    linkText: {
        color: '#FF4B6E',
        fontSize: 14,
        fontWeight: 'bold',
    },
}); 
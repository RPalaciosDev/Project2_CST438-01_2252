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
    const { login, token, isAuthenticated } = useAuthStore(state => ({
        login: state.login,
        token: state.token,
        isAuthenticated: state.isAuthenticated
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
            router.replace('/home'); // Add navigation to home on successful login
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

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Love Tiers</Text>
                <Text style={styles.subtitle}>Sign in</Text>
                
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {apiStatus ? <Text style={styles.apiStatus}>{apiStatus}</Text> : null}
                {isCheckingApi && <ActivityIndicator size="small" color="#FF4B6E" />}
                <TouchableOpacity onPress={checkApiStatus} style={styles.apiCheckButton}>
                    <Text style={styles.apiCheckButtonText}>Check API Connection</Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Username or Email"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <Link href="/sign-up" style={styles.link}>
                        Sign Up
                    </Link>
                </View>
            </View>
        </View>
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
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    link: {
        color: '#FF4B6E',
        fontWeight: 'bold',
        fontSize: 15,
    },
    error: {
        color: '#FF4B6E',
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 14,
    },
    apiStatus: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },
    apiCheckButton: {
        marginBottom: 15,
        padding: 8,
        backgroundColor: '#FFE4E8',
        borderRadius: 8,
    },
    apiCheckButtonText: {
        color: '#FF4B6E',
        fontSize: 14,
        textAlign: 'center',
    },
}); 
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

// Fix the register function type issue by extending the auth store type
type ExtendedAuthStore = ReturnType<typeof useAuthStore> & {
    register: (username: string, email: string, password: string, dateOfBirth: Date) => Promise<void>;
};

// Platform-specific component for date picking
interface DateSelectorProps {
    value: Date;
    onChange: (date: Date) => void;
    isDisabled: boolean;
    isUnder18: boolean;
}

const DateSelector = ({ value, onChange, isDisabled, isUnder18 }: DateSelectorProps) => {
    const [showPicker, setShowPicker] = useState(false);
    
    const formatDate = (date: Date): string => {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };
    
    const handleChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || value;
        setShowPicker(Platform.OS === 'ios');
        onChange(currentDate);
    };
    
    if (Platform.OS === 'web') {
        return (
            <View style={styles.webDateContainer}>
                <View 
                    style={[
                        styles.input, 
                        {flexDirection: 'row', alignItems: 'center'},
                        isUnder18 && styles.inputError
                    ]}
                >
                    <View style={{flex: 1}}>
                        <Text style={{color: '#999', fontSize: 14, marginBottom: 2}}>Date of Birth</Text>
                        <input
                            type="date"
                            value={value.toISOString().split('T')[0]}
                            onChange={(e) => {
                                // Using any as a workaround for DOM lib issues
                                const target = e.target as any;
                                if (target && target.value) {
                                    onChange(new Date(target.value));
                                }
                            }}
                            disabled={isDisabled}
                            style={{
                                fontSize: '16px',
                                padding: '0px',
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                color: isUnder18 ? '#FF4B6E' : '#333',
                                backgroundColor: 'transparent',
                            }}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </View>
                </View>
                {isUnder18 && (
                    <Text style={styles.errorMessage}>Must be 18+ to register</Text>
                )}
            </View>
        );
    }
    
    // Native implementation uses the DateTimePicker
    return (
        <>
            <TouchableOpacity 
                style={[styles.input, isUnder18 && styles.inputError]} 
                onPress={() => setShowPicker(true)}
                disabled={isDisabled}
            >
                <Text style={isUnder18 ? styles.dateTextInvalid : styles.dateText}>
                    Date of Birth: {formatDate(value)}
                    {isUnder18 ? ' (Must be 18+)' : ''}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={handleChange}
                    maximumDate={new Date()}
                />
            )}
        </>
    );
};

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuthStore() as ExtendedAuthStore;
    const router = useRouter();

    const calculateAge = (birthday: Date): number => {
        const ageDifMs = Date.now() - birthday.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleDateChange = (selectedDate: Date) => {
        setDateOfBirth(selectedDate);
    };

    const handleSubmit = async () => {
        // Input validation
        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        // Age validation
        const age = calculateAge(dateOfBirth);
        if (age < 18) {
            setError('You must be at least 18 years old to register');
            return;
        }
        
        // Clear previous errors and show loading state
        setError('');
        setIsLoading(true);
        
        try {
            await register(username, email, password, dateOfBirth);
            router.replace('/home'); // Navigate to home on success
        } catch (err) {
            console.error('Sign up error:', err);
            if (axios.isAxiosError(err)) {
                // Handle timeout specifically
                if (err.code === 'ECONNABORTED') {
                    setError('Registration request timed out. The server might be under high load. Please try again later.');
                }
                // Handle specific response errors
                else if (err.response) {
                    if (err.response.status === 400) {
                        if (typeof err.response.data === 'string') {
                            setError(err.response.data);
                        } else if (err.response.data?.message) {
                            setError(err.response.data.message);
                        } else {
                            setError('Invalid registration data. Please check your information.');
                        }
                    } else if (err.response.status === 500) {
                        setError('Server error. Please try again later.');
                    } else {
                        setError(`Registration failed: ${err.response.status}`);
                    }
                } 
                // Handle network errors
                else if (!err.response) {
                    setError('Network error. Please check your connection and try again.');
                }
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isUnder18 = calculateAge(dateOfBirth) < 18;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        <Text style={styles.title}>Love Tiers</Text>
                        <Text style={styles.subtitle}>Join the community!</Text>
                        
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />
                        
                        <DateSelector 
                            value={dateOfBirth}
                            onChange={handleDateChange}
                            isDisabled={isLoading}
                            isUnder18={isUnder18}
                        />

                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/sign-in" style={styles.link}>
                                Sign In
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F5',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        overflow: 'hidden',
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
    inputError: {
        borderColor: '#FF4B6E',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    dateTextInvalid: {
        fontSize: 16,
        color: '#FF4B6E',
    },
    webDateContainer: {
        marginBottom: 16,
    },
    webDateLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    errorMessage: {
        color: '#FF4B6E',
        fontSize: 14,
        marginTop: -12,
        marginBottom: 16,
        paddingLeft: 4,
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
}); 
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [apiStatus, setApiStatus] = useState('');
    const [isCheckingApi, setIsCheckingApi] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Love Tiers</Text>
                <Text style={styles.subtitle}>Sign in</Text>
                
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {apiStatus ? <Text style={styles.apiStatus}>{apiStatus}</Text> : null}
                {isCheckingApi && <ActivityIndicator size="small" color="#FF4B6E" />}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

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
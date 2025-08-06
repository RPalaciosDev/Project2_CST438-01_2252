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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import axios from 'axios';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { register, logout } = useAuthStore();
  const router = useRouter();

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

    // Clear previous errors and show loading state
    setError('');
    setIsLoading(true);

    try {
      await register(username, email, password);

      // Log the user out immediately after registration
      // to prevent automatic navigation to home
      await logout();

      // Show success message instead of redirecting
      setSignupSuccess(true);

      // Clear form fields
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Sign up error:', err);
      if (axios.isAxiosError(err)) {
        // Handle timeout specifically
        if (err.code === 'ECONNABORTED') {
          setError(
            'Registration request timed out. The server might be under high load. Please try again later.',
          );
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

  // Function to navigate to sign-in page
  const goToSignIn = () => {
    router.replace('/sign-in');
  };

  // If registration was successful, show success message and button to sign in
  if (signupSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Account Created!</Text>
          <Text style={styles.successMessage}>
            Your account has been successfully created. Please sign in with your new credentials.
          </Text>

          <TouchableOpacity style={styles.button} onPress={goToSignIn}>
            <Text style={styles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Love Tiers</Text>
        <Text style={styles.subtitle}>Join the community!</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => router.replace('/sign-in')}
            >
              <Text style={styles.returnButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  successMessage: {
    fontSize: 16,
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
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
  errorContainer: {
    marginBottom: 15,
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  error: {
    color: '#FF4B6E',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  returnButton: {
    backgroundColor: '#FFE4E8',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  returnButtonText: {
    color: '#FF4B6E',
    fontSize: 14,
    fontWeight: '500',
  },
});

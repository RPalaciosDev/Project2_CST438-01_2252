import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { useAuthStore } from '../services/auth';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Declare global to help TypeScript understand window object
declare global {
    interface Window {
        localStorage: Storage;
    }
}

export default function AuthCheck() {
    const { user, isAuthenticated, checkStatus } = useAuthStore();
    const router = useRouter();
    const isMounted = useRef(false);

    // Set mounted ref on first render
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        console.log('AuthCheck: Starting authentication check');

        // Debug: Check current storage state
        const checkStorage = async () => {
            // For web platform, use a try-catch to safely check localStorage
            if (Platform.OS === 'web') {
                try {
                    // Using this indirect approach to avoid TypeScript errors
                    // @ts-ignore - Deliberately using eval to bypass TypeScript window checks
                    const localStorage = eval('window.localStorage');
                    if (localStorage) {
                        const token = localStorage.getItem('token');
                        const user = localStorage.getItem('user');
                        console.log('AuthCheck: localStorage check - token exists:', !!token);
                        console.log('AuthCheck: localStorage check - user exists:', !!user);
                        if (user) {
                            try {
                                const userData = JSON.parse(user);
                                console.log('AuthCheck: User data in localStorage:', {
                                    id: userData.id,
                                    email: userData.email,
                                    fields: Object.keys(userData)
                                });
                            } catch (e) {
                                console.error('AuthCheck: Error parsing user data from localStorage');
                            }
                        }
                    }
                } catch (e) {
                    console.log('AuthCheck: localStorage not available');
                }
            }

            // Check SecureStore for native
            try {
                const token = await SecureStore.getItemAsync('token');
                const user = await SecureStore.getItemAsync('user');
                console.log('AuthCheck: SecureStore check - token exists:', !!token);
                console.log('AuthCheck: SecureStore check - user exists:', !!user);
            } catch (e) {
                console.log('AuthCheck: SecureStore not available (expected on web)');
            }
        };

        checkStorage();

        // Simplified check that doesn't rely on validateToken 
        const performAuthCheck = async () => {
            try {
                // Using checkStatus instead of validateToken directly
                const status = await checkStatus();
                console.log('AuthCheck: Status check result:', status);

                // Guard against unmounting during async operations
                if (!isMounted.current) return;

                // If we don't have a valid auth session, redirect to sign-in
                if (!status || !status.isAuthenticated) {
                    console.log('AuthCheck: Not authenticated, redirecting to sign-in');
                    // Use setTimeout to ensure navigation happens after mounting
                    setTimeout(() => {
                        if (isMounted.current) {
                            router.replace('/sign-in');
                        }
                    }, 500);
                    return;
                }

                // Get the current user from the store
                const currentUser = useAuthStore.getState().user;

                // If no user data available, redirect to sign-in
                if (!currentUser) {
                    console.log('AuthCheck: No user data available, redirecting to sign-in');
                    setTimeout(() => {
                        if (isMounted.current) {
                            router.replace('/sign-in');
                        }
                    }, 500);
                    return;
                }

                // More detailed logging
                console.log('AuthCheck: User data retrieved:', {
                    id: currentUser.id,
                    hasGender: !!currentUser.gender,
                    gender: currentUser.gender || 'not set',
                    hasLookingFor: !!currentUser.lookingFor,
                    lookingFor: currentUser.lookingFor || 'not set',
                    hasCompletedOnboarding: currentUser.hasCompletedOnboarding === true,
                    allUserFields: Object.keys(currentUser).join(', ')
                });

                // Check if the user has completed onboarding
                console.log('AuthCheck: Evaluating onboarding status: hasCompletedOnboarding =',
                    currentUser.hasCompletedOnboarding === true ? 'true' : 'false/undefined/null');

                // IMPORTANT: Use strict boolean comparison to ensure we're getting a true value, not truthy
                if (currentUser.hasCompletedOnboarding === true) {
                    // User has completed onboarding, go to home
                    console.log('AuthCheck: User has COMPLETED onboarding, redirecting to home');
                    setTimeout(() => {
                        if (isMounted.current) {
                            router.replace('/home');
                        }
                    }, 500);
                } else {
                    // User needs to complete onboarding
                    console.log('AuthCheck: User has NOT completed onboarding, redirecting to startup');

                    // Set the isNewUser flag to true to ensure proper onboarding flow
                    useAuthStore.getState().setIsNewUser(true);

                    setTimeout(() => {
                        if (isMounted.current) {
                            router.replace('/startup');
                        }
                    }, 500);
                }
            } catch (error) {
                console.error('AuthCheck: Error during authentication check:', error);
                // If there's an error, direct to sign-in
                if (isMounted.current) {
                    setTimeout(() => {
                        if (isMounted.current) {
                            router.replace('/sign-in');
                        }
                    }, 500);
                }
            }
        };

        // Small delay to ensure component is fully mounted
        const timer = setTimeout(() => {
            performAuthCheck();
        }, 100);

        return () => clearTimeout(timer);
    }, [router]);

    // Display loading indicator while checking
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', marginBottom: 15 }}>Welcome to Love Tiers!</Text>
            <ActivityIndicator size="large" color="#FF4B6E" />
            <Text style={{ marginTop: 20, color: '#555', textAlign: 'center', maxWidth: '80%' }}>Verifying your account...</Text>
            <Text style={{ marginTop: 10, color: '#888', textAlign: 'center', maxWidth: '80%', fontSize: 14 }}>
                We're personalizing your experience and preparing your daily tier list.
            </Text>
        </View>
    );
} 
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatRedirect() {
    const { chatId } = useLocalSearchParams();
    const router = useRouter();

    // Redirect to the new conversation route
    useEffect(() => {
        if (chatId) {
            router.replace({
                pathname: '/chats/conversation',
                params: { chatId }
            });
        } else {
            router.replace('/chats');
        }
    }, [chatId, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#FF4B6E" />
            <Text style={styles.text}>Loading conversation...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    }
}); 
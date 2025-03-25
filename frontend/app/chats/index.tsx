import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useConversations from 'hooks/useConversation';

export default function Chats() {
  const router = useRouter();
  const { conversations, loading, error } = useConversations();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4B6E" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>

        <Text style={styles.header}>Messages</Text>
        <View style={styles.errorMessage}>
          <Text style={styles.errorMessageTitle}>An error occurred</Text>
          <Text style={styles.errorMessageSubtitle}>Please try again later</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      {conversations.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtext}>
            When you match with someone, your conversations will appear here
          </Text>
        </View>
      )}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item?.conversationId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => router.push(`/chats/${item.conversationId}`)}
          >
            <Text style={styles.username}>{item.conversationId}</Text>
            <Text style={styles.lastMessage}>{"Say hi!"}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF4B6E',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  errorMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  errorMessageSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


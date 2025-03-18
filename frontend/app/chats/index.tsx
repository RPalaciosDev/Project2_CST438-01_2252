import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const dummyChats = [
  { chatId: "1", username: "User 1", lastMessage: "Hey, how are you?" },
  { chatId: "2", username: "User 2", lastMessage: "Let's chat!" }
];

export default function Chats() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      <FlatList
        data={dummyChats}
        keyExtractor={(item) => item.chatId}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => router.push(`/chats/${item.chatId}`)}
          >
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage || "Say hi!"}</Text>
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
});


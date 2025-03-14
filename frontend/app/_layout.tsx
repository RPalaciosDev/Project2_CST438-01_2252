import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Slot, useSegments } from 'expo-router';
import { StyleProvider } from './context/StyleContext'; 

const Sidebar = () => {
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Love Tiers</Text>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/tierlists')}>
        <Text style={styles.linkText}>Daily Tier</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/my-tiers')}>
        <Text style={styles.linkText}>My Tiers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/chats')}>
        <Text style={styles.linkText}>Chats</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/home')}>
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Layout() {
  const segments = useSegments();
  const isAuthPage = segments.includes("sign-in") || segments.includes("sign-up");

  return (
    <StyleProvider>
      <View style={styles.container}>
        {!isAuthPage && <Sidebar />}  
        <View style={styles.content}>
          <Slot /> 
        </View>
      </View>
    </StyleProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#C76FA4',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  logo: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#FFF',
    fontSize: 18,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
});


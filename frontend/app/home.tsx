import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import { useStyle } from './context/StyleContext';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  const { user, logout, token } = useAuthStore();
  const { selectedStyle, setSelectedStyle } = useStyle();
  const [loading, setLoading] = useState(false);

  // Local state for dropdowns
  const [pickerValue, setPickerValue] = useState(selectedStyle);
  const [sex, setSex] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [age, setAge] = useState('18');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        router.replace('/sign-in');
        return;
      }
      
      try {
        const status = await useAuthStore.getState().checkStatus();
        
        if (!status.isAuthenticated) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please sign in again.",
            [{ text: "OK", onPress: () => handleLogout() }]
          );
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };
    
    verifyToken();
    setPickerValue(selectedStyle);
  }, [selectedStyle, token]);

  const handleSelection = (itemValue: string) => {
    if (itemValue) {
      console.log("Selected Style:", itemValue);
      setSelectedStyle(itemValue);
      setPickerValue(itemValue);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    router.replace('/sign-in');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Love Tiers</Text>
          <Text style={styles.subtitle}>Your tier list app</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <View style={styles.userInfo}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{user?.username || 'Not available'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'Not available'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sex</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={sex} onValueChange={setSex} style={styles.picker}>
              <Picker.Item label="Select your sex" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Looking For</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={lookingFor} onValueChange={setLookingFor} style={styles.picker}>
              <Picker.Item label="Looking for" value="" />
              <Picker.Item label="Men" value="men" />
              <Picker.Item label="Women" value="women" />
              <Picker.Item label="Both" value="both" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Age</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={age} onValueChange={setAge} style={styles.picker}>
              {[...Array(83)].map((_, i) => (
                <Picker.Item key={i} label={`${i + 18}`} value={`${i + 18}`} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tier List Style</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={pickerValue} onValueChange={handleSelection} style={styles.picker}>
              <Picker.Item label="Style Options" value="" />
              <Picker.Item label="Default (White Tiers)" value="default" />
              <Picker.Item label="Vibrant (Colorful Tiers)" value="vibrant" />
              <Picker.Item label="PinkLove (Shades of Pink)" value="pinklove" />
            </Picker>
          </View>
          <Text style={styles.selectedStyle}>Selected Style: {selectedStyle}</Text>
        </View>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4B6E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#222',
    borderRadius: 5,
    overflow: 'hidden',
    width: '80%',
    borderWidth: 1,
    borderColor: '#888',
    alignSelf: 'center',
    padding: 5,
  },
  picker: {
    color: '#fff',
    backgroundColor: '#333',
  },
  pickerItem: {
    color: '#fff',
    backgroundColor: '#333',
  },
  selectedStyle: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF8BA3',
    marginTop: 10,
  },
});

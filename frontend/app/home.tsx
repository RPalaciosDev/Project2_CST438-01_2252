import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/auth';
import { useStyle } from './context/StyleContext';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { selectedStyle, setSelectedStyle } = useStyle();

  // local state to force re render when selected style updates
  const [pickerValue, setPickerValue] = useState(selectedStyle);

  useEffect(() => {
    setPickerValue(selectedStyle);
  }, [selectedStyle]);

  const handleSelection = (itemValue: string) => {
    if (itemValue) {
      console.log("Selected Style:", itemValue);
      setSelectedStyle(itemValue);
      setPickerValue(itemValue);  // Ensure Picker reflects the change
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
          <Text style={styles.cardTitle}>Tier List Style</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={pickerValue}  // Use local state
              onValueChange={handleSelection}
              style={styles.picker}
              dropdownIconColor="#fff"
              mode="dropdown"
            >
              <Picker.Item label="Style Options" value="" style={styles.pickerItem} />
              <Picker.Item label="Default (White Tiers)" value="default" style={styles.pickerItem} />
              <Picker.Item label="Vibrant (Colorful Tiers)" value="vibrant" style={styles.pickerItem} />
              <Picker.Item label="PinkLove (Shades of Pink)" value="pinklove" style={styles.pickerItem} />
            </Picker>
          </View>
          <Text style={styles.selectedStyle}>
            Selected Style: {selectedStyle}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/tierlists')}>
            <Text style={styles.buttonText}>View My Tier Lists</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={() => router.push('/create-tierlist')}>
            <Text style={styles.buttonText}>Create New Tier List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    shadowColor: '#FFE4E8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  actionContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF4B6E',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF4B6E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    backgroundColor: '#FF8BA3',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


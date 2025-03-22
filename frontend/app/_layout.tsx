import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Slot, useSegments } from 'expo-router';
import { StyleProvider } from './context/StyleContext';
import { useAuthStore } from '../services/auth';
import { MaterialIcons } from '@expo/vector-icons';

const Sidebar = () => {
  const router = useRouter();
  const fetchDailyTierlist = useAuthStore.getState().fetchDailyTierlist;
  const [dailyTierAvailable, setDailyTierAvailable] = useState<boolean | null>(null);
  const [dailyTierCompleted, setDailyTierCompleted] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dailyTemplateId, setDailyTemplateId] = useState<string | null>(null);

  const checkDailyTierlist = async () => {
    try {
      setIsRefreshing(true);
      const dailyData = await fetchDailyTierlist();

      console.log("Daily tierlist check result:", dailyData);

      // Update all state in one place
      setDailyTierAvailable(dailyData?.available || false);
      setDailyTierCompleted(dailyData?.completed || false);
      setDailyTemplateId(dailyData?.templateId || null);

      setIsRefreshing(false);
    } catch (error) {
      console.error('Error checking daily tierlist:', error);
      setDailyTierAvailable(false);
      setDailyTierCompleted(false);
      setDailyTemplateId(null);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkDailyTierlist();
  }, []);

  const handleDailyTierClick = () => {
    if (dailyTierAvailable && !dailyTierCompleted && dailyTemplateId) {
      // Pass the templateId to the tierlists screen
      router.push({
        pathname: '/tierlists',
        params: { dailyTemplateId }
      });
    } else {
      if (dailyTierCompleted) {
        Alert.alert(
          "Already Completed",
          "You have already completed today's daily tier list."
        );
      } else {
        console.log('Daily Tier not available or already completed');
      }
    }
  };

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Love Tiers</Text>

      {/* Daily Tier Link with conditional styling and refresh button */}
      <View style={styles.dailyTierContainer}>
        <TouchableOpacity
          style={[
            styles.link,
            styles.dailyTierLink,
            !dailyTierAvailable || dailyTierCompleted ? styles.disabledLink : {}
          ]}
          onPress={handleDailyTierClick}
          disabled={!dailyTierAvailable || dailyTierCompleted}
        >
          <View style={styles.linkInner}>
            <Text style={[
              styles.linkText,
              !dailyTierAvailable || dailyTierCompleted ? styles.disabledText : {}
            ]}>
              Daily Tier
            </Text>
            {dailyTierCompleted && (
              <Text style={styles.completedTag}>Completed</Text>
            )}
            {!dailyTierAvailable && !dailyTierCompleted && (
              <Text style={styles.unavailableTag}>Unavailable</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkDailyTierlist}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialIcons name="refresh" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.link} onPress={() => router.push('/browse')}>
        <Text style={styles.linkText}>Browse</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/my-tiers')}>
        <Text style={styles.linkText}>My Tiers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/tier-builder')}>
        <Text style={styles.linkText}>Tier Builder</Text>
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
  const isAuthPage = segments.includes("sign-in") || segments.includes("sign-up") || segments.includes("startup");

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
  dailyTierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyTierLink: {
    flex: 1,
  },
  link: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  disabledLink: {
    opacity: 0.7,
  },
  linkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#FFF',
    fontSize: 18,
  },
  disabledText: {
    color: '#DDD',
  },
  completedTag: {
    fontSize: 10,
    color: '#8DF',
    backgroundColor: 'rgba(0, 100, 255, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableTag: {
    fontSize: 10,
    color: '#FDD',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  refreshButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


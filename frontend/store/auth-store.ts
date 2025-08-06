import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AUTH_API_URL } from '../services/api';

interface AuthState {
  fetchDailyTierlist: () => Promise<{
    available: boolean;
    completed: boolean;
    templateId: string | null;
  }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  fetchDailyTierlist: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        console.log('No token found for fetchDailyTierlist');
        return { available: false, completed: false, templateId: null };
      }

      const response = await fetch(`${AUTH_API_URL}/api/users/daily-tierlist`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('Error fetching daily tierlist:', response.status);
        return { available: false, completed: false, templateId: null };
      }

      const data = await response.json();
      console.log('Daily tierlist data:', data);

      return {
        available: data.available || false,
        completed: data.completed || false,
        templateId: data.templateId || null,
      };
    } catch (error) {
      console.error('Error in fetchDailyTierlist:', error);
      return { available: false, completed: false, templateId: null };
    }
  },
}));

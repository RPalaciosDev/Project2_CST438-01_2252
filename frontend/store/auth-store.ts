interface AuthState {
    fetchDailyTierlist: () => Promise<{ available: boolean; completed: boolean; templateId: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    fetchDailyTierlist: async () => {
        try {
            const token = await getItem('token');

            if (!token) {
                console.log('No token found for fetchDailyTierlist');
                return { available: false, completed: false, templateId: null };
            }

            const response = await fetch(`${API_URL}/api/users/daily-tierlist`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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
                templateId: data.templateId || null
            };
        } catch (error) {
            console.error('Error in fetchDailyTierlist:', error);
            return { available: false, completed: false, templateId: null };
        }
    },
})); 
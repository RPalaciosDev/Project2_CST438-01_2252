// Auth Types
export interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
    roles?: string[];
    age?: number;
    gender?: string;
    lookingFor?: string;
    picture?: string;
    hasCompletedOnboarding?: boolean;
}

export interface AuthStatusResponse {
    isAuthenticated: boolean;
    googleAuthUrl?: string;
    user?: User;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    isNewUser: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadStoredAuth: () => Promise<void>;
    checkStatus: () => Promise<AuthStatusResponse>;
    loginWithGoogle: () => Promise<void>;
    setUser: (userData: { token: string, user: User }) => Promise<boolean>;
    setIsNewUser: (isNew: boolean) => void;
    updateUserName: (name: string) => Promise<boolean>;
    updateUserAge: (age: number) => Promise<boolean>;
    updateUserGender: (gender: string) => Promise<boolean>;
    updateUserPreferences: (lookingFor: string) => Promise<boolean>;
    updateUserPicture: (pictureUrl: string) => Promise<boolean>;
    updateOnboardingStatus: (completed: boolean) => Promise<boolean>;
    deleteUserAccount: () => Promise<boolean>;
    fetchCompleteUserData: () => Promise<any>;
    fetchDailyTierlist: () => Promise<any>;
    markDailyTierlistCompleted: () => Promise<any>;
    setDailyTierlist: (templateId: string) => Promise<any>;
}

// TierList Types
export interface Tier {
    label: string;
    color: string;
}

export interface TierItem {
    id: string;
    name: string;
    tier: string;
}

export interface TierListProps {
    items?: TierItem[];
    onItemsChange?: (items: TierItem[]) => void;
    readOnly?: boolean;
} 
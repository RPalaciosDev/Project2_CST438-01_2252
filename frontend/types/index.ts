// Auth Types
export interface User {
    id: string;
    username: string;
    email: string;
    roles?: string[];
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
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadStoredAuth: () => Promise<void>;
    checkStatus: () => Promise<AuthStatusResponse>;
    loginWithGoogle: () => Promise<void>;
    setUser: (userData: { token: string, user: User }) => Promise<boolean>;
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
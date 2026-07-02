import { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { getStorageLimitForRole } from '../config/roles';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  updateCredits: (amount: number) => void;
  dailyCheckIn: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  useEffect(() => {
    // Simulate session restoration
    const savedUser = localStorage.getItem('nebula-user');
    const savedCheckIn = localStorage.getItem('nebula-last-checkin');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // By default, initialize with a mock registered user for developer preview
      const defaultUser: UserProfile = {
        id: 'user_123',
        name: 'Alex Mercer',
        email: 'alex@nebula.ai',
        role: 'registered_user',
        emailVerified: true,
        credits: 150,
        storageUsed: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
        storageLimit: getStorageLimitForRole('registered_user'),
        createdAt: new Date().toISOString()
      };
      setUser(defaultUser);
      localStorage.setItem('nebula-user', JSON.stringify(defaultUser));
    }
    
    if (savedCheckIn) {
      setLastCheckIn(savedCheckIn);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: UserRole = 'registered_user') => {
    setIsLoading(true);
    // Simulate login API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const loggedInUser: UserProfile = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      emailVerified: true,
      credits: 150,
      storageUsed: 0,
      storageLimit: getStorageLimitForRole(role),
      createdAt: new Date().toISOString()
    };
    
    setUser(loggedInUser);
    localStorage.setItem('nebula-user', JSON.stringify(loggedInUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nebula-user');
  };

  const updateCredits = (amount: number) => {
    if (!user) return;
    const updated = { ...user, credits: Math.max(0, user.credits + amount) };
    setUser(updated);
    localStorage.setItem('nebula-user', JSON.stringify(updated));
  };

  const dailyCheckIn = (): boolean => {
    if (!user) return false;
    const today = new Date().toDateString();
    if (lastCheckIn === today) {
      return false; // Already checked in today
    }
    
    // Reward 10 credits
    setLastCheckIn(today);
    localStorage.setItem('nebula-last-checkin', today);
    updateCredits(10);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateCredits,
        dailyCheckIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { getStorageLimitForRole } from '../config/roles';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, isSignup?: boolean, name?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void> | void;
  updateCredits: (amount: number) => Promise<void> | void;
  dailyCheckIn: () => Promise<boolean> | boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      // Firebase State Listener
      const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userRef = doc(db!, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUser(userSnap.data() as UserProfile);
            } else {
              // Create default profile on first login (fallback)
              const defaultProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: 'registered_user',
                emailVerified: firebaseUser.emailVerified,
                credits: 150,
                storageUsed: 0,
                storageLimit: getStorageLimitForRole('registered_user'),
                createdAt: new Date().toISOString()
              };
              await setDoc(userRef, defaultProfile);
              setUser(defaultProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Mock Storage Restore
      const savedUser = localStorage.getItem('nebula-user');
      const savedCheckIn = localStorage.getItem('nebula-last-checkin');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        const defaultUser: UserProfile = {
          id: 'user_123',
          name: 'Alex Mercer',
          email: 'alex@nebula.ai',
          role: 'registered_user',
          emailVerified: true,
          credits: 150,
          storageUsed: 1.2 * 1024 * 1024 * 1024,
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
    }
  }, []);

  const login = async (
    email: string, 
    password = 'defaultPassword123', 
    isSignup = false, 
    name?: string,
    role: UserRole = 'registered_user'
  ) => {
    setIsLoading(true);
    
    if (isFirebaseConfigured && auth && db) {
      try {
        if (isSignup) {
          // Register
          const credential = await createUserWithEmailAndPassword(auth!, email, password);
          const defaultProfile: UserProfile = {
            id: credential.user.uid,
            name: name || email.split('@')[0].toUpperCase(),
            email,
            role,
            emailVerified: credential.user.emailVerified,
            credits: 150,
            storageUsed: 0,
            storageLimit: getStorageLimitForRole(role),
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db!, 'users', credential.user.uid), defaultProfile);
          setUser(defaultProfile);
        } else {
          // Login
          await signInWithEmailAndPassword(auth!, email, password);
        }
      } catch (error) {
        console.error('Firebase Auth Action Failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Mock Login
    await new Promise((resolve) => setTimeout(resolve, 500));
    const loggedInUser: UserProfile = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name: name || email.split('@')[0].toUpperCase(),
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

  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured && auth) {
      await signOut(auth!);
    } else {
      setUser(null);
      localStorage.removeItem('nebula-user');
    }
    setIsLoading(false);
  };

  const updateCredits = async (amount: number) => {
    if (!user) return;
    
    if (isFirebaseConfigured && db) {
      const userRef = doc(db!, 'users', user.id);
      await updateDoc(userRef, {
        credits: increment(amount)
      });
      setUser((prev) => prev ? { ...prev, credits: Math.max(0, prev.credits + amount) } : null);
      return;
    }

    // Mock Update
    const updated = { ...user, credits: Math.max(0, user.credits + amount) };
    setUser(updated);
    localStorage.setItem('nebula-user', JSON.stringify(updated));
  };

  const dailyCheckIn = async (): Promise<boolean> => {
    if (!user) return false;
    const today = new Date().toDateString();
    
    if (isFirebaseConfigured && db) {
      const userRef = doc(db!, 'users', user.id);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      
      if (data?.lastCheckIn === today) {
        return false;
      }
      
      await updateDoc(userRef, {
        lastCheckIn: today,
        credits: increment(10)
      });
      setUser((prev) => prev ? { ...prev, credits: prev.credits + 10 } : null);
      return true;
    }

    // Mock Daily Checkin
    if (lastCheckIn === today) {
      return false;
    }
    
    setLastCheckIn(today);
    localStorage.setItem('nebula-last-checkin', today);
    await updateCredits(10);
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

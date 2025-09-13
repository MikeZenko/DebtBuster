import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  subscription?: 'free' | 'premium';
  onboardingCompleted?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

// Mock authentication functions (in a real app, these would call your backend)
const mockLogin = async (email: string, password: string): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful login
  if (email && password) {
    return {
      id: 'user-123',
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      createdAt: new Date().toISOString(),
      subscription: 'free',
      onboardingCompleted: true,
    };
  }
  
  return null;
};

const mockRegister = async (firstName: string, lastName: string, email: string, password: string): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Mock successful registration
  if (firstName && lastName && email && password) {
    return {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      subscription: 'free',
      onboardingCompleted: false,
    };
  }
  
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const user = await mockLogin(email, password);
          if (user) {
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      register: async (firstName: string, lastName: string, email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const user = await mockRegister(firstName, lastName, email, password);
          if (user) {
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },
      
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates } 
          });
        }
      },
      
      completeOnboarding: () => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, onboardingCompleted: true } 
          });
        }
      },
    }),
    {
      name: 'debttruth-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      })
    }
  )
);





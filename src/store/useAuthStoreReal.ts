import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AuthServiceReal, User, AuthCredentials, RegisterData } from '../services/authServiceReal';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  
  // Internal state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export const useAuthStoreReal = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials: AuthCredentials): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await AuthServiceReal.login(credentials);
            
            if (result.success && result.user) {
              set({ 
                user: result.user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: result.error || 'Login failed',
                isAuthenticated: false,
                user: null
              });
              return false;
            }
          } catch (error: any) {
            const errorMessage = error.message || 'An unexpected error occurred during login';
            set({ 
              isLoading: false, 
              error: errorMessage,
              isAuthenticated: false,
              user: null
            });
            return false;
          }
        },

        register: async (data: RegisterData): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await AuthServiceReal.register(data);
            
            if (result.success && result.user) {
              set({ 
                user: result.user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: result.error || 'Registration failed',
                isAuthenticated: false,
                user: null
              });
              return false;
            }
          } catch (error: any) {
            const errorMessage = error.message || 'An unexpected error occurred during registration';
            set({ 
              isLoading: false, 
              error: errorMessage,
              isAuthenticated: false,
              user: null
            });
            return false;
          }
        },

        logout: async (): Promise<void> => {
          set({ isLoading: true });
          
          try {
            await AuthServiceReal.logout();
          } catch (error) {
            console.warn('Logout error:', error);
          } finally {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: null
            });
          }
        },

        updateUser: async (updates: Partial<User>): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await AuthServiceReal.updateUser(updates);
            
            if (result.success && result.user) {
              set({ 
                user: result.user, 
                isLoading: false,
                error: null
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: result.error || 'Profile update failed'
              });
              return false;
            }
          } catch (error: any) {
            const errorMessage = error.message || 'An unexpected error occurred during update';
            set({ 
              isLoading: false, 
              error: errorMessage
            });
            return false;
          }
        },

        checkAuthStatus: async (): Promise<boolean> => {
          const currentUser = AuthServiceReal.getCurrentUser();
          
          if (!currentUser) {
            set({ 
              user: null, 
              isAuthenticated: false,
              error: null
            });
            return false;
          }

          // Check if authentication is still valid
          try {
            const isValid = await AuthServiceReal.isAuthenticated();
            
            if (isValid) {
              // Get the latest user data from storage in case it was updated
              const latestUser = AuthServiceReal.getCurrentUser();
              set({ 
                user: latestUser, 
                isAuthenticated: true,
                error: null
              });
              return true;
            } else {
              set({ 
                user: null, 
                isAuthenticated: false,
                error: null
              });
              return false;
            }
          } catch (error) {
            console.warn('Auth status check failed:', error);
            set({ 
              user: null, 
              isAuthenticated: false,
              error: null
            });
            return false;
          }
        },

        refreshAuth: async (): Promise<boolean> => {
          try {
            const success = await AuthServiceReal.refreshTokenIfNeeded();
            
            if (success) {
              const user = AuthServiceReal.getCurrentUser();
              if (user) {
                set({ user, isAuthenticated: true, error: null });
                return true;
              }
            }
            
            // If refresh failed, clear authentication
            set({ 
              user: null, 
              isAuthenticated: false,
              error: null
            });
            return false;
          } catch (error) {
            console.warn('Token refresh failed:', error);
            set({ 
              user: null, 
              isAuthenticated: false,
              error: null
            });
            return false;
          }
        },

        clearError: () => {
          set({ error: null });
        },

        // Internal state management
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        setUser: (user: User | null) => {
          set({ user });
        },

        setAuthenticated: (authenticated: boolean) => {
          set({ isAuthenticated: authenticated });
        },
      }),
      {
        name: 'debttruth-auth-real',
        // Only persist basic user info, not tokens (those are in secure storage)
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        // On hydration, check if the stored auth is still valid
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Check auth status on app startup
            state.checkAuthStatus();
          }
        },
      }
    )
  )
);

// Auto-refresh token every 30 minutes
setInterval(async () => {
  const store = useAuthStoreReal.getState();
  if (store.isAuthenticated) {
    await store.refreshAuth();
  }
}, 30 * 60 * 1000);

// Export selectors for better performance
export const useAuth = () => useAuthStoreReal((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useAuthActions = () => useAuthStoreReal((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  updateUser: state.updateUser,
  clearError: state.clearError,
  checkAuthStatus: state.checkAuthStatus,
}));

// Initialize authentication check on import
const initAuth = async () => {
  try {
    await useAuthStoreReal.getState().checkAuthStatus();
  } catch (error) {
    console.warn('Initial auth check failed:', error);
  }
};

// Run auth check after a short delay to allow Zustand to hydrate
setTimeout(initAuth, 100);

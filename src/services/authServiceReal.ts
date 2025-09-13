import { secureStorage, StorageKeys } from './secureStorage';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000');

// Enhanced user interface matching backend
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: string;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// API utility functions
class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(
          data.error?.message || 'Request failed',
          data.error?.code || 'REQUEST_FAILED',
          response.status,
          data.error?.details
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AuthError('Request timeout', 'TIMEOUT', 408);
      }
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AuthError(
          'Unable to connect to server. Please check your internet connection.',
          'NETWORK_ERROR',
          0
        );
      }
      
      throw new AuthError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR',
        0,
        error
      );
    }
  }

  static async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  static async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async patch<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export class AuthServiceReal {
  private static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static REFRESH_THRESHOLD = 60 * 60 * 1000; // Refresh if less than 1 hour remaining

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Client-side validation
      const validationErrors = this.validateRegistrationData(data);
      if (validationErrors.length > 0) {
        throw new AuthError(validationErrors.join('. '), 'VALIDATION_ERROR');
      }

      const response = await ApiClient.post<AuthResponse>('/auth/register', {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (response.success && response.data) {
        // Store session securely
        await this.storeSession(response.data);
        return { success: true, user: response.data.user };
      }

      throw new AuthError('Registration failed', 'REGISTRATION_FAILED');
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during registration' };
    }
  }

  /**
   * Login user
   */
  static async login(credentials: AuthCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Client-side validation
      if (!this.validateEmail(credentials.email)) {
        throw new AuthError('Please enter a valid email address', 'INVALID_EMAIL');
      }
      
      if (!credentials.password || credentials.password.length < 6) {
        throw new AuthError('Password must be at least 6 characters', 'INVALID_PASSWORD');
      }

      const response = await ApiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (response.success && response.data) {
        // Store session securely
        await this.storeSession(response.data);
        return { success: true, user: response.data.user };
      }

      throw new AuthError('Login failed', 'LOGIN_FAILED');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof AuthError) {
        // Map backend error codes to user-friendly messages
        if (error.code === 'INVALID_CREDENTIALS') {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const session = this.getCurrentSession();
      
      if (session) {
        // Notify backend to invalidate refresh token
        try {
          await ApiClient.post('/auth/logout', {
            refreshToken: session.refreshToken,
          }, session.accessToken);
        } catch (error) {
          // Continue with local cleanup even if backend call fails
          console.warn('Backend logout failed:', error);
        }
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Always clear local session data
      secureStorage.clear();
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Check if user is authenticated with token validation
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Check if session is expired
    if (Date.now() >= session.expiresAt) {
      await this.logout();
      return false;
    }

    // Validate token with backend periodically
    const lastValidation = sessionStorage.getItem('lastTokenValidation');
    const validationInterval = 5 * 60 * 1000; // 5 minutes
    
    if (!lastValidation || Date.now() - parseInt(lastValidation) > validationInterval) {
      try {
        await ApiClient.get('/auth/verify', session.accessToken);
        sessionStorage.setItem('lastTokenValidation', Date.now().toString());
        return true;
      } catch (error) {
        console.warn('Token validation failed:', error);
        await this.logout();
        return false;
      }
    }

    return true;
  }

  /**
   * Refresh access token if needed
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Check if token needs refresh
    const timeUntilExpiry = session.expiresAt - Date.now();
    if (timeUntilExpiry > this.REFRESH_THRESHOLD) {
      return true; // No refresh needed
    }

    try {
      const response = await ApiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: session.refreshToken,
      });

      if (response.success && response.data) {
        // Update session with new tokens
        const updatedSession: AuthSession = {
          ...session,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: Date.now() + this.SESSION_DURATION,
        };

        await this.storeSession(updatedSession);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh fails, logout user
    await this.logout();
    return false;
  }

  /**
   * Update user profile
   */
  static async updateUser(updates: Partial<Pick<User, 'firstName' | 'lastName' | 'onboardingCompleted'>>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const session = this.getCurrentSession();
      if (!session) {
        throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      // Ensure token is fresh
      await this.refreshTokenIfNeeded();
      const currentSession = this.getCurrentSession();
      if (!currentSession) {
        throw new AuthError('Authentication expired', 'AUTH_EXPIRED');
      }

      const response = await ApiClient.patch<AuthResponse>('/auth/profile', updates, currentSession.accessToken);

      if (response.success && response.data) {
        // Update local session with new user data
        const updatedSession: AuthSession = {
          ...currentSession,
          user: response.data.user,
        };

        await this.storeSession(updatedSession);
        return { success: true, user: response.data.user };
      }

      throw new AuthError('Profile update failed', 'UPDATE_FAILED');
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during update' };
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = this.getCurrentSession();
      if (!session) {
        throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new AuthError(passwordValidation.errors.join('. '), 'INVALID_PASSWORD');
      }

      await ApiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      }, session.accessToken);

      // Password change successful - user will need to log in again
      await this.logout();
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<any> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
    }

    await this.refreshTokenIfNeeded();
    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      throw new AuthError('Authentication expired', 'AUTH_EXPIRED');
    }

    const response = await ApiClient.get('/auth/stats', currentSession.accessToken);
    return response;
  }

  // Private helper methods

  private static getCurrentSession(): AuthSession | null {
    return secureStorage.getItem(StorageKeys.USER_SESSION);
  }

  private static async storeSession(data: { user: User; accessToken: string; refreshToken: string }): Promise<void> {
    const session: AuthSession = {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + this.SESSION_DURATION,
    };

    secureStorage.setItem(StorageKeys.USER_SESSION, session, {
      encrypt: true,
      expiration: this.SESSION_DURATION,
    });
  }

  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { valid: errors.length === 0, errors };
  }

  private static validateRegistrationData(data: RegisterData): string[] {
    const errors: string[] = [];

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    }
    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }
    if (!this.validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    return errors;
  }

  /**
   * Get authentication headers for API requests
   */
  static async getAuthHeaders(): Promise<Record<string, string>> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
    }

    await this.refreshTokenIfNeeded();
    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      throw new AuthError('Authentication expired', 'AUTH_EXPIRED');
    }

    return {
      Authorization: `Bearer ${currentSession.accessToken}`,
    };
  }
}

// Export API client for use by other services
export { ApiClient };

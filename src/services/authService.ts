import { secureStorage, StorageKeys } from './secureStorage';

// Enhanced user interface with security fields
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  subscription?: 'free' | 'premium';
  onboardingCompleted?: boolean;
  lastLoginAt?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Input validation utilities
export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
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

  static validateName(name: string): boolean {
    return name.trim().length >= 1 && name.length <= 50 && !/[<>]/.test(name);
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

class AuthService {
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // Refresh if less than 1 hour remaining

  /**
   * Login with enhanced validation and security
   */
  async login(credentials: AuthCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Input validation
      if (!ValidationUtils.validateEmail(credentials.email)) {
        throw new AuthError('Invalid email format', 'INVALID_EMAIL');
      }

      if (!credentials.password || credentials.password.length < 6) {
        throw new AuthError('Password is required and must be at least 6 characters', 'INVALID_PASSWORD');
      }

      // Sanitize inputs
      const email = ValidationUtils.sanitizeInput(credentials.email.toLowerCase());
      
      // Call backend authentication API
      const response = await this.callAuthAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: credentials.password }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.success) {
        throw new AuthError(
          response.message || 'Login failed',
          response.code || 'LOGIN_FAILED'
        );
      }

      // Store session securely
      const session: AuthSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + this.SESSION_DURATION
      };

      secureStorage.setItem(StorageKeys.USER_SESSION, session, {
        encrypt: true,
        expiration: this.SESSION_DURATION
      });

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  }

  /**
   * Register with comprehensive validation
   */
  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Comprehensive validation
      const validationErrors = this.validateRegistrationData(data);
      if (validationErrors.length > 0) {
        throw new AuthError(validationErrors.join('. '), 'VALIDATION_ERROR');
      }

      // Sanitize inputs
      const sanitizedData = {
        email: ValidationUtils.sanitizeInput(data.email.toLowerCase()),
        firstName: ValidationUtils.sanitizeInput(data.firstName),
        lastName: ValidationUtils.sanitizeInput(data.lastName),
        password: data.password // Don't sanitize passwords - preserve exact input
      };

      // Call backend registration API
      const response = await this.callAuthAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.success) {
        throw new AuthError(
          response.message || 'Registration failed',
          response.code || 'REGISTRATION_FAILED'
        );
      }

      // Auto-login after successful registration
      return await this.login({
        email: sanitizedData.email,
        password: sanitizedData.password
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during registration' };
    }
  }

  /**
   * Logout with secure cleanup
   */
  logout(): void {
    try {
      // Call backend to invalidate session
      const session = this.getCurrentSession();
      if (session) {
        this.callAuthAPI('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.warn('Logout API call failed:', error);
        });
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
  getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Check if session is expired
    if (Date.now() >= session.expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Refresh authentication token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Check if token needs refresh
    const timeUntilExpiry = session.expiresAt - Date.now();
    if (timeUntilExpiry > this.REFRESH_THRESHOLD) {
      return true; // No refresh needed
    }

    try {
      const response = await this.callAuthAPI('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        const updatedSession: AuthSession = {
          ...session,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || session.refreshToken,
          expiresAt: Date.now() + this.SESSION_DURATION
        };

        secureStorage.setItem(StorageKeys.USER_SESSION, updatedSession, {
          encrypt: true,
          expiration: this.SESSION_DURATION
        });

        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh fails, logout user
    this.logout();
    return false;
  }

  /**
   * Update user profile
   */
  async updateUser(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const session = this.getCurrentSession();
      if (!session) {
        throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      // Validate updates
      if (updates.email && !ValidationUtils.validateEmail(updates.email)) {
        throw new AuthError('Invalid email format', 'INVALID_EMAIL');
      }

      if (updates.firstName && !ValidationUtils.validateName(updates.firstName)) {
        throw new AuthError('Invalid first name', 'INVALID_NAME');
      }

      if (updates.lastName && !ValidationUtils.validateName(updates.lastName)) {
        throw new AuthError('Invalid last name', 'INVALID_NAME');
      }

      // Sanitize updates
      const sanitizedUpdates = {
        ...updates,
        firstName: updates.firstName ? ValidationUtils.sanitizeInput(updates.firstName) : undefined,
        lastName: updates.lastName ? ValidationUtils.sanitizeInput(updates.lastName) : undefined,
        email: updates.email ? ValidationUtils.sanitizeInput(updates.email.toLowerCase()) : undefined
      };

      const response = await this.callAuthAPI('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedUpdates)
      });

      if (response.success) {
        // Update local session
        const updatedSession: AuthSession = {
          ...session,
          user: { ...session.user, ...response.user }
        };

        secureStorage.setItem(StorageKeys.USER_SESSION, updatedSession, {
          encrypt: true,
          expiration: this.SESSION_DURATION
        });

        return { success: true, user: updatedSession.user };
      }

      throw new AuthError(response.message || 'Update failed', 'UPDATE_FAILED');
    } catch (error) {
      console.error('User update error:', error);
      
      if (error instanceof AuthError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unexpected error occurred during update' };
    }
  }

  // Private helper methods

  private getCurrentSession(): AuthSession | null {
    return secureStorage.getItem(StorageKeys.USER_SESSION);
  }

  private validateRegistrationData(data: RegisterData): string[] {
    const errors: string[] = [];

    if (!ValidationUtils.validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!ValidationUtils.validateName(data.firstName)) {
      errors.push('First name is required and must be valid');
    }

    if (!ValidationUtils.validateName(data.lastName)) {
      errors.push('Last name is required and must be valid');
    }

    const passwordValidation = ValidationUtils.validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  }

  /**
   * Mock API call (replace with actual backend in production)
   */
  private async callAuthAPI(endpoint: string, options: RequestInit): Promise<any> {
    // In production, replace with your actual authentication backend
    
    // Mock implementation for development
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    if (endpoint.includes('login')) {
      const body = JSON.parse(options.body as string);
      
      // Mock validation - replace with real authentication
      if (body.email && body.password && body.password.length >= 6) {
        return {
          success: true,
          user: {
            id: 'user_' + Date.now(),
            email: body.email,
            firstName: body.email.split('@')[0],
            lastName: 'User',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            subscription: 'free',
            onboardingCompleted: false,
            emailVerified: true,
            twoFactorEnabled: false
          },
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now()
        };
      } else {
        return {
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        };
      }
    }

    if (endpoint.includes('register')) {
      const body = JSON.parse(options.body as string);
      
      return {
        success: true,
        user: {
          id: 'user_' + Date.now(),
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          createdAt: new Date().toISOString(),
          subscription: 'free',
          onboardingCompleted: false,
          emailVerified: false,
          twoFactorEnabled: false
        },
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now()
      };
    }

    if (endpoint.includes('refresh')) {
      return {
        success: true,
        accessToken: 'mock_refreshed_token_' + Date.now()
      };
    }

    if (endpoint.includes('profile')) {
      const body = JSON.parse(options.body as string);
      return {
        success: true,
        user: body
      };
    }

    return { success: true };
  }
}

export const authService = new AuthService();

import { authService, ValidationUtils, AuthError } from '../authService';

// Mock secure storage
jest.mock('../secureStorage', () => ({
  secureStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  StorageKeys: {
    USER_SESSION: 'user_session',
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ValidationUtils', () => {
    describe('validateEmail', () => {
      test('should validate correct email addresses', () => {
        expect(ValidationUtils.validateEmail('test@example.com')).toBe(true);
        expect(ValidationUtils.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      });

      test('should reject invalid email addresses', () => {
        expect(ValidationUtils.validateEmail('invalid-email')).toBe(false);
        expect(ValidationUtils.validateEmail('test@')).toBe(false);
        expect(ValidationUtils.validateEmail('@domain.com')).toBe(false);
        expect(ValidationUtils.validateEmail('')).toBe(false);
      });

      test('should reject extremely long emails', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(ValidationUtils.validateEmail(longEmail)).toBe(false);
      });
    });

    describe('validatePassword', () => {
      test('should validate strong passwords', () => {
        const result = ValidationUtils.validatePassword('Password123!');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject weak passwords', () => {
        const result = ValidationUtils.validatePassword('weak');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      test('should require minimum length', () => {
        const result = ValidationUtils.validatePassword('Aa1!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      test('should require uppercase, lowercase, number, and special character', () => {
        const testCases = [
          { password: 'lowercase123!', missing: 'uppercase' },
          { password: 'UPPERCASE123!', missing: 'lowercase' },
          { password: 'Password!', missing: 'number' },
          { password: 'Password123', missing: 'special' },
        ];

        testCases.forEach(({ password }) => {
          const result = ValidationUtils.validatePassword(password);
          expect(result.valid).toBe(false);
        });
      });

      test('should reject extremely long passwords', () => {
        const longPassword = 'A'.repeat(130) + 'a1!';
        const result = ValidationUtils.validatePassword(longPassword);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be less than 128 characters');
      });
    });

    describe('validateName', () => {
      test('should validate proper names', () => {
        expect(ValidationUtils.validateName('John')).toBe(true);
        expect(ValidationUtils.validateName('Mary-Jane')).toBe(true);
        expect(ValidationUtils.validateName('José')).toBe(true);
      });

      test('should reject invalid names', () => {
        expect(ValidationUtils.validateName('')).toBe(false);
        expect(ValidationUtils.validateName('   ')).toBe(false);
        expect(ValidationUtils.validateName('<script>')).toBe(false);
        expect(ValidationUtils.validateName('A'.repeat(51))).toBe(false);
      });
    });

    describe('sanitizeInput', () => {
      test('should remove dangerous characters', () => {
        expect(ValidationUtils.sanitizeInput('John<script>alert()</script>')).toBe('Johnalert()');
        expect(ValidationUtils.sanitizeInput('  Test  ')).toBe('Test');
      });
    });
  });

  describe('AuthService', () => {
    describe('login', () => {
      test('should reject invalid email', async () => {
        const result = await authService.login({
          email: 'invalid-email',
          password: 'password123'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid email format');
      });

      test('should reject short password', async () => {
        const result = await authService.login({
          email: 'test@example.com',
          password: '123'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Password is required and must be at least 6 characters');
      });

      test('should handle successful login', async () => {
        const result = await authService.login({
          email: 'test@example.com',
          password: 'password123'
        });

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.email).toBe('test@example.com');
      });
    });

    describe('register', () => {
      test('should validate all required fields', async () => {
        const result = await authService.register({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          confirmPassword: 'different'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      test('should handle successful registration', async () => {
        const result = await authService.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!'
        });

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.firstName).toBe('John');
      });

      test('should reject mismatched passwords', async () => {
        const result = await authService.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'DifferentPass123!'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Passwords do not match');
      });
    });

    describe('isAuthenticated', () => {
      test('should return false when no session exists', () => {
        const { secureStorage } = require('../secureStorage');
        secureStorage.getItem.mockReturnValue(null);

        expect(authService.isAuthenticated()).toBe(false);
      });

      test('should return false when session is expired', () => {
        const { secureStorage } = require('../secureStorage');
        const expiredSession = {
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() - 1000 // Expired 1 second ago
        };
        secureStorage.getItem.mockReturnValue(expiredSession);

        expect(authService.isAuthenticated()).toBe(false);
      });

      test('should return true when session is valid', () => {
        const { secureStorage } = require('../secureStorage');
        const validSession = {
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 60000 // Expires in 1 minute
        };
        secureStorage.getItem.mockReturnValue(validSession);

        expect(authService.isAuthenticated()).toBe(true);
      });
    });

    describe('logout', () => {
      test('should clear secure storage', () => {
        const { secureStorage } = require('../secureStorage');
        
        authService.logout();
        
        expect(secureStorage.clear).toHaveBeenCalled();
      });
    });
  });
});

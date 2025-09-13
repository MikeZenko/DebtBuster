import { Response } from 'express';
import { AuthService, registerSchema, loginSchema } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { z } from 'zod';

// Additional validation schemas
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export class AuthController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    try {
      const result = await AuthService.register(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        }
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw createError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }
      throw error;
    }
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    
    try {
      const result = await AuthService.login(validatedData);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        }
      });
    } catch (error: any) {
      if (error.message.includes('Invalid credentials')) {
        throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }
      throw error;
    }
  });

  /**
   * Refresh access token
   */
  static refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    
    try {
      const tokens = await AuthService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        throw createError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  });

  /**
   * Logout user
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    
    await AuthService.logout(refreshToken);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const validatedData = updateProfileSchema.parse(req.body);
    
    const updatedUser = await AuthService.updateUser(req.user.id, validatedData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    try {
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      if (error.message.includes('incorrect')) {
        throw createError('Current password is incorrect', 400, 'INCORRECT_PASSWORD');
      }
      throw error;
    }
  });

  /**
   * Verify token (for frontend to check if token is still valid)
   */
  static verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('Invalid token', 401, 'INVALID_TOKEN');
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  });

  /**
   * Get user stats for dashboard
   */
  static getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // This could be expanded to include more user statistics
    const stats = {
      memberSince: req.user.createdAt,
      lastLogin: req.user.lastLoginAt,
      subscription: req.user.subscription,
      onboardingCompleted: req.user.onboardingCompleted,
      emailVerified: req.user.emailVerified,
    };

    res.json({
      success: true,
      data: { stats }
    });
  });

  /**
   * Health check endpoint
   */
  static health = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Auth service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}

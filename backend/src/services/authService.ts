import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, RefreshToken } from '@prisma/client';
import prisma from '../config/database';
import env from '../config/env';
import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: string;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: z.infer<typeof registerSchema>): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  /**
   * Login user
   */
  static async login(data: z.infer<typeof loginSchema>): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser({ ...user, lastLoginAt: new Date() }),
      tokens
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; tokenId: string };

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { id: payload.tokenId },
        include: { user: true }
      });

      if (!storedToken || storedToken.token !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new Error('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.userId);

      // Remove old refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user by invalidating refresh token
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { tokenId: string };
      await prisma.refreshToken.delete({
        where: { id: payload.tokenId }
      });
    } catch (error) {
      // Token already invalid or expired
    }
  }

  /**
   * Verify access token
   */
  static async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'onboardingCompleted'>>): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return this.sanitizeUser(user);
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  /**
   * Generate access and refresh tokens
   */
  private static async generateTokens(userId: string): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign(
      { userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { userId, tokenId: refreshTokenId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }

  /**
   * Remove sensitive data from user object
   */
  private static sanitizeUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: user.subscription,
      onboardingCompleted: user.onboardingCompleted,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Clean up expired refresh tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService';
import env from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscription: string;
    onboardingCompleted: boolean;
    emailVerified: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      res.status(401).json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    // Verify and decode the token
    const user = await AuthService.verifyAccessToken(token);
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware to check if user has completed onboarding
 */
export const requireOnboarding = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.onboardingCompleted) {
    res.status(403).json({ 
      error: 'Onboarding must be completed to access this resource',
      code: 'ONBOARDING_REQUIRED'
    });
    return;
  }

  next();
};

/**
 * Middleware to check subscription level
 */
export const requireSubscription = (requiredLevel: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const subscriptionLevels = ['FREE', 'PREMIUM', 'ENTERPRISE'];
    const userLevel = subscriptionLevels.indexOf(req.user.subscription);
    const requiredLevelIndex = subscriptionLevels.indexOf(requiredLevel);

    if (userLevel < requiredLevelIndex) {
      res.status(403).json({ 
        error: `${requiredLevel} subscription required`,
        code: 'SUBSCRIPTION_REQUIRED',
        requiredSubscription: requiredLevel,
        currentSubscription: req.user.subscription
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check email verification
 */
export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({ 
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
    return;
  }

  next();
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const user = await AuthService.verifyAccessToken(token);
          req.user = user;
        } catch (error) {
          // Ignore authentication errors for optional auth
          console.debug('Optional auth failed:', error);
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import env, { isDevelopment } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Create an operational error (expected error that should be handled gracefully)
 */
export const createError = (message: string, statusCode: number, code?: string): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Handle different types of errors
  if (error.statusCode && error.isOperational) {
    // Operational errors (expected)
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'OPERATIONAL_ERROR';
  } else if (error instanceof z.ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = {
      validationErrors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        code = 'DUPLICATE_RECORD';
        details = { constraint: error.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        code = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        code = 'FOREIGN_KEY_ERROR';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid ID provided';
        code = 'INVALID_ID';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred';
        code = 'DATABASE_ERROR';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    code = 'INVALID_JSON';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code,
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  };

  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development
  if (isDevelopment() && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Add request ID if available
  const requestId = req.headers['x-request-id'];
  if (requestId) {
    errorResponse.requestId = requestId;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T): Promise<R> => {
    const [req, res, next] = args as any[];
    return Promise.resolve(fn(...args)).catch(next);
  };
};

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate query parameters only
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate URL parameters only
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting error handler
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW * 60), // Convert minutes to seconds
  });
};

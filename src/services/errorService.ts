/**
 * Error Handling and Monitoring Service
 * Provides centralized error handling, logging, and user-friendly error messages
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  id: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  context?: ErrorContext;
  originalError?: Error;
  userMessage: string;
}

export class ErrorService {
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  /**
   * Handle and log application errors
   */
  handleError(
    error: Error | unknown,
    context?: ErrorContext,
    userMessage?: string
  ): AppError {
    const appError = this.createAppError(error, context, userMessage);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', appError);
    }
    
    // Store error for reporting
    this.storeError(appError);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(appError);
    }
    
    return appError;
  }

  /**
   * Create standardized error object
   */
  private createAppError(
    error: Error | unknown,
    context?: ErrorContext,
    userMessage?: string
  ): AppError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const appError: AppError = {
      id: this.generateErrorId(),
      message: errorObj.message,
      code: this.extractErrorCode(errorObj),
      severity: this.determineSeverity(errorObj, context),
      timestamp: Date.now(),
      context,
      originalError: errorObj,
      userMessage: userMessage || this.generateUserMessage(errorObj)
    };

    return appError;
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Connection problem. Please check your internet connection and try again.';
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('login') || message.includes('unauthorized')) {
      return 'Authentication failed. Please log in again.';
    }
    
    // Bank connection errors
    if (message.includes('plaid') || message.includes('bank')) {
      return 'Unable to connect to your bank. Please try reconnecting your account.';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Please check your input and try again.';
    }
    
    // Financial calculation errors
    if (message.includes('calculation') || message.includes('math')) {
      return 'Error in financial calculations. Please verify your numbers.';
    }
    
    // Storage errors
    if (message.includes('storage') || message.includes('local')) {
      return 'Unable to save data. Please try again.';
    }
    
    // Generic fallback
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }

  /**
   * Extract error code from error object
   */
  private extractErrorCode(error: Error): string {
    // Check for custom error codes
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
    
    // Generate code from error type
    if (error.name) {
      return error.name.toUpperCase();
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context?: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    // Critical errors
    if (message.includes('security') || 
        message.includes('unauthorized') ||
        message.includes('access_token') ||
        context?.component === 'PlaidService') {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('network') ||
        message.includes('server') ||
        message.includes('database')) {
      return 'high';
    }
    
    // Medium severity errors
    if (message.includes('validation') ||
        message.includes('calculation')) {
      return 'medium';
    }
    
    // Default to low
    return 'low';
  }

  /**
   * Store error locally for debugging
   */
  private storeError(error: AppError): void {
    this.errors.unshift(error);
    
    // Limit stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  /**
   * Send error to monitoring service (mock implementation)
   */
  private sendToMonitoring(error: AppError): void {
    // In production, send to services like Sentry, LogRocket, etc.
    try {
      // Mock monitoring API call
      if (window.navigator.onLine) {
        // Only attempt if online
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: error.id,
            message: error.message,
            code: error.code,
            severity: error.severity,
            timestamp: error.timestamp,
            context: error.context,
            stack: error.originalError?.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(err => {
          console.warn('Failed to send error to monitoring:', err);
        });
      }
    } catch (monitoringError) {
      console.warn('Error monitoring service failed:', monitoringError);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCode: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = {};
    const byCode: Record<string, number> = {};
    
    this.errors.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });
    
    return {
      total: this.errors.length,
      bySeverity,
      byCode
    };
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: AppError): boolean {
    // Network errors can be retried
    if (error.code.includes('NETWORK') || 
        error.code.includes('FETCH') ||
        error.message.toLowerCase().includes('network')) {
      return true;
    }
    
    // Temporary server errors can be retried
    if (error.code.includes('SERVER_ERROR') || 
        error.code.includes('TIMEOUT')) {
      return true;
    }
    
    // Don't retry authentication or validation errors
    if (error.code.includes('AUTH') || 
        error.code.includes('VALIDATION') ||
        error.code.includes('UNAUTHORIZED')) {
      return false;
    }
    
    return false;
  }
}

// Error boundary helper for React components
export class ErrorBoundaryService {
  static handleReactError(error: Error, errorInfo: any): AppError {
    return errorService.handleError(error, {
      component: 'ErrorBoundary',
      action: 'render',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }
}

// Specialized error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class FinancialCalculationError extends Error {
  constructor(message: string, public calculation?: string) {
    super(message);
    this.name = 'FinancialCalculationError';
  }
}

// Global error service instance
export const errorService = new ErrorService();

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    errorService.handleError(event.error, {
      component: 'Global',
      action: 'uncaught_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorService.handleError(event.reason, {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    });
  });
}

// Export helper functions for common error patterns
export const ErrorHelpers = {
  /**
   * Wrap async functions with error handling
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: ErrorContext
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        const appError = errorService.handleError(error, context);
        throw new Error(appError.userMessage);
      }
    }) as T;
  },

  /**
   * Wrap sync functions with error handling
   */
  wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    context?: ErrorContext
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        const appError = errorService.handleError(error, context);
        throw new Error(appError.userMessage);
      }
    }) as T;
  },

  /**
   * Create retry mechanism for functions
   */
  withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context?: ErrorContext
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      let lastError: AppError | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn();
          resolve(result);
          return;
        } catch (error) {
          lastError = errorService.handleError(error, {
            ...context,
            additionalData: { attempt, maxRetries }
          });
          
          if (attempt < maxRetries && errorService.shouldRetry(lastError)) {
            await new Promise(res => setTimeout(res, delay * Math.pow(2, attempt)));
            continue;
          }
          
          break;
        }
      }
      
      reject(new Error(lastError?.userMessage || 'Operation failed after retries'));
    });
  }
};

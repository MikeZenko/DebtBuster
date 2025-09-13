import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ErrorBoundaryService, errorService } from '../services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  retryCount: number;
  userMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: null,
      retryCount: 0,
      userMessage: 'Something went wrong. Please try again.'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to our error service
    const appError = ErrorBoundaryService.handleReactError(error, errorInfo);
    
    this.setState({
      errorId: appError.id,
      userMessage: appError.userMessage
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, suggest page reload
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {this.state.userMessage}
              </p>
              
              {this.state.errorId && (
                <p className="text-xs text-center text-muted-foreground">
                  Error ID: {this.state.errorId}
                </p>
              )}
              
              <div className="flex flex-col gap-2">
                {this.state.retryCount < this.maxRetries ? (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                ) : (
                  <Button onClick={() => window.location.reload()} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Attempt {this.state.retryCount} of {this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: string) => {
    errorService.handleError(error, {
      component: context || 'UnknownComponent',
      action: 'hook_error'
    });
  }, []);
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-2 border-red-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Something went wrong</CardTitle>
                  <p className="text-sm text-red-700 mt-1">
                    We encountered an unexpected error. Please try again.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Error Message */}
                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">Error Details:</p>
                    <code className="text-sm text-red-800 bg-white px-2 py-1 rounded block overflow-x-auto">
                      {this.state.error.message}
                    </code>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={this.handleReset}
                    className="gap-2 bg-[#1A237E] hover:bg-[#283593] text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go to Homepage
                  </Button>
                </div>

                {/* Support Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Need help?</strong>
                  </p>
                  <p className="text-sm text-blue-800">
                    If this problem persists, please contact support at{' '}
                    <a
                      href="mailto:ccell@lnu.edu.ph"
                      className="underline font-medium"
                    >
                      ccell@lnu.edu.ph
                    </a>{' '}
                    with the error details above.
                  </p>
                </div>

                {/* Stack Trace (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

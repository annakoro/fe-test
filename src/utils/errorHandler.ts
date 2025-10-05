interface ErrorLogData {
  errorId: string;
  type: 'unhandled-promise' | 'global-error' | 'api-error' | 'websocket-error' | 'component-error';
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  additionalData?: Record<string, any>;
}

interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

class ErrorHandler {
  private errorListeners: Array<(error: ErrorLogData) => void> = [];
  private notificationListeners: Array<(notification: ErrorNotification) => void> = [];
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {
      return;
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Handle global JavaScript errors
    window.addEventListener('error', this.handleGlobalError);

    this.isInitialized = true;
  }

  cleanup() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
    this.isInitialized = false;
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const errorId = this.generateErrorId();

    const errorData: ErrorLogData = {
      errorId,
      type: 'unhandled-promise',
      message: error?.message || 'Unhandled promise rejection',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: {
        reason: error,
      },
    };

    this.logError(errorData);
    this.notifyError(errorData);

    // Prevent the default browser behavior (logging to console)
    event.preventDefault();
  };

  private handleGlobalError = (event: ErrorEvent) => {
    const errorId = this.generateErrorId();

    const errorData: ErrorLogData = {
      errorId,
      type: 'global-error',
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    };

    this.logError(errorData);
    this.notifyError(errorData);
  };

  // Public method for manually reporting errors
  reportError(
    error: Error | string,
    type: ErrorLogData['type'] = 'component-error',
    additionalData?: Record<string, any>
  ) {
    const errorId = this.generateErrorId();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const errorData: ErrorLogData = {
      errorId,
      type,
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData,
    };

    this.logError(errorData);
    this.notifyError(errorData);

    return errorId;
  }

  // Report API errors with specific context
  reportApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    responseData?: any
  ) {
    return this.reportError(error, 'api-error', {
      endpoint,
      method,
      statusCode,
      responseData,
    });
  }

  // Report WebSocket errors with connection context
  reportWebSocketError(
    error: Error,
    connectionState: string,
    lastMessage?: any
  ) {
    return this.reportError(error, 'websocket-error', {
      connectionState,
      lastMessage,
    });
  }

  private logError(errorData: ErrorLogData) {
    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Global Error Handler [${errorData.errorId}]`);
      console.error('Type:', errorData.type);
      console.error('Message:', errorData.message);
      if (errorData.stack) {
        console.error('Stack:', errorData.stack);
      }
      if (errorData.additionalData) {
        console.error('Additional Data:', errorData.additionalData);
      }
      console.groupEnd();
    }

    // In production, send to logging service
    // this.sendToLoggingService(errorData);
  }

  private notifyError(errorData: ErrorLogData) {
    const notification: ErrorNotification = {
      id: errorData.errorId,
      type: 'error',
      title: this.getErrorTitle(errorData.type),
      message: this.getUserFriendlyMessage(errorData),
      timestamp: new Date(),
      actions: this.getErrorActions(errorData),
    };

    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (listenerError) {
        console.error('Error in notification listener:', listenerError);
      }
    });
  }

  private getErrorTitle(type: ErrorLogData['type']): string {
    switch (type) {
      case 'api-error':
        return 'Connection Error';
      case 'websocket-error':
        return 'Real-time Connection Issue';
      case 'unhandled-promise':
        return 'Application Error';
      case 'global-error':
        return 'Unexpected Error';
      case 'component-error':
        return 'Display Error';
      default:
        return 'Error';
    }
  }

  private getUserFriendlyMessage(errorData: ErrorLogData): string {
    switch (errorData.type) {
      case 'api-error':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'websocket-error':
        return 'Lost connection to real-time updates. The application will attempt to reconnect automatically.';
      case 'unhandled-promise':
        if (errorData.message.includes('fetch')) {
          return 'Network request failed. Please check your connection and try again.';
        }
        return 'An unexpected error occurred. Please refresh the page if the problem persists.';
      case 'global-error':
        if (errorData.message.includes('Loading chunk')) {
          return 'Failed to load application resources. Please refresh the page to get the latest version.';
        }
        return 'An unexpected error occurred. Please refresh the page if the problem persists.';
      case 'component-error':
        return 'A display error occurred. The application will attempt to recover automatically.';
      default:
        return errorData.message;
    }
  }

  private getErrorActions(errorData: ErrorLogData): ErrorNotification['actions'] {
    const actions: ErrorNotification['actions'] = [];

    // Add refresh action for certain error types
    if (['global-error', 'unhandled-promise'].includes(errorData.type)) {
      actions.push({
        label: 'Refresh Page',
        action: () => window.location.reload(),
      });
    }

    // Add retry action for API errors
    if (errorData.type === 'api-error') {
      actions.push({
        label: 'Retry',
        action: () => {
          // This would trigger a retry mechanism
          // Implementation depends on the specific context
          console.log('Retry action triggered for error:', errorData.errorId);
        },
      });
    }

    return actions;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Listener management
  onError(listener: (error: ErrorLogData) => void) {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  onNotification(listener: (notification: ErrorNotification) => void) {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  // Method to send errors to external logging service
  private sendToLoggingService(errorData: ErrorLogData) {
    // In a real application, you would send this to your logging service
    // Example implementations:
    
    // Sentry
    // Sentry.captureException(new Error(errorData.message), {
    //   tags: { type: errorData.type },
    //   extra: errorData.additionalData,
    // });

    // LogRocket
    // LogRocket.captureException(new Error(errorData.message));

    // Custom logging endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(() => {
    //   // Silently fail if logging service is unavailable
    // });
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export types for use in other components
export type { ErrorLogData, ErrorNotification };
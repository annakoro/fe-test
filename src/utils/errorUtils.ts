import { errorHandler } from './errorHandler';

// Re-export errorHandler for convenience
export { errorHandler };

// Error types for better categorization
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
}

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType,
    statusCode?: number,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.context = context;
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed', context?: Record<string, any>) {
    super(message, ErrorType.NETWORK_ERROR, undefined, true, context);
    this.name = 'NetworkError';
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    context?: Record<string, any>
  ) {
    const isRetryable = statusCode >= 500 || statusCode === 429; // Server errors and rate limits are retryable
    const type = statusCode >= 500 ? ErrorType.SERVER_ERROR : ErrorType.CLIENT_ERROR;
    
    super(message, type, statusCode, isRetryable, context);
    this.name = 'ApiError';
  }
}

export class WebSocketError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.WEBSOCKET_ERROR, undefined, true, context);
    this.name = 'WebSocketError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.VALIDATION_ERROR, undefined, false, context);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timed out', context?: Record<string, any>) {
    super(message, ErrorType.TIMEOUT_ERROR, undefined, true, context);
    this.name = 'TimeoutError';
  }
}

// Error handling utilities
export const handleApiError = (error: any, endpoint: string, method: string): AppError => {
  let appError: AppError;

  if (error.name === 'AbortError') {
    appError = new TimeoutError('Request was cancelled', { endpoint, method });
  } else if (!navigator.onLine) {
    appError = new NetworkError('No internet connection', { endpoint, method });
  } else if (error.response) {
    // HTTP error response
    const statusCode = error.response.status;
    const message = error.response.data?.message || error.message || 'API request failed';
    appError = new ApiError(message, statusCode, { 
      endpoint, 
      method, 
      responseData: error.response.data 
    });
  } else if (error.request) {
    // Network error
    appError = new NetworkError('Failed to connect to server', { endpoint, method });
  } else {
    // Other error
    appError = new AppError(
      error.message || 'Unknown API error',
      ErrorType.API_ERROR,
      undefined,
      false,
      { endpoint, method }
    );
  }

  // Report to error handler
  errorHandler.reportApiError(appError, endpoint, method, appError.statusCode, appError.context);

  return appError;
};

export const handleWebSocketError = (error: any, connectionState: string): WebSocketError => {
  const wsError = new WebSocketError(
    error.message || 'WebSocket connection error',
    { connectionState, originalError: error }
  );

  // Report to error handler
  errorHandler.reportWebSocketError(wsError, connectionState);

  return wsError;
};

// Retry logic with exponential backoff
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: AppError) => boolean;
}

export const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: AppError) => error.isRetryable,
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const config = { ...defaultRetryOptions, ...options };
  let lastError: AppError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        ErrorType.API_ERROR
      );

      lastError = appError;

      // Don't retry on last attempt or if error is not retryable
      if (attempt === config.maxRetries || !config.retryCondition!(appError)) {
        throw appError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  // This should never be reached due to the loop logic, but TypeScript requires it
  throw new AppError(lastError?.message || 'Operation failed after retries', ErrorType.API_ERROR);
};

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          'Circuit breaker is open - service temporarily unavailable',
          ErrorType.SERVER_ERROR,
          503,
          true
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

// Error recovery strategies
export const createErrorRecoveryStrategy = (errorType: ErrorType) => {
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
      return {
        message: 'Check your internet connection and try again',
        actions: [
          { label: 'Retry', action: () => window.location.reload() },
          { label: 'Check Connection', action: () => window.open('https://www.google.com', '_blank') },
        ],
      };

    case ErrorType.SERVER_ERROR:
      return {
        message: 'Server is temporarily unavailable. Please try again in a few minutes.',
        actions: [
          { label: 'Retry', action: () => window.location.reload() },
        ],
      };

    case ErrorType.WEBSOCKET_ERROR:
      return {
        message: 'Real-time connection lost. Attempting to reconnect...',
        actions: [
          { label: 'Refresh', action: () => window.location.reload() },
        ],
      };

    case ErrorType.AUTHENTICATION_ERROR:
      return {
        message: 'Your session has expired. Please log in again.',
        actions: [
          { label: 'Login', action: () => {/* Redirect to login */} },
        ],
      };

    case ErrorType.RATE_LIMIT_ERROR:
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        actions: [
          { label: 'Wait and Retry', action: () => setTimeout(() => window.location.reload(), 5000) },
        ],
      };

    default:
      return {
        message: 'An unexpected error occurred. Please try refreshing the page.',
        actions: [
          { label: 'Refresh', action: () => window.location.reload() },
        ],
      };
  }
};

// Logging utilities
export const logError = (error: AppError, context?: Record<string, any>) => {
  const logData = {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    isRetryable: error.isRetryable,
    stack: error.stack,
    context: { ...error.context, ...context },
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Use logData for production logging
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service in production
    console.error('Error logged:', logData);
  }

  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error [${error.type}]`);
    console.error('Message:', error.message);
    console.error('Type:', error.type);
    console.error('Retryable:', error.isRetryable);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    if (error.context) {
      console.error('Context:', error.context);
    }
    if (context) {
      console.error('Additional Context:', context);
    }
    console.groupEnd();
  }

  // In production, send to logging service
  // sendToLoggingService(logData);
};
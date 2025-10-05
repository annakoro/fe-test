import {
  AppError,
  NetworkError,
  ApiError,
  WebSocketError,
  ValidationError,
  TimeoutError,
  ErrorType,
  handleApiError,
  handleWebSocketError,
  withRetry,
  CircuitBreaker,
  createErrorRecoveryStrategy,
  logError,
} from '../errorUtils';

// Mock the error handler
jest.mock('../errorHandler', () => ({
  errorHandler: {
    reportApiError: jest.fn(),
    reportWebSocketError: jest.fn(),
  },
}));

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with correct properties', () => {
      const error = new AppError(
        'Test error',
        ErrorType.API_ERROR,
        500,
        true,
        { extra: 'data' }
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.API_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual({ extra: 'data' });
      expect(error.name).toBe('AppError');
    });
  });

  describe('NetworkError', () => {
    it('creates network error with default message', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Network connection failed');
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('NetworkError');
    });

    it('creates network error with custom message and context', () => {
      const error = new NetworkError('Custom network error', { endpoint: '/test' });

      expect(error.message).toBe('Custom network error');
      expect(error.context).toEqual({ endpoint: '/test' });
    });
  });

  describe('ApiError', () => {
    it('creates API error with server error status', () => {
      const error = new ApiError('Server error', 500, { endpoint: '/test' });

      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ErrorType.SERVER_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ApiError');
    });

    it('creates API error with client error status', () => {
      const error = new ApiError('Bad request', 400, { endpoint: '/test' });

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.CLIENT_ERROR);
      expect(error.isRetryable).toBe(false);
    });

    it('marks rate limit errors as retryable', () => {
      const error = new ApiError('Rate limited', 429);

      expect(error.type).toBe(ErrorType.CLIENT_ERROR);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('WebSocketError', () => {
    it('creates WebSocket error', () => {
      const error = new WebSocketError('Connection failed', { state: 'connecting' });

      expect(error.message).toBe('Connection failed');
      expect(error.type).toBe(ErrorType.WEBSOCKET_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual({ state: 'connecting' });
      expect(error.name).toBe('WebSocketError');
    });
  });

  describe('ValidationError', () => {
    it('creates validation error', () => {
      const error = new ValidationError('Invalid data', { field: 'email' });

      expect(error.message).toBe('Invalid data');
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('TimeoutError', () => {
    it('creates timeout error with default message', () => {
      const error = new TimeoutError();

      expect(error.message).toBe('Request timed out');
      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('TimeoutError');
    });
  });
});

describe('Error Handling Utilities', () => {
  describe('handleApiError', () => {
    it('handles abort error', () => {
      const abortError = { name: 'AbortError' };
      const result = handleApiError(abortError, '/test', 'GET');

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.message).toBe('Request was cancelled');
    });

    it('handles offline error', () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const networkError = { message: 'Failed to fetch' };
      const result = handleApiError(networkError, '/test', 'GET');

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toBe('No internet connection');

      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });
    });

    it('handles HTTP response error', () => {
      const httpError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };
      const result = handleApiError(httpError, '/test', 'GET');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Not found');
    });

    it('handles network request error', () => {
      const requestError = {
        request: {},
        message: 'Network error',
      };
      const result = handleApiError(requestError, '/test', 'GET');

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toBe('Failed to connect to server');
    });
  });

  describe('handleWebSocketError', () => {
    it('creates WebSocket error with context', () => {
      const originalError = new Error('Connection failed');
      const result = handleWebSocketError(originalError, 'connecting');

      expect(result).toBeInstanceOf(WebSocketError);
      expect(result.message).toBe('Connection failed');
      expect(result.context).toEqual({
        connectionState: 'connecting',
        originalError,
      });
    });
  });
});

describe('Retry Logic', () => {
  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network failed'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new ValidationError('Invalid data'));

      await expect(withRetry(operation, { maxRetries: 2 })).rejects.toThrow('Invalid data');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('exhausts all retry attempts', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new NetworkError('Network failed'));

      await expect(withRetry(operation, { maxRetries: 2 })).rejects.toThrow('Network failed');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('respects custom retry condition', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new ApiError('Server error', 500));

      const customRetryCondition = (error: AppError) => error.statusCode !== 500;

      await expect(withRetry(operation, {
        maxRetries: 2,
        retryCondition: customRetryCondition,
      })).rejects.toThrow('Server error');

      expect(operation).toHaveBeenCalledTimes(1); // Should not retry
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 100, 200); // 2 failures, 100ms recovery, 200ms monitoring
  });

  it('allows operations when closed', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(operation);

    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
  });

  it('opens after failure threshold', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));

    // First failure
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    expect(circuitBreaker.getState().state).toBe('CLOSED');

    // Second failure - should open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    expect(circuitBreaker.getState().state).toBe('OPEN');
  });

  it('rejects operations when open', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));

    // Trigger failures to open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');

    // Should now reject without calling operation
    operation.mockClear();
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    expect(operation).not.toHaveBeenCalled();
  });

  it('transitions to half-open after recovery timeout', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValue('success');

    // Open the circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should now be half-open and allow one attempt
    const result = await circuitBreaker.execute(operation);
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
  });

  it('resets failure count on success', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValue('success');

    // One failure
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    expect(circuitBreaker.getState().failures).toBe(1);

    // Success should reset failures
    await circuitBreaker.execute(operation);
    expect(circuitBreaker.getState().failures).toBe(0);
  });

  it('can be manually reset', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));

    // Open the circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
    expect(circuitBreaker.getState().state).toBe('OPEN');

    // Manual reset
    circuitBreaker.reset();
    expect(circuitBreaker.getState().state).toBe('CLOSED');
    expect(circuitBreaker.getState().failures).toBe(0);
  });
});

describe('Error Recovery Strategies', () => {
  it('provides network error recovery strategy', () => {
    const strategy = createErrorRecoveryStrategy(ErrorType.NETWORK_ERROR);

    expect(strategy.message).toContain('Check your internet connection');
    expect(strategy.actions).toHaveLength(2);
    expect(strategy.actions[0].label).toBe('Retry');
    expect(strategy.actions[1].label).toBe('Check Connection');
  });

  it('provides server error recovery strategy', () => {
    const strategy = createErrorRecoveryStrategy(ErrorType.SERVER_ERROR);

    expect(strategy.message).toContain('Server is temporarily unavailable');
    expect(strategy.actions).toHaveLength(1);
    expect(strategy.actions[0].label).toBe('Retry');
  });

  it('provides WebSocket error recovery strategy', () => {
    const strategy = createErrorRecoveryStrategy(ErrorType.WEBSOCKET_ERROR);

    expect(strategy.message).toContain('Real-time connection lost');
    expect(strategy.actions).toHaveLength(1);
    expect(strategy.actions[0].label).toBe('Refresh');
  });

  it('provides default recovery strategy for unknown errors', () => {
    const strategy = createErrorRecoveryStrategy('UNKNOWN_ERROR' as ErrorType);

    expect(strategy.message).toContain('An unexpected error occurred');
    expect(strategy.actions).toHaveLength(1);
    expect(strategy.actions[0].label).toBe('Refresh');
  });
});

describe('Logging Utilities', () => {
  const originalConsoleGroup = console.group;
  const originalConsoleError = console.error;
  const originalConsoleGroupEnd = console.groupEnd;

  beforeEach(() => {
    console.group = jest.fn();
    console.error = jest.fn();
    console.groupEnd = jest.fn();
  });

  afterEach(() => {
    console.group = originalConsoleGroup;
    console.error = originalConsoleError;
    console.groupEnd = originalConsoleGroupEnd;
  });

  it('logs error in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new ApiError('Test error', 500, { endpoint: '/test' });
    logError(error, { additional: 'context' });

    expect(console.group).toHaveBeenCalledWith('🚨 Error [SERVER_ERROR]');
    expect(console.error).toHaveBeenCalledWith('Message:', 'Test error');
    expect(console.error).toHaveBeenCalledWith('Type:', ErrorType.SERVER_ERROR);
    expect(console.error).toHaveBeenCalledWith('Retryable:', true);
    expect(console.error).toHaveBeenCalledWith('Status Code:', 500);
    expect(console.groupEnd).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('does not log error in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new ApiError('Test error', 500);
    logError(error);

    expect(console.group).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.groupEnd).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });
});
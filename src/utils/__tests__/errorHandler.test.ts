import { errorHandler, ErrorLogData, ErrorNotification } from '../errorHandler';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
  
  // Clean up any existing listeners
  errorHandler.cleanup();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
  
  errorHandler.cleanup();
});

describe('ErrorHandler', () => {
  describe('initialization', () => {
    it('initializes event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      errorHandler.initialize();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('does not initialize twice', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      errorHandler.initialize();
      errorHandler.initialize(); // Second call should be ignored
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2); // Only called once per event type
      
      addEventListenerSpy.mockRestore();
    });

    it('cleans up event listeners', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      errorHandler.initialize();
      errorHandler.cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('error reporting', () => {
    it('reports errors with correct data structure', () => {
      const errorListener = jest.fn();
      const notificationListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onError(errorListener);
      errorHandler.onNotification(notificationListener);
      
      const testError = new Error('Test error');
      const errorId = errorHandler.reportError(testError, 'component-error', { extra: 'data' });
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorId,
          type: 'component-error',
          message: 'Test error',
          stack: expect.any(String),
          timestamp: expect.any(String),
          userAgent: expect.any(String),
          url: expect.any(String),
          additionalData: { extra: 'data' },
        })
      );
      
      expect(notificationListener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: errorId,
          type: 'error',
          title: 'Display Error',
          message: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
    });

    it('reports API errors with specific context', () => {
      const errorListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onError(errorListener);
      
      const testError = new Error('API failed');
      const errorId = errorHandler.reportApiError(testError, '/api/test', 'GET', 500, { error: 'Server error' });
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorId,
          type: 'api-error',
          message: 'API failed',
          additionalData: {
            endpoint: '/api/test',
            method: 'GET',
            statusCode: 500,
            responseData: { error: 'Server error' },
          },
        })
      );
    });

    it('reports WebSocket errors with connection context', () => {
      const errorListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onError(errorListener);
      
      const testError = new Error('WebSocket failed');
      const errorId = errorHandler.reportWebSocketError(testError, 'connecting', { lastMessage: 'ping' });
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorId,
          type: 'websocket-error',
          message: 'WebSocket failed',
          additionalData: {
            connectionState: 'connecting',
            lastMessage: { lastMessage: 'ping' },
          },
        })
      );
    });

    it('generates unique error IDs', () => {
      errorHandler.initialize();
      
      const errorId1 = errorHandler.reportError('Error 1');
      const errorId2 = errorHandler.reportError('Error 2');
      
      expect(errorId1).not.toBe(errorId2);
      expect(errorId1).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(errorId2).toMatch(/^error_\d+_[a-z0-9]+$/);
    });
  });

  describe('unhandled promise rejection handling', () => {
    it('handles unhandled promise rejections', () => {
      const errorListener = jest.fn();
      const notificationListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onError(errorListener);
      errorHandler.onNotification(notificationListener);
      
      // Create a mock PromiseRejectionEvent
      const mockEvent = {
        reason: new Error('Unhandled promise rejection'),
        preventDefault: jest.fn(),
      } as any;
      
      // Trigger the handler directly
      window.dispatchEvent(new CustomEvent('unhandledrejection', { detail: mockEvent }));
      
      // Since we can't easily trigger the actual event, we'll test the handler method directly
      const handler = (errorHandler as any).handleUnhandledRejection;
      handler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unhandled-promise',
          message: 'Unhandled promise rejection',
        })
      );
    });
  });

  describe('global error handling', () => {
    it('handles global JavaScript errors', () => {
      const errorListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onError(errorListener);
      
      // Create a mock ErrorEvent
      const mockEvent = {
        message: 'Global error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Global error'),
      } as ErrorEvent;
      
      // Test the handler method directly
      const handler = (errorHandler as any).handleGlobalError;
      handler(mockEvent);
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'global-error',
          message: 'Global error',
          additionalData: {
            filename: 'test.js',
            lineno: 10,
            colno: 5,
          },
        })
      );
    });
  });

  describe('user-friendly messages', () => {
    it('provides appropriate messages for different error types', () => {
      const notificationListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onNotification(notificationListener);
      
      // Test API error
      errorHandler.reportApiError(new Error('API failed'), '/test', 'GET');
      expect(notificationListener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        })
      );
      
      // Test WebSocket error
      errorHandler.reportWebSocketError(new Error('WS failed'), 'disconnected');
      expect(notificationListener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Real-time Connection Issue',
          message: 'Lost connection to real-time updates. The application will attempt to reconnect automatically.',
        })
      );
    });
  });

  describe('error actions', () => {
    it('provides appropriate actions for different error types', () => {
      const notificationListener = jest.fn();
      
      errorHandler.initialize();
      errorHandler.onNotification(notificationListener);
      
      // Test global error (should have refresh action)
      errorHandler.reportError(new Error('Global error'), 'global-error');
      
      const notification = notificationListener.mock.calls[0][0] as ErrorNotification;
      expect(notification.actions).toHaveLength(1);
      expect(notification.actions![0].label).toBe('Refresh Page');
      
      // Test API error (should have retry action)
      errorHandler.reportApiError(new Error('API failed'), '/test', 'GET');
      
      const apiNotification = notificationListener.mock.calls[1][0] as ErrorNotification;
      expect(apiNotification.actions).toHaveLength(1);
      expect(apiNotification.actions![0].label).toBe('Retry');
    });
  });

  describe('listener management', () => {
    it('adds and removes error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      errorHandler.initialize();
      
      const unsubscribe1 = errorHandler.onError(listener1);
      const unsubscribe2 = errorHandler.onError(listener2);
      
      errorHandler.reportError('Test error');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      // Remove first listener
      unsubscribe1();
      
      listener1.mockClear();
      listener2.mockClear();
      
      errorHandler.reportError('Test error 2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      // Remove second listener
      unsubscribe2();
      
      listener2.mockClear();
      
      errorHandler.reportError('Test error 3');
      
      expect(listener2).not.toHaveBeenCalled();
    });

    it('adds and removes notification listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      errorHandler.initialize();
      
      const unsubscribe1 = errorHandler.onNotification(listener1);
      const unsubscribe2 = errorHandler.onNotification(listener2);
      
      errorHandler.reportError('Test error');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      // Remove first listener
      unsubscribe1();
      
      listener1.mockClear();
      listener2.mockClear();
      
      errorHandler.reportError('Test error 2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('development mode logging', () => {
    it('logs errors in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      errorHandler.initialize();
      errorHandler.reportError('Test error');
      
      expect(console.group).toHaveBeenCalledWith(expect.stringContaining('Global Error Handler'));
      expect(console.error).toHaveBeenCalledWith('Type:', 'component-error');
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test error');
      expect(console.groupEnd).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('does not log errors in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      errorHandler.initialize();
      errorHandler.reportError('Test error');
      
      expect(console.group).not.toHaveBeenCalled();
      expect(console.groupEnd).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
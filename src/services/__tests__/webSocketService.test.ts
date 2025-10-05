import { WebSocketServiceImpl } from '../webSocketService';
import { OutgoingWebSocketMessage, IncomingWebSocketMessage } from '../../types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Store reference for testing
    MockWebSocket.lastInstance = this;
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock successful send
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }
  }

  // Helper methods for testing
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code: number = 1006, reason: string = 'Connection lost'): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  static lastInstance: MockWebSocket | null = null;
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketServiceImpl', () => {
  let service: WebSocketServiceImpl;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Set up environment variable for testing
    process.env.REACT_APP_WEBSOCKET_URL = 'wss://test-api.example.com/ws';
    service = new WebSocketServiceImpl();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.REACT_APP_WEBSOCKET_URL;
  });

  afterEach(() => {
    service.disconnect();
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should use environment variable for WebSocket URL', () => {
      process.env.REACT_APP_WEBSOCKET_URL = 'wss://custom.example.com/ws';
      const customService = new WebSocketServiceImpl();
      expect((customService as any).wsUrl).toBe('wss://custom.example.com/ws');
    });

    it('should throw error when environment variable is not set', () => {
      delete process.env.REACT_APP_WEBSOCKET_URL;
      expect(() => new WebSocketServiceImpl()).toThrow('REACT_APP_WEBSOCKET_URL environment variable is required');
    });

    it('should throw error for invalid WebSocket URL', () => {
      process.env.REACT_APP_WEBSOCKET_URL = 'http://invalid-url.com';
      expect(() => new WebSocketServiceImpl()).toThrow('Invalid WebSocket URL format');
    });

    it('should reject localhost URLs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_WEBSOCKET_URL = 'wss://localhost:8080/ws';
      
      expect(() => new WebSocketServiceImpl()).toThrow('Invalid WebSocket URL format');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should require wss in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_WEBSOCKET_URL = 'ws://api.example.com/ws';
      
      expect(() => new WebSocketServiceImpl()).toThrow('Invalid WebSocket URL format');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket successfully', async () => {
      const connectPromise = service.connect();
      
      expect(service.getConnectionStatus()).toBe('connecting');
      
      // Simulate successful connection
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      
      await connectPromise;
      expect(service.getConnectionStatus()).toBe('connected');
    });

    it('should handle connection errors', async () => {
      const connectPromise = service.connect();
      
      // Simulate connection error
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateError();
      }
      
      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
      expect(service.getConnectionStatus()).toBe('error');
    });

    it('should disconnect properly', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      service.disconnect();
      
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should not connect if already connected', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      const initialStatus = service.getConnectionStatus();
      await service.connect(); // Second connect call
      
      expect(service.getConnectionStatus()).toBe(initialStatus);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
    });

    it('should parse tick events correctly', (done) => {
      const tickPayload = {
        pairAddress: '0x123',
        priceToken1Usd: 1.5,
        isOutlier: false,
        timestamp: '2023-01-01T00:00:00Z'
      };

      service.onMessage((message) => {
        expect(message.type).toBe('tick');
        expect(message.payload).toEqual(tickPayload);
        done();
      });

      // Simulate receiving a tick message
      const mockData = { type: 'tick', payload: tickPayload };
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage(mockData);
      }
    });

    it('should parse pair-stats events correctly', (done) => {
      const pairStatsPayload = {
        pairAddress: '0x456',
        mintable: true,
        freezable: false,
        honeypot: false,
        contractVerified: true
      };

      service.onMessage((message) => {
        expect(message.type).toBe('pair-stats');
        expect(message.payload).toEqual(pairStatsPayload);
        done();
      });

      const mockData = { type: 'pair-stats', payload: pairStatsPayload };
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage(mockData);
      }
    });

    it('should parse scanner-pairs events correctly', (done) => {
      const scannerPairsPayload = {
        pairs: ['0x123', '0x456', '0x789'],
        tableType: 'trending' as const
      };

      service.onMessage((message) => {
        expect(message.type).toBe('scanner-pairs');
        expect(message.payload).toEqual(scannerPairsPayload);
        done();
      });

      const mockData = { type: 'scanner-pairs', payload: scannerPairsPayload };
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage(mockData);
      }
    });

    it('should handle invalid messages gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      service.onMessage(() => {
        throw new Error('Should not be called for invalid messages');
      });

      // Send invalid message
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage({ type: 'invalid', payload: {} });
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown message type:',
        'invalid'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate malformed JSON
      if (MockWebSocket.lastInstance && MockWebSocket.lastInstance.onmessage) {
        MockWebSocket.lastInstance.onmessage(new MessageEvent('message', { data: 'invalid json' }));
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing WebSocket message:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
    });

    it('should send subscription messages when connected', () => {
      const sendSpy = jest.spyOn(MockWebSocket.lastInstance!, 'send');
      
      const subscriptionMessage: OutgoingWebSocketMessage = {
        type: 'scanner-filter',
        payload: { chain: 'ETH', minVolume: 1000 }
      };

      service.subscribe(subscriptionMessage);
      
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(subscriptionMessage));
    });

    it('should store subscriptions for reconnection', () => {
      const subscriptionMessage: OutgoingWebSocketMessage = {
        type: 'pair-stats',
        payload: { pairAddress: '0x123' }
      };

      service.subscribe(subscriptionMessage);
      
      // Check that subscription is stored
      expect((service as any).subscriptions.size).toBe(1);
    });

    it('should remove subscriptions on unsubscribe', () => {
      const subscriptionMessage: OutgoingWebSocketMessage = {
        type: 'pair',
        payload: { pairAddress: '0x123' }
      };

      service.subscribe(subscriptionMessage);
      expect((service as any).subscriptions.size).toBe(1);
      
      service.unsubscribe(subscriptionMessage);
      expect((service as any).subscriptions.size).toBe(0);
    });

    it('should resubscribe after reconnection', async () => {
      const subscriptionMessage: OutgoingWebSocketMessage = {
        type: 'scanner-filter',
        payload: { chain: 'SOL' }
      };

      service.subscribe(subscriptionMessage);
      
      // Simulate connection loss
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateClose(1006);
      }
      
      // Wait for reconnection attempt and simulate new connection
      jest.advanceTimersByTime(1000);
      
      // The reconnection creates a new WebSocket instance
      if (MockWebSocket.lastInstance) {
        const sendSpy = jest.spyOn(MockWebSocket.lastInstance, 'send');
        MockWebSocket.lastInstance.simulateOpen();
        
        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(subscriptionMessage));
      }
    });
  });

  describe('Auto-reconnection', () => {
    it('should attempt reconnection on unexpected close', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      const connectSpy = jest.spyOn(service, 'connect');
      
      // Simulate unexpected close
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateClose(1006, 'Connection lost');
      }
      
      // Should schedule reconnection
      jest.advanceTimersByTime(1000);
      
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should use exponential backoff for reconnection delays', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      // Simulate multiple failed reconnections
      for (let i = 0; i < 3; i++) {
        if (MockWebSocket.lastInstance) {
          MockWebSocket.lastInstance.simulateClose(1006);
        }
        jest.advanceTimersByTime(1000 * Math.pow(2, i));
      }
      
      expect((service as any).reconnectAttempts).toBe(3);
    });

    it('should stop reconnecting after max attempts', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      // Simulate max reconnection attempts
      for (let i = 0; i < 6; i++) {
        if (MockWebSocket.lastInstance) {
          MockWebSocket.lastInstance.simulateClose(1006);
        }
        jest.advanceTimersByTime(30000); // Max delay
      }
      
      expect(service.getConnectionStatus()).toBe('error');
    });

    it('should not reconnect on manual close', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      const connectSpy = jest.spyOn(service, 'connect');
      
      // Manual close (code 1000)
      service.disconnect();
      
      jest.advanceTimersByTime(5000);
      
      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle send errors gracefully', async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock send to throw error
      if (MockWebSocket.lastInstance) {
        jest.spyOn(MockWebSocket.lastInstance, 'send').mockImplementation(() => {
          throw new Error('Send failed');
        });
      }
      
      const message: OutgoingWebSocketMessage = {
        type: 'scanner-filter',
        payload: {}
      };
      
      service.subscribe(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending WebSocket message:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle subscription parsing errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Add invalid subscription
      (service as any).subscriptions.add('invalid:json');
      
      // Trigger resubscription
      (service as any).resubscribeAll();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error resubscribing:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Security Features', () => {
    beforeEach(async () => {
      const connectPromise = service.connect();
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateOpen();
      }
      await connectPromise;
    });

    it('should reject messages that are too large', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a large message
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB
      
      if (MockWebSocket.lastInstance && MockWebSocket.lastInstance.onmessage) {
        MockWebSocket.lastInstance.onmessage(new MessageEvent('message', { data: largeData }));
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Message too large, ignoring:',
        expect.any(Number)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should limit number of subscriptions', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Try to add more than max subscriptions
      for (let i = 0; i < 101; i++) {
        service.subscribe({
          type: 'pair',
          payload: { pairAddress: `0x${i.toString().padStart(40, '0')}` }
        });
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Maximum number of subscriptions reached:',
        100
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should validate incoming message structure', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      service.onMessage(() => {
        throw new Error('Should not be called for invalid messages');
      });

      // Send message with invalid structure
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage({ invalid: 'structure' });
      }
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid message structure:',
        { invalid: 'structure' }
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should validate tick payload', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      service.onMessage(() => {
        throw new Error('Should not be called for invalid payload');
      });

      // Send tick with invalid payload
      if (MockWebSocket.lastInstance) {
        MockWebSocket.lastInstance.simulateMessage({
          type: 'tick',
          payload: { invalid: 'payload' }
        });
      }
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid payload for message type:',
        'tick',
        { invalid: 'payload' }
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should limit number of message callbacks', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Add more than 50 callbacks
      for (let i = 0; i < 52; i++) {
        service.onMessage(() => {});
      }
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Too many message callbacks registered, removing oldest'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should remove specific message callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      service.onMessage(callback1);
      service.onMessage(callback2);
      
      expect((service as any).messageCallbacks).toHaveLength(2);
      
      service.removeMessageCallback(callback1);
      
      expect((service as any).messageCallbacks).toHaveLength(1);
      expect((service as any).messageCallbacks[0]).toBe(callback2);
    });

    it('should cleanup resources', () => {
      const callback = jest.fn();
      service.onMessage(callback);
      service.subscribe({ type: 'pair', payload: { pairAddress: '0x123' } });
      
      service.cleanup();
      
      expect((service as any).messageCallbacks).toHaveLength(0);
      expect((service as any).subscriptions.size).toBe(0);
      expect(service.getConnectionStatus()).toBe('disconnected');
    });
  });
});
import { SubscriptionManager, VisibleToken, SubscriptionStatus } from '../subscriptionManager';
import { WebSocketService } from '../../types/services';
import { OutgoingWebSocketMessage } from '../../types/websocket';

// Mock WebSocket service
const createMockWebSocketService = () => {
  const subscriptions = new Set();
  const messageCallbacks = [];
  let connectionStatus = 'connected';

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockImplementation(() => {
      connectionStatus = 'disconnected';
      subscriptions.clear();
    }),
    subscribe: jest.fn().mockImplementation((message) => {
      const key = `${message.type}:${JSON.stringify(message.payload)}`;
      subscriptions.add(key);
    }),
    unsubscribe: jest.fn().mockImplementation((message) => {
      const key = `${message.type}:${JSON.stringify(message.payload)}`;
      subscriptions.delete(key);
    }),
    onMessage: jest.fn().mockImplementation((callback) => {
      messageCallbacks.push(callback);
    }),
    removeMessageCallback: jest.fn().mockImplementation((callback) => {
      const index = messageCallbacks.indexOf(callback);
      if (index > -1) {
        messageCallbacks.splice(index, 1);
      }
    }),
    getConnectionStatus: jest.fn().mockImplementation(() => connectionStatus),
    cleanup: jest.fn().mockImplementation(() => {
      connectionStatus = 'disconnected';
      subscriptions.clear();
      messageCallbacks.length = 0;
    }),
    // Test helpers
    getSubscriptions: () => subscriptions,
    setConnectionStatus: (status) => {
      connectionStatus = status;
    },
    triggerMessage: (message) => {
      messageCallbacks.forEach(callback => callback(message));
    }
  };
};


describe('SubscriptionManager', () => {
  let mockWebSocketService;
  let subscriptionManager;

  beforeEach(() => {
    mockWebSocketService = createMockWebSocketService();
    subscriptionManager = new SubscriptionManager(mockWebSocketService, {
      maxRetries: 2,
      retryDelay: 100,
      maxConcurrentSubscriptions: 5,
      subscriptionTimeout: 1000,
      batchSize: 2,
      batchDelay: 50
    });
  });

  afterEach(() => {
    subscriptionManager.clearAllSubscriptions();
  });

  describe('subscribeToPair', () => {
    it('should subscribe to a pair successfully', async () => {
      const pairAddress = '0x123';
      
      await subscriptionManager.subscribeToPair(pairAddress);
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status).toBeTruthy();
      expect(status.pairAddress).toBe(pairAddress);
      expect(status.status).toBe('subscribed');
      expect(mockWebSocketService.getSubscriptions().size).toBe(1);
    });

    it('should not subscribe to the same pair twice', async () => {
      const pairAddress = '0x123';
      
      await subscriptionManager.subscribeToPair(pairAddress);
      await subscriptionManager.subscribeToPair(pairAddress);
      
      expect(mockWebSocketService.getSubscriptions().size).toBe(1);
    });

    it('should respect maximum concurrent subscriptions limit', async () => {
      const pairs = ['0x1', '0x2', '0x3', '0x4', '0x5', '0x6'];
      
      // Subscribe to more pairs than the limit (5)
      for (const pair of pairs) {
        await subscriptionManager.subscribeToPair(pair);
      }
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.subscribed + stats.pending).toBeLessThanOrEqual(5);
    });

    it('should handle subscription errors gracefully', async () => {
      const pairAddress = '0x123';
      
      // Mock WebSocket service to throw error
      jest.spyOn(mockWebSocketService, 'subscribe').mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await subscriptionManager.subscribeToPair(pairAddress);
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('error');
      expect(status.errorMessage).toBe('Connection failed');
    });
  });

  describe('unsubscribeFromPair', () => {
    it('should unsubscribe from a pair successfully', async () => {
      const pairAddress = '0x123';
      
      await subscriptionManager.subscribeToPair(pairAddress);
      await subscriptionManager.unsubscribeFromPair(pairAddress);
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('unsubscribed');
    });

    it('should handle unsubscribing from non-existent pair', async () => {
      const pairAddress = '0x123';
      
      // Should not throw error
      await expect(subscriptionManager.unsubscribeFromPair(pairAddress)).resolves.toBeUndefined();
    });
  });

  describe('updateVisibleTokens', () => {
    it('should subscribe to new visible tokens', async () => {
      const tokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' },
        { pairAddress: '0x2', tokenAddress: '0xb' }
      ];
      
      subscriptionManager.updateVisibleTokens(tokens);
      
      // Wait for batched operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.subscribed).toBe(2);
    });

    it('should unsubscribe from tokens no longer visible', async () => {
      const initialTokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' },
        { pairAddress: '0x2', tokenAddress: '0xb' }
      ];
      
      const updatedTokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' }
      ];
      
      subscriptionManager.updateVisibleTokens(initialTokens);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      subscriptionManager.updateVisibleTokens(updatedTokens);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status1 = subscriptionManager.getSubscriptionStatus('0x1');
      const status2 = subscriptionManager.getSubscriptionStatus('0x2');
      
      expect(status1.status).toBe('subscribed');
      expect(status2.status).toBe('unsubscribed');
    });

    it('should handle empty token list', async () => {
      const initialTokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' }
      ];
      
      subscriptionManager.updateVisibleTokens(initialTokens);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      subscriptionManager.updateVisibleTokens([]);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.subscribed).toBe(0);
    });
  });

  describe('batching operations', () => {
    it('should batch subscription operations', async () => {
      const tokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' },
        { pairAddress: '0x2', tokenAddress: '0xb' },
        { pairAddress: '0x3', tokenAddress: '0xc' },
        { pairAddress: '0x4', tokenAddress: '0xd' }
      ];
      
      const subscribeSpy = jest.spyOn(mockWebSocketService, 'subscribe');
      
      subscriptionManager.updateVisibleTokens(tokens);
      
      // Wait for batched operations
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should have been called for each token
      expect(subscribeSpy).toHaveBeenCalledTimes(4);
    });

    it('should process batches with delays', async () => {
      const tokens = Array.from({ length: 6 }, (_, i) => ({
        pairAddress: `0x${i}`,
        tokenAddress: `0xa${i}`
      }));
      
      const startTime = Date.now();
      subscriptionManager.updateVisibleTokens(tokens);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take some time due to batching delays
      expect(duration).toBeGreaterThan(100);
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.subscribed).toBe(5); // Limited by maxConcurrentSubscriptions
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed subscriptions', async () => {
      const pairAddress = '0x123';
      let callCount = 0;
      
      jest.spyOn(mockWebSocketService, 'subscribe').mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          throw new Error('Connection failed');
        }
      });
      
      await subscriptionManager.subscribeToPair(pairAddress);
      
      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('subscribed');
      expect(callCount).toBe(2);
    });

    it('should stop retrying after max attempts', async () => {
      const pairAddress = '0x123';
      
      jest.spyOn(mockWebSocketService, 'subscribe').mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await subscriptionManager.subscribeToPair(pairAddress);
      
      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('error');
      expect(status.retryCount).toBe(2); // maxRetries
    });

    it('should handle subscription timeout', async () => {
      const pairAddress = '0x123';
      
      // Create manager with very short timeout
      const shortTimeoutManager = new SubscriptionManager(mockWebSocketService, {
        subscriptionTimeout: 50
      });
      
      await shortTimeoutManager.subscribeToPair(pairAddress);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = shortTimeoutManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('error');
      expect(status.errorMessage).toBe('Subscription timeout');
    });
  });

  describe('subscription statistics', () => {
    it('should provide accurate subscription statistics', async () => {
      const tokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' },
        { pairAddress: '0x2', tokenAddress: '0xb' }
      ];
      
      subscriptionManager.updateVisibleTokens(tokens);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.total).toBe(2);
      expect(stats.subscribed).toBe(2);
      expect(stats.pending).toBe(0);
      expect(stats.error).toBe(0);
      expect(stats.unsubscribed).toBe(0);
    });

    it('should track different subscription states', async () => {
      const pairAddress1 = '0x1';
      const pairAddress2 = '0x2';
      
      // One successful subscription
      await subscriptionManager.subscribeToPair(pairAddress1);
      
      // One failed subscription
      jest.spyOn(mockWebSocketService, 'subscribe').mockImplementation(() => {
        throw new Error('Failed');
      });
      await subscriptionManager.subscribeToPair(pairAddress2);
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.subscribed).toBe(1);
      expect(stats.error).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clear all subscriptions on cleanup', async () => {
      const tokens = [
        { pairAddress: '0x1', tokenAddress: '0xa' },
        { pairAddress: '0x2', tokenAddress: '0xb' }
      ];
      
      subscriptionManager.updateVisibleTokens(tokens);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await subscriptionManager.clearAllSubscriptions();
      
      const stats = subscriptionManager.getSubscriptionStats();
      expect(stats.total).toBe(0);
      expect(mockWebSocketService.getSubscriptions().size).toBe(0);
    });
  });

  describe('subscription confirmation', () => {
    it('should confirm pending subscriptions', async () => {
      const pairAddress = '0x123';
      
      // Mock to keep subscription in pending state
      jest.spyOn(mockWebSocketService, 'subscribe').mockImplementation(() => {
        // Don't immediately set to subscribed
      });
      
      await subscriptionManager.subscribeToPair(pairAddress);
      
      // Manually set to pending for test
      const manager = subscriptionManager;
      manager.subscriptions.set(pairAddress, {
        pairAddress,
        status: 'pending',
        retryCount: 0
      });
      
      subscriptionManager.confirmSubscription(pairAddress);
      
      const status = subscriptionManager.getSubscriptionStatus(pairAddress);
      expect(status.status).toBe('subscribed');
      expect(status.subscribedAt).toBeDefined();
    });
  });
});
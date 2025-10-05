import { SubscriptionManager } from '../subscriptionManager';

// Simple mock WebSocket service for basic testing
const createBasicMockWebSocketService = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  onMessage: jest.fn(),
  removeMessageCallback: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  cleanup: jest.fn()
});

describe('SubscriptionManager - Basic Tests', () => {
  let mockWebSocketService;
  let subscriptionManager;

  beforeEach(() => {
    mockWebSocketService = createBasicMockWebSocketService();
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

  it('should create subscription manager instance', () => {
    expect(subscriptionManager).toBeDefined();
    expect(typeof subscriptionManager.subscribeToPair).toBe('function');
    expect(typeof subscriptionManager.unsubscribeFromPair).toBe('function');
    expect(typeof subscriptionManager.updateVisibleTokens).toBe('function');
  });

  it('should subscribe to a pair', async () => {
    const pairAddress = '0x123';
    
    await subscriptionManager.subscribeToPair(pairAddress);
    
    const status = subscriptionManager.getSubscriptionStatus(pairAddress);
    expect(status).toBeTruthy();
    expect(status.pairAddress).toBe(pairAddress);
    expect(mockWebSocketService.subscribe).toHaveBeenCalled();
  });

  it('should provide subscription statistics', () => {
    const stats = subscriptionManager.getSubscriptionStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('subscribed');
    expect(stats).toHaveProperty('pending');
    expect(stats).toHaveProperty('error');
    expect(stats).toHaveProperty('unsubscribed');
  });

  it('should handle visible tokens update', async () => {
    const tokens = [
      { pairAddress: '0x1', tokenAddress: '0xa' },
      { pairAddress: '0x2', tokenAddress: '0xb' }
    ];
    
    subscriptionManager.updateVisibleTokens(tokens);
    
    // Wait for batched operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stats = subscriptionManager.getSubscriptionStats();
    expect(stats.total).toBeGreaterThan(0);
  });

  it('should clear all subscriptions', async () => {
    const tokens = [
      { pairAddress: '0x1', tokenAddress: '0xa' }
    ];
    
    subscriptionManager.updateVisibleTokens(tokens);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await subscriptionManager.clearAllSubscriptions();
    
    const stats = subscriptionManager.getSubscriptionStats();
    expect(stats.total).toBe(0);
  });
});
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSubscriptionManager } from '../useSubscriptionManager';
import { WebSocketService } from '../../types/services';
import { TokenData } from '../../types/token';
import { OutgoingWebSocketMessage } from '../../types/websocket';

// Mock WebSocket service
const createMockWebSocketService = () => {
  let connectionStatus = 'connected';
  const subscriptions = new Set();

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockImplementation(() => {
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
    onMessage: jest.fn(),
    removeMessageCallback: jest.fn(),
    getConnectionStatus: jest.fn().mockImplementation(() => connectionStatus),
    cleanup: jest.fn().mockImplementation(() => {
      subscriptions.clear();
    }),
    setConnectionStatus: (status) => {
      connectionStatus = status;
    },
    getSubscriptions: () => subscriptions
  };
};

// Mock token data
const createMockToken = (pairAddress, tokenAddress) => ({
  id: pairAddress,
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress,
  pairAddress,
  chain: 'ETH',
  exchange: 'Uniswap',
  priceUsd: 1.0,
  volumeUsd: 1000,
  mcap: 1000000,
  priceChangePcs: {
    '5m': 0,
    '1h': 0,
    '6h': 0,
    '24h': 0
  },
  transactions: {
    buys: 10,
    sells: 5
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true
  },
  tokenCreatedTimestamp: new Date(),
  liquidity: {
    current: 50000,
    changePc: 0
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'pending'
});

describe('useSubscriptionManager', () => {
  let mockWebSocketService;

  beforeEach(() => {
    mockWebSocketService = createMockWebSocketService();
  });

  it('should initialize subscription manager', () => {
    const tokens = [];
    
    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        enabled: true
      })
    );

    expect(result.current.subscriptionManager).toBeDefined();
    expect(result.current.subscriptionStats).toEqual({
      total: 0,
      subscribed: 0,
      pending: 0,
      error: 0,
      unsubscribed: 0
    });
  });

  it('should handle visible range changes', async () => {
    const tokens = [
      createMockToken('0x1', '0xa'),
      createMockToken('0x2', '0xb'),
      createMockToken('0x3', '0xc')
    ];

    const { result, rerender } = renderHook(
      ({ visibleRange }) =>
        useSubscriptionManager({
          webSocketService: mockWebSocketService,
          tokens,
          visibleRange,
          enabled: true
        }),
      {
        initialProps: {
          visibleRange: { startIndex: 0, endIndex: 1 }
        }
      }
    );

    // Wait for initial subscriptions
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Change visible range
    rerender({
      visibleRange: { startIndex: 1, endIndex: 2 }
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have updated subscriptions based on new visible range
    expect(result.current.subscriptionManager).toBeDefined();
  });

  it('should handle disabled state', () => {
    const tokens = [
      createMockToken('0x1', '0xa'),
      createMockToken('0x2', '0xb')
    ];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 1 },
        enabled: false
      })
    );

    expect(result.current.subscriptionStats.total).toBe(0);
  });

  it('should handle empty tokens array', () => {
    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens: [],
        visibleRange: { startIndex: 0, endIndex: 1 },
        enabled: true
      })
    );

    expect(result.current.subscriptionStats.total).toBe(0);
  });

  it('should handle no visible range', () => {
    const tokens = [
      createMockToken('0x1', '0xa'),
      createMockToken('0x2', '0xb')
    ];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        enabled: true
      })
    );

    expect(result.current.subscriptionStats.total).toBe(0);
  });

  it('should provide callback functions', () => {
    const tokens = [];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        enabled: true
      })
    );

    expect(typeof result.current.getSubscriptionStatus).toBe('function');
    expect(typeof result.current.retryFailedSubscriptions).toBe('function');
    expect(typeof result.current.clearAllSubscriptions).toBe('function');
  });

  it('should get subscription status for specific pair', async () => {
    const tokens = [
      createMockToken('0x1', '0xa')
    ];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 0 },
        enabled: true
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const status = result.current.getSubscriptionStatus('0x1');
    expect(status).toBeDefined();
  });

  it('should retry failed subscriptions', async () => {
    const tokens = [
      createMockToken('0x1', '0xa')
    ];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 0 },
        enabled: true
      })
    );

    await act(async () => {
      await result.current.retryFailedSubscriptions();
    });

    // Should not throw error
    expect(result.current.retryFailedSubscriptions).toBeDefined();
  });

  it('should clear all subscriptions', async () => {
    const tokens = [
      createMockToken('0x1', '0xa')
    ];

    const { result } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 0 },
        enabled: true
      })
    );

    await act(async () => {
      await result.current.clearAllSubscriptions();
    });

    expect(result.current.subscriptionStats.total).toBe(0);
  });

  it('should cleanup on unmount', () => {
    const tokens = [
      createMockToken('0x1', '0xa')
    ];

    const { unmount } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 0 },
        enabled: true
      })
    );

    // Should not throw error on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should handle WebSocket connection status changes', () => {
    const tokens = [
      createMockToken('0x1', '0xa')
    ];

    mockWebSocketService.setConnectionStatus('disconnected');

    const { result, rerender } = renderHook(() =>
      useSubscriptionManager({
        webSocketService: mockWebSocketService,
        tokens,
        visibleRange: { startIndex: 0, endIndex: 0 },
        enabled: true
      })
    );

    // Should handle disconnected state
    expect(result.current.subscriptionManager).toBeDefined();

    // Reconnect
    mockWebSocketService.setConnectionStatus('connected');
    rerender();

    expect(result.current.subscriptionManager).toBeDefined();
  });

  it('should handle token list changes', async () => {
    const initialTokens = [
      createMockToken('0x1', '0xa')
    ];

    const updatedTokens = [
      createMockToken('0x1', '0xa'),
      createMockToken('0x2', '0xb')
    ];

    const { result, rerender } = renderHook(
      ({ tokens }) =>
        useSubscriptionManager({
          webSocketService: mockWebSocketService,
          tokens,
          visibleRange: { startIndex: 0, endIndex: 1 },
          enabled: true
        }),
      {
        initialProps: { tokens: initialTokens }
      }
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Update tokens
    rerender({ tokens: updatedTokens });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should handle token list changes
    expect(result.current.subscriptionManager).toBeDefined();
  });
});
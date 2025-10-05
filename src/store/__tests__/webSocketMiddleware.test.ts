// WebSocket Middleware Tests

import { configureStore } from '@reduxjs/toolkit';
import { webSocketMiddleware, webSocketActions } from '../middleware/webSocketMiddleware';
import { trendingTokensSlice } from '../slices/trendingTokensSlice';
import { newTokensSlice } from '../slices/newTokensSlice';
import { filtersSlice } from '../slices/filtersSlice';
import { TickEventPayload, PairStatsMsgData } from '../../types/websocket';
import { TokenData } from '../../types';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('webSocketMiddleware', () => {
  let store: any;
  
  const mockToken: TokenData = {
    id: 'test-pair',
    tokenName: 'Test Token',
    tokenSymbol: 'TEST',
    tokenAddress: 'test-token-address',
    pairAddress: 'test-pair',
    chain: 'ETH',
    exchange: 'uniswap',
    priceUsd: 1.0,
    volumeUsd: 100000,
    mcap: 1000000,
    priceChangePcs: { '5m': 0, '1h': 0, '6h': 0, '24h': 0 },
    transactions: { buys: 10, sells: 5 },
    audit: { mintable: false, freezable: false, honeypot: false, contractVerified: true },
    tokenCreatedTimestamp: new Date(),
    liquidity: { current: 500000, changePc: 0 },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed',
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        trendingTokens: trendingTokensSlice.reducer,
        newTokens: newTokensSlice.reducer,
        filters: filtersSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable for tests
        }).concat(webSocketMiddleware),
    });

    // Add mock tokens to both tables
    store.dispatch(trendingTokensSlice.actions.updateTokens({ tokens: [mockToken] }));
    store.dispatch(newTokensSlice.actions.updateTokens({ tokens: [mockToken] }));
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('tick event handling', () => {
    it('should handle tick events and update token prices', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair',
        priceToken1Usd: 2.5,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const action = webSocketActions.messageReceived({
        type: 'tick',
        payload: tickPayload,
      });

      store.dispatch(action);

      // Fast-forward timers to trigger batch update
      jest.advanceTimersByTime(150);

      const state = store.getState();
      
      // Both trending and new tokens should be updated
      expect(state.trendingTokens.tokens['test-pair'].priceUsd).toBe(2.5);
      expect(state.newTokens.tokens['test-pair'].priceUsd).toBe(2.5);
    });

    it('should ignore tick events with outlier swaps', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair',
        priceToken1Usd: 100.0,
        isOutlier: true,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const action = webSocketActions.messageReceived({
        type: 'tick',
        payload: tickPayload,
      });

      store.dispatch(action);
      jest.advanceTimersByTime(150);

      const state = store.getState();
      
      // Prices should remain unchanged
      expect(state.trendingTokens.tokens['test-pair'].priceUsd).toBe(1.0);
      expect(state.newTokens.tokens['test-pair'].priceUsd).toBe(1.0);
    });

    it('should ignore tick events for non-existent tokens', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'non-existent-pair',
        priceToken1Usd: 2.5,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const action = webSocketActions.messageReceived({
        type: 'tick',
        payload: tickPayload,
      });

      // Should not throw an error
      expect(() => {
        store.dispatch(action);
        jest.advanceTimersByTime(150);
      }).not.toThrow();
    });
  });

  describe('pair-stats event handling', () => {
    it('should handle pair-stats events and update audit information', () => {
      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'test-pair',
        mintable: true, // API sends true if mint auth is enabled
        freezable: false, // API sends false if freeze auth is disabled
        honeypot: true,
        contractVerified: false,
      };

      const action = webSocketActions.messageReceived({
        type: 'pair-stats',
        payload: pairStatsPayload,
      });

      store.dispatch(action);
      jest.advanceTimersByTime(100);

      const state = store.getState();
      
      // Both tables should be updated with the audit values as received
      expect(state.trendingTokens.tokens['test-pair'].audit.mintable).toBe(true);
      expect(state.trendingTokens.tokens['test-pair'].audit.freezable).toBe(false);
      expect(state.trendingTokens.tokens['test-pair'].audit.honeypot).toBe(true);
      expect(state.trendingTokens.tokens['test-pair'].audit.contractVerified).toBe(false);
      
      expect(state.newTokens.tokens['test-pair'].audit.mintable).toBe(true);
      expect(state.newTokens.tokens['test-pair'].audit.freezable).toBe(false);
      expect(state.newTokens.tokens['test-pair'].audit.honeypot).toBe(true);
      expect(state.newTokens.tokens['test-pair'].audit.contractVerified).toBe(false);
    });

    it('should handle pair-stats events for non-existent tokens', () => {
      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'non-existent-pair',
        mintable: true,
        freezable: false,
        honeypot: false,
        contractVerified: true,
      };

      const action = webSocketActions.messageReceived({
        type: 'pair-stats',
        payload: pairStatsPayload,
      });

      // Should not throw an error
      expect(() => {
        store.dispatch(action);
        jest.advanceTimersByTime(100);
      }).not.toThrow();
    });
  });

  describe('batch update behavior', () => {
    it('should process tick events and update token prices', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair',
        priceToken1Usd: 2.5,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      store.dispatch(webSocketActions.messageReceived({
        type: 'tick',
        payload: tickPayload,
      }));

      // Fast-forward timers to trigger batch update
      jest.advanceTimersByTime(150);

      const state = store.getState();
      
      // Verify that prices were updated
      expect(state.trendingTokens.tokens['test-pair'].priceUsd).toBe(2.5);
      expect(state.newTokens.tokens['test-pair'].priceUsd).toBe(2.5);
    });

    it('should handle multiple rapid updates efficiently', () => {
      // Send multiple tick events rapidly
      for (let i = 0; i < 10; i++) {
        const tickPayload: TickEventPayload = {
          pairAddress: 'test-pair',
          priceToken1Usd: 2.0 + i * 0.1,
          isOutlier: false,
          timestamp: '2024-01-01T12:00:00Z',
        };

        store.dispatch(webSocketActions.messageReceived({
          type: 'tick',
          payload: tickPayload,
        }));
      }

      // Fast-forward timers
      jest.advanceTimersByTime(150);

      const state = store.getState();
      
      // Should have the latest price
      expect(state.trendingTokens.tokens['test-pair'].priceUsd).toBe(2.9);
      expect(state.newTokens.tokens['test-pair'].priceUsd).toBe(2.9);
    });

    it('should handle mixed price and audit updates in batch', () => {
      // Send both tick and pair-stats events
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair',
        priceToken1Usd: 3.0,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'test-pair',
        mintable: false,
        freezable: true,
        honeypot: false,
        contractVerified: true,
      };

      store.dispatch(webSocketActions.messageReceived({
        type: 'tick',
        payload: tickPayload,
      }));

      store.dispatch(webSocketActions.messageReceived({
        type: 'pair-stats',
        payload: pairStatsPayload,
      }));

      jest.advanceTimersByTime(150);

      const state = store.getState();
      
      // Both price and audit should be updated
      expect(state.trendingTokens.tokens['test-pair'].priceUsd).toBe(3.0);
      expect(state.trendingTokens.tokens['test-pair'].audit.contractVerified).toBe(true);
    });
  });

  describe('unknown message types', () => {
    it('should handle unknown message types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const action = webSocketActions.messageReceived({
        type: 'unknown-type' as any,
        payload: {},
      });

      expect(() => {
        store.dispatch(action);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Unknown WebSocket message type:', 'unknown-type');
      
      consoleSpy.mockRestore();
    });
  });

  describe('action creators', () => {
    it('should create messageReceived action', () => {
      const message = {
        type: 'tick' as const,
        payload: { 
          pairAddress: 'test', 
          priceToken1Usd: 1.0, 
          isOutlier: false, 
          timestamp: '2024-01-01T12:00:00Z' 
        },
      };

      const action = webSocketActions.messageReceived(message);
      
      expect(action).toEqual({
        type: 'websocket/messageReceived',
        payload: message,
      });
    });

    it('should create connectionStatusChanged action', () => {
      const action = webSocketActions.connectionStatusChanged('connected');
      
      expect(action).toEqual({
        type: 'websocket/connectionStatusChanged',
        payload: 'connected',
      });
    });
  });
});
// Unit Tests for Real-time Update Handlers

import { configureStore } from '@reduxjs/toolkit';
import { updateHandlersService, updateHandlers } from '../updateHandlers';
import { trendingTokensSlice } from '../../store/slices/trendingTokensSlice';
import { newTokensSlice } from '../../store/slices/newTokensSlice';
import { TickEventPayload, PairStatsMsgData, ScannerPairsEventPayload } from '../../types/websocket';
import { TokenData } from '../../types/token';
import { RootState } from '../../store';

// Mock store setup
const createMockStore = (initialState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      trendingTokens: trendingTokensSlice.reducer,
      newTokens: newTokensSlice.reducer,
    },
    preloadedState: initialState as any,
  });
};

// Mock token data
const mockTokenData: TokenData = {
  id: 'test-pair-address',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: '0x123',
  pairAddress: 'test-pair-address',
  chain: 'ETH',
  exchange: 'Uniswap',
  priceUsd: 100,
  volumeUsd: 50000,
  mcap: 1000000,
  priceChangePcs: {
    '5m': 5,
    '1h': 10,
    '6h': 15,
    '24h': 20,
  },
  transactions: {
    buys: 10,
    sells: 5,
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
  },
  tokenCreatedTimestamp: new Date('2024-01-01'),
  liquidity: {
    current: 100000,
    changePc: 5,
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed',
};

describe('UpdateHandlersService', () => {
  let store: ReturnType<typeof createMockStore>;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    // Create store with mock token data
    store = createMockStore({
      trendingTokens: {
        tokens: { 'test-pair-address': mockTokenData },
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
      newTokens: {
        tokens: { 'test-pair-address': mockTokenData },
        sortConfig: { column: 'tokenCreatedTimestamp', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    mockDispatch = jest.fn();
    updateHandlersService.setDispatch(mockDispatch);
    
    // Clear any pending updates
    updateHandlersService.clearPendingUpdates();
  });

  afterEach(() => {
    jest.clearAllMocks();
    updateHandlersService.clearPendingUpdates();
  });

  describe('handleTickEvent', () => {
    it('should handle tick event for non-outlier swaps', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());

      // Wait for batch update to be scheduled
      setTimeout(() => {
        expect(mockDispatch).toHaveBeenCalled();
        const dispatchCall = mockDispatch.mock.calls[0][0];
        expect(dispatchCall.type).toContain('batchUpdate');
        expect(dispatchCall.payload.priceUpdates).toHaveLength(1);
        expect(dispatchCall.payload.priceUpdates[0].priceUsd).toBe(150);
      }, 150);
    });

    it('should skip outlier swaps', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: true,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());

      // Wait for potential batch update
      setTimeout(() => {
        expect(mockDispatch).not.toHaveBeenCalled();
      }, 150);
    });

    it('should handle tick event for tokens in both trending and new tokens', () => {
      // Add same token to both stores
      const stateWithBothTokens = {
        ...store.getState(),
        newTokens: {
          ...store.getState().newTokens,
          tokens: { 'test-pair-address': mockTokenData },
        },
      };

      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 200,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, stateWithBothTokens);

      setTimeout(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(2); // One for trending, one for new tokens
      }, 150);
    });

    it('should ignore tick events for unknown pair addresses', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'unknown-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());

      setTimeout(() => {
        expect(mockDispatch).not.toHaveBeenCalled();
      }, 150);
    });
  });

  describe('handlePairStatsEvent', () => {
    it('should handle pair stats event and update audit fields', () => {
      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'test-pair-address',
        mintable: true,
        freezable: false,
        honeypot: true,
        contractVerified: false,
      };

      updateHandlers.handlePairStatsEvent(pairStatsPayload, store.getState());

      setTimeout(() => {
        expect(mockDispatch).toHaveBeenCalled();
        const dispatchCall = mockDispatch.mock.calls[0][0];
        expect(dispatchCall.type).toContain('batchUpdate');
        expect(dispatchCall.payload.auditUpdates).toHaveLength(1);
        expect(dispatchCall.payload.auditUpdates[0].audit).toEqual({
          mintable: true,
          freezable: false,
          honeypot: true,
          contractVerified: false,
        });
      }, 150);
    });

    it('should handle pair stats for tokens in both stores', () => {
      const stateWithBothTokens = {
        ...store.getState(),
        newTokens: {
          ...store.getState().newTokens,
          tokens: { 'test-pair-address': mockTokenData },
        },
      };

      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'test-pair-address',
        mintable: false,
        freezable: true,
        honeypot: false,
        contractVerified: true,
      };

      updateHandlers.handlePairStatsEvent(pairStatsPayload, stateWithBothTokens);

      setTimeout(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(2);
      }, 150);
    });

    it('should ignore pair stats events for unknown pair addresses', () => {
      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'unknown-pair-address',
        mintable: true,
        freezable: false,
        honeypot: false,
        contractVerified: true,
      };

      updateHandlers.handlePairStatsEvent(pairStatsPayload, store.getState());

      setTimeout(() => {
        expect(mockDispatch).not.toHaveBeenCalled();
      }, 150);
    });
  });

  describe('handleScannerPairsEvent', () => {
    it('should remove tokens not in trending pairs list', () => {
      const scannerPairsPayload: ScannerPairsEventPayload = {
        pairs: ['other-pair-address'], // test-pair-address not included
        tableType: 'trending',
      };

      updateHandlers.handleScannerPairsEvent(scannerPairsPayload, store.getState());

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trendingTokens/removeToken',
          payload: 'test-pair-address',
        })
      );
    });

    it('should remove tokens not in new tokens pairs list', () => {
      const scannerPairsPayload: ScannerPairsEventPayload = {
        pairs: ['other-pair-address'], // test-pair-address not included
        tableType: 'new',
      };

      updateHandlers.handleScannerPairsEvent(scannerPairsPayload, store.getState());

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'newTokens/removeToken',
          payload: 'test-pair-address',
        })
      );
    });

    it('should not remove tokens that are still in pairs list', () => {
      const scannerPairsPayload: ScannerPairsEventPayload = {
        pairs: ['test-pair-address'], // token still included
        tableType: 'trending',
      };

      updateHandlers.handleScannerPairsEvent(scannerPairsPayload, store.getState());

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trendingTokens/removeToken',
        })
      );
    });

    it('should flush pending batched updates before dataset replacement', () => {
      // First add some batched updates
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());

      // Then trigger scanner pairs event
      const scannerPairsPayload: ScannerPairsEventPayload = {
        pairs: ['test-pair-address'],
        tableType: 'trending',
      };

      updateHandlers.handleScannerPairsEvent(scannerPairsPayload, store.getState());

      // Should have flushed the batched update
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Batching Logic', () => {
    it('should batch multiple price updates', () => {
      const tickPayload1: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const tickPayload2: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 160,
        isOutlier: false,
        timestamp: '2024-01-01T12:01:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload1, store.getState());
      updateHandlers.handleTickEvent(tickPayload2, store.getState());

      setTimeout(() => {
        // Should have batched both updates into one dispatch call
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        const dispatchCall = mockDispatch.mock.calls[0][0];
        expect(dispatchCall.payload.priceUpdates).toHaveLength(2);
      }, 150);
    });

    it('should flush immediately when batch size limit is reached', () => {
      // Create 51 tick events to exceed MAX_BATCH_SIZE (50)
      for (let i = 0; i < 51; i++) {
        const tickPayload: TickEventPayload = {
          pairAddress: 'test-pair-address',
          priceToken1Usd: 100 + i,
          isOutlier: false,
          timestamp: '2024-01-01T12:00:00Z',
        };

        updateHandlers.handleTickEvent(tickPayload, store.getState());
      }

      // Should have flushed immediately due to batch size limit
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle mixed price and audit updates in same batch', () => {
      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      const pairStatsPayload: PairStatsMsgData = {
        pairAddress: 'test-pair-address',
        mintable: true,
        freezable: false,
        honeypot: false,
        contractVerified: true,
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());
      updateHandlers.handlePairStatsEvent(pairStatsPayload, store.getState());

      setTimeout(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        const dispatchCall = mockDispatch.mock.calls[0][0];
        expect(dispatchCall.payload.priceUpdates).toHaveLength(1);
        expect(dispatchCall.payload.auditUpdates).toHaveLength(1);
      }, 150);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dispatch gracefully', () => {
      updateHandlersService.setDispatch(null as any);

      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 150,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      // Should not throw error
      expect(() => {
        updateHandlers.handleTickEvent(tickPayload, store.getState());
      }).not.toThrow();

      // Reset dispatch for other tests
      updateHandlersService.setDispatch(mockDispatch);
    });

    it('should handle malformed payloads gracefully', () => {
      const malformedPayload = {
        pairAddress: 'test-pair-address',
        // Missing required fields
      } as TickEventPayload;

      expect(() => {
        updateHandlers.handleTickEvent(malformedPayload, store.getState());
      }).not.toThrow();
    });
  });

  describe('Market Cap Calculation', () => {
    it('should preserve market cap ratio when updating price', () => {
      const originalPrice = mockTokenData.priceUsd;
      const originalMcap = mockTokenData.mcap;
      const newPrice = 200;

      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: newPrice,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, store.getState());

      setTimeout(() => {
        const dispatchCall = mockDispatch.mock.calls[0][0];
        const priceUpdate = dispatchCall.payload.priceUpdates[0];
        
        // Market cap should maintain the same ratio
        const expectedMcap = (originalMcap / originalPrice) * newPrice;
        expect(priceUpdate.mcap).toBe(expectedMcap);
      }, 150);
    });

    it('should fallback to existing mcap when price is zero', () => {
      const tokenWithZeroPrice = {
        ...mockTokenData,
        priceUsd: 0,
      };

      const stateWithZeroPrice = {
        ...store.getState(),
        trendingTokens: {
          ...store.getState().trendingTokens,
          tokens: { 'test-pair-address': tokenWithZeroPrice },
        },
      };

      const tickPayload: TickEventPayload = {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 100,
        isOutlier: false,
        timestamp: '2024-01-01T12:00:00Z',
      };

      updateHandlers.handleTickEvent(tickPayload, stateWithZeroPrice);

      setTimeout(() => {
        const dispatchCall = mockDispatch.mock.calls[0][0];
        const priceUpdate = dispatchCall.payload.priceUpdates[0];
        
        // Should fallback to existing mcap
        expect(priceUpdate.mcap).toBe(tokenWithZeroPrice.mcap);
      }, 150);
    });
  });
});
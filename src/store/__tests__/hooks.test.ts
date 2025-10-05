// Redux Hooks Tests

import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { trendingTokensSlice } from '../slices/trendingTokensSlice';
import { newTokensSlice } from '../slices/newTokensSlice';
import { filtersSlice } from '../slices/filtersSlice';
import { useTrendingTokens, useNewTokens, useFilters } from '../hooks';
import { TokenData } from '../../types';
import React from 'react';

const mockToken: TokenData = {
  id: 'test-token',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: 'test-address',
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

function createTestStore() {
  return configureStore({
    reducer: {
      trendingTokens: trendingTokensSlice.reducer,
      newTokens: newTokensSlice.reducer,
      filters: filtersSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
      }),
  });
}

function createWrapper(store: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

describe('Redux Hooks', () => {
  describe('useTrendingTokens', () => {
    it('should return initial state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useTrendingTokens(), { wrapper });
      
      expect(result.current.tokens).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.sortConfig.column).toBe('volumeUsd');
      expect(result.current.sortConfig.direction).toBe('desc');
    });

    it('should update tokens', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useTrendingTokens(), { wrapper });
      
      act(() => {
        result.current.updateTokens([mockToken]);
      });
      
      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toEqual(mockToken);
    });

    it('should update sort config', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useTrendingTokens(), { wrapper });
      
      act(() => {
        result.current.setSortConfig('priceUsd', 'asc');
      });
      
      expect(result.current.sortConfig.column).toBe('priceUsd');
      expect(result.current.sortConfig.direction).toBe('asc');
    });

    it('should update loading state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useTrendingTokens(), { wrapper });
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.loading).toBe(true);
    });

    it('should update error state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useTrendingTokens(), { wrapper });
      
      act(() => {
        result.current.setError('Test error');
      });
      
      expect(result.current.error).toBe('Test error');
    });
  });

  describe('useNewTokens', () => {
    it('should return initial state with age-based sorting', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useNewTokens(), { wrapper });
      
      expect(result.current.tokens).toEqual([]);
      expect(result.current.sortConfig.column).toBe('tokenCreatedTimestamp');
      expect(result.current.sortConfig.direction).toBe('desc');
    });

    it('should update tokens', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useNewTokens(), { wrapper });
      
      act(() => {
        result.current.updateTokens([mockToken]);
      });
      
      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toEqual(mockToken);
    });
  });

  describe('useFilters', () => {
    it('should return initial filter state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useFilters(), { wrapper });
      
      expect(result.current.filters.chain).toBe(null);
      expect(result.current.filters.minVolume).toBe(null);
      expect(result.current.filters.maxAge).toBe(null);
      expect(result.current.filters.minMarketCap).toBe(null);
      expect(result.current.filters.excludeHoneypots).toBe(false);
    });

    it('should update chain filter', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useFilters(), { wrapper });
      
      act(() => {
        result.current.setChain('ETH');
      });
      
      expect(result.current.filters.chain).toBe('ETH');
    });

    it('should update volume filter', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useFilters(), { wrapper });
      
      act(() => {
        result.current.setMinVolume(10000);
      });
      
      expect(result.current.filters.minVolume).toBe(10000);
    });

    it('should update multiple filters at once', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useFilters(), { wrapper });
      
      act(() => {
        result.current.updateAllFilters({
          chain: 'SOL',
          minVolume: 50000,
          excludeHoneypots: true,
        });
      });
      
      expect(result.current.filters.chain).toBe('SOL');
      expect(result.current.filters.minVolume).toBe(50000);
      expect(result.current.filters.excludeHoneypots).toBe(true);
    });

    it('should reset all filters', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);
      
      const { result } = renderHook(() => useFilters(), { wrapper });
      
      // Set some filters first
      act(() => {
        result.current.updateAllFilters({
          chain: 'ETH',
          minVolume: 10000,
          excludeHoneypots: true,
        });
      });
      
      // Reset filters
      act(() => {
        result.current.resetAllFilters();
      });
      
      expect(result.current.filters.chain).toBe(null);
      expect(result.current.filters.minVolume).toBe(null);
      expect(result.current.filters.excludeHoneypots).toBe(false);
    });
  });
});
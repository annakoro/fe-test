// Selectors Tests

import {
  selectTrendingTokensState,
  selectNewTokensState,
  selectFiltersState,
  selectTrendingTokens,
  selectNewTokens,
  selectTrendingTokensArray,
  selectNewTokensArray,
  selectSortedTrendingTokens,
  selectSortedNewTokens,
  selectFilteredTrendingTokens,
  selectFilteredNewTokens,
  selectTrendingTokensLoading,
  selectNewTokensLoading,
  selectIsAnyTableLoading,
  selectAnyTableError,
} from '../selectors';
import { RootState } from '../index';
import { TokenData } from '../../types';

describe('selectors', () => {
  const mockToken1: TokenData = {
    id: 'token1',
    tokenName: 'Token One',
    tokenSymbol: 'TOK1',
    tokenAddress: 'address1',
    pairAddress: 'pair1',
    chain: 'ETH',
    exchange: 'uniswap',
    priceUsd: 1.0,
    volumeUsd: 100000,
    mcap: 1000000,
    priceChangePcs: { '5m': 0, '1h': 0, '6h': 0, '24h': 0 },
    transactions: { buys: 10, sells: 5 },
    audit: { mintable: false, freezable: false, honeypot: false, contractVerified: true },
    tokenCreatedTimestamp: new Date('2024-01-01'),
    liquidity: { current: 500000, changePc: 0 },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed',
  };

  const mockToken2: TokenData = {
    id: 'token2',
    tokenName: 'Token Two',
    tokenSymbol: 'TOK2',
    tokenAddress: 'address2',
    pairAddress: 'pair2',
    chain: 'SOL',
    exchange: 'raydium',
    priceUsd: 2.0,
    volumeUsd: 200000,
    mcap: 2000000,
    priceChangePcs: { '5m': 0, '1h': 0, '6h': 0, '24h': 0 },
    transactions: { buys: 20, sells: 10 },
    audit: { mintable: false, freezable: false, honeypot: true, contractVerified: false },
    tokenCreatedTimestamp: new Date('2024-01-02'),
    liquidity: { current: 1000000, changePc: 0 },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed',
  };

  const mockState: RootState = {
    trendingTokens: {
      tokens: {
        token1: mockToken1,
        token2: mockToken2,
      },
      sortConfig: { column: 'volumeUsd', direction: 'desc' },
      loading: false,
      error: null,
      hasMore: true,
      page: 0,
      lastUpdated: new Date(),
    },
    newTokens: {
      tokens: {
        token1: mockToken1,
        token2: mockToken2,
      },
      sortConfig: { column: 'tokenCreatedTimestamp', direction: 'desc' },
      loading: true,
      error: 'Test error',
      hasMore: false,
      page: 1,
      lastUpdated: new Date(),
    },
    filters: {
      chain: null,
      minVolume: null,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: false,
    },
  };

  describe('basic selectors', () => {
    it('should select trending tokens state', () => {
      const result = selectTrendingTokensState(mockState);
      expect(result).toBe(mockState.trendingTokens);
    });

    it('should select new tokens state', () => {
      const result = selectNewTokensState(mockState);
      expect(result).toBe(mockState.newTokens);
    });

    it('should select filters state', () => {
      const result = selectFiltersState(mockState);
      expect(result).toBe(mockState.filters);
    });

    it('should select trending tokens object', () => {
      const result = selectTrendingTokens(mockState);
      expect(result).toBe(mockState.trendingTokens.tokens);
    });

    it('should select new tokens object', () => {
      const result = selectNewTokens(mockState);
      expect(result).toBe(mockState.newTokens.tokens);
    });
  });

  describe('array selectors', () => {
    it('should convert trending tokens to array', () => {
      const result = selectTrendingTokensArray(mockState);
      expect(result).toHaveLength(2);
      expect(result).toContain(mockToken1);
      expect(result).toContain(mockToken2);
    });

    it('should convert new tokens to array', () => {
      const result = selectNewTokensArray(mockState);
      expect(result).toHaveLength(2);
      expect(result).toContain(mockToken1);
      expect(result).toContain(mockToken2);
    });
  });

  describe('sorted selectors', () => {
    it('should sort trending tokens by volume descending', () => {
      const result = selectSortedTrendingTokens(mockState);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockToken2); // Higher volume
      expect(result[1]).toBe(mockToken1); // Lower volume
    });

    it('should sort new tokens by creation timestamp descending', () => {
      const result = selectSortedNewTokens(mockState);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockToken2); // Newer token
      expect(result[1]).toBe(mockToken1); // Older token
    });

    it('should handle ascending sort direction', () => {
      const stateWithAscSort = {
        ...mockState,
        trendingTokens: {
          ...mockState.trendingTokens,
          sortConfig: { column: 'volumeUsd', direction: 'asc' as const },
        },
      };
      
      const result = selectSortedTrendingTokens(stateWithAscSort);
      expect(result[0]).toBe(mockToken1); // Lower volume first
      expect(result[1]).toBe(mockToken2); // Higher volume second
    });

    it('should handle string sorting', () => {
      const stateWithNameSort = {
        ...mockState,
        trendingTokens: {
          ...mockState.trendingTokens,
          sortConfig: { column: 'tokenName', direction: 'asc' as const },
        },
      };
      
      const result = selectSortedTrendingTokens(stateWithNameSort);
      expect(result[0]).toBe(mockToken1); // "Token One" comes before "Token Two"
      expect(result[1]).toBe(mockToken2);
    });
  });

  describe('filtered selectors', () => {
    it('should apply chain filter', () => {
      const stateWithChainFilter = {
        ...mockState,
        filters: {
          ...mockState.filters,
          chain: 'ETH' as const,
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithChainFilter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockToken1);
    });

    it('should apply volume filter', () => {
      const stateWithVolumeFilter = {
        ...mockState,
        filters: {
          ...mockState.filters,
          minVolume: 150000,
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithVolumeFilter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockToken2);
    });

    it('should apply market cap filter', () => {
      const stateWithMcapFilter = {
        ...mockState,
        filters: {
          ...mockState.filters,
          minMarketCap: 1500000,
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithMcapFilter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockToken2);
    });

    it('should apply honeypot exclusion filter', () => {
      const stateWithHoneypotFilter = {
        ...mockState,
        filters: {
          ...mockState.filters,
          excludeHoneypots: true,
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithHoneypotFilter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockToken1);
    });

    it('should apply age filter', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const recentToken = { ...mockToken1, tokenCreatedTimestamp: oneHourAgo };
      const oldToken = { ...mockToken2, tokenCreatedTimestamp: twoDaysAgo };
      
      const stateWithAgeFilter = {
        ...mockState,
        trendingTokens: {
          ...mockState.trendingTokens,
          tokens: {
            token1: recentToken,
            token2: oldToken,
          },
        },
        filters: {
          ...mockState.filters,
          maxAge: 12, // 12 hours
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithAgeFilter);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('token1');
    });

    it('should apply multiple filters', () => {
      const stateWithMultipleFilters = {
        ...mockState,
        filters: {
          ...mockState.filters,
          chain: 'SOL' as const,
          excludeHoneypots: false, // Allow honeypots
          minVolume: 150000,
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithMultipleFilters);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockToken2);
    });

    it('should return empty array when no tokens match filters', () => {
      const stateWithStrictFilters = {
        ...mockState,
        filters: {
          ...mockState.filters,
          chain: 'BASE' as const, // No tokens on BASE
        },
      };
      
      const result = selectFilteredTrendingTokens(stateWithStrictFilters);
      expect(result).toHaveLength(0);
    });
  });

  describe('loading and error selectors', () => {
    it('should select trending tokens loading state', () => {
      const result = selectTrendingTokensLoading(mockState);
      expect(result).toBe(false);
    });

    it('should select new tokens loading state', () => {
      const result = selectNewTokensLoading(mockState);
      expect(result).toBe(true);
    });

    it('should detect if any table is loading', () => {
      const result = selectIsAnyTableLoading(mockState);
      expect(result).toBe(true);
    });

    it('should return false when no tables are loading', () => {
      const stateWithNoLoading = {
        ...mockState,
        newTokens: {
          ...mockState.newTokens,
          loading: false,
        },
      };
      
      const result = selectIsAnyTableLoading(stateWithNoLoading);
      expect(result).toBe(false);
    });

    it('should select any table error', () => {
      const result = selectAnyTableError(mockState);
      expect(result).toBe('Test error');
    });

    it('should return null when no errors exist', () => {
      const stateWithNoErrors = {
        ...mockState,
        newTokens: {
          ...mockState.newTokens,
          error: null,
        },
      };
      
      const result = selectAnyTableError(stateWithNoErrors);
      expect(result).toBe(null);
    });
  });
});
// Trending Tokens Slice Tests

import { trendingTokensSlice, updateTokens, updateTokenPrice, updateTokenAudit, removeToken, setSortConfig, setLoading, setError, setPage, resetState, batchUpdate } from '../slices/trendingTokensSlice';
import { TokensState } from '../types';
import { TokenData } from '../../types';

describe('trendingTokensSlice', () => {
  const initialState: TokensState = {
    tokens: {},
    sortConfig: {
      column: 'volumeUsd',
      direction: 'desc',
    },
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
    lastUpdated: null,
  };

  const mockToken: TokenData = {
    id: 'test-pair-address',
    tokenName: 'Test Token',
    tokenSymbol: 'TEST',
    tokenAddress: 'test-token-address',
    pairAddress: 'test-pair-address',
    chain: 'ETH',
    exchange: 'uniswap',
    priceUsd: 1.5,
    volumeUsd: 100000,
    mcap: 1500000,
    priceChangePcs: {
      '5m': 2.5,
      '1h': 5.0,
      '6h': -1.2,
      '24h': 10.5,
    },
    transactions: {
      buys: 50,
      sells: 30,
    },
    audit: {
      mintable: false,
      freezable: false,
      honeypot: false,
      contractVerified: true,
    },
    tokenCreatedTimestamp: new Date('2024-01-01'),
    liquidity: {
      current: 500000,
      changePc: 5.5,
    },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed',
  };

  it('should return the initial state', () => {
    expect(trendingTokensSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('updateTokens', () => {
    it('should add new tokens to empty state', () => {
      const action = updateTokens({ tokens: [mockToken] });
      const result = trendingTokensSlice.reducer(initialState, action);
      
      expect(result.tokens[mockToken.id]).toEqual(mockToken);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should merge tokens with existing ones', () => {
      const existingState = {
        ...initialState,
        tokens: { [mockToken.id]: mockToken },
      };
      
      const updatedToken = { ...mockToken, priceUsd: 2.0 };
      const action = updateTokens({ tokens: [updatedToken] });
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id].priceUsd).toBe(2.0);
      expect(result.tokens[mockToken.id].tokenName).toBe(mockToken.tokenName);
    });

    it('should replace tokens when replace flag is true', () => {
      const existingState = {
        ...initialState,
        tokens: { 
          [mockToken.id]: mockToken,
          'other-token': { ...mockToken, id: 'other-token' },
        },
      };
      
      const newToken = { ...mockToken, id: 'new-token', priceUsd: 3.0 };
      const action = updateTokens({ tokens: [newToken], replace: true });
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(Object.keys(result.tokens)).toHaveLength(1);
      expect(result.tokens['new-token']).toBeDefined();
      expect(result.tokens[mockToken.id]).toBeUndefined();
    });

    it('should preserve existing price and mcap when replacing', () => {
      const existingState = {
        ...initialState,
        tokens: { [mockToken.id]: { ...mockToken, priceUsd: 5.0, mcap: 5000000 } },
      };
      
      const replacementToken = { ...mockToken, priceUsd: 1.0, mcap: 1000000 };
      const action = updateTokens({ tokens: [replacementToken], replace: true });
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id].priceUsd).toBe(5.0);
      expect(result.tokens[mockToken.id].mcap).toBe(5000000);
    });
  });

  describe('updateTokenPrice', () => {
    it('should update token price and mcap', () => {
      const existingState = {
        ...initialState,
        tokens: { [mockToken.id]: mockToken },
      };
      
      const timestamp = new Date();
      const action = updateTokenPrice({
        tokenId: mockToken.id,
        priceUsd: 2.5,
        mcap: 2500000,
        timestamp,
      });
      
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id].priceUsd).toBe(2.5);
      expect(result.tokens[mockToken.id].mcap).toBe(2500000);
      expect(result.tokens[mockToken.id].lastUpdated).toBe(timestamp);
    });

    it('should not update non-existent token', () => {
      const action = updateTokenPrice({
        tokenId: 'non-existent',
        priceUsd: 2.5,
        mcap: 2500000,
        timestamp: new Date(),
      });
      
      const result = trendingTokensSlice.reducer(initialState, action);
      expect(result.tokens['non-existent']).toBeUndefined();
    });
  });

  describe('updateTokenAudit', () => {
    it('should update token audit information', () => {
      const existingState = {
        ...initialState,
        tokens: { [mockToken.id]: mockToken },
      };
      
      const timestamp = new Date();
      const auditUpdate = { honeypot: true, contractVerified: false };
      const action = updateTokenAudit({
        tokenId: mockToken.id,
        audit: auditUpdate,
        timestamp,
      });
      
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id].audit.honeypot).toBe(true);
      expect(result.tokens[mockToken.id].audit.contractVerified).toBe(false);
      expect(result.tokens[mockToken.id].audit.mintable).toBe(mockToken.audit.mintable);
      expect(result.tokens[mockToken.id].lastUpdated).toBe(timestamp);
    });
  });

  describe('removeToken', () => {
    it('should remove token from state', () => {
      const existingState = {
        ...initialState,
        tokens: { [mockToken.id]: mockToken },
      };
      
      const action = removeToken(mockToken.id);
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id]).toBeUndefined();
    });
  });

  describe('setSortConfig', () => {
    it('should update sort configuration', () => {
      const action = setSortConfig({ column: 'priceUsd', direction: 'asc' });
      const result = trendingTokensSlice.reducer(initialState, action);
      
      expect(result.sortConfig.column).toBe('priceUsd');
      expect(result.sortConfig.direction).toBe('asc');
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const action = setLoading({ loading: true });
      const result = trendingTokensSlice.reducer(initialState, action);
      
      expect(result.loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error and stop loading', () => {
      const loadingState = { ...initialState, loading: true };
      const action = setError({ error: 'Test error' });
      const result = trendingTokensSlice.reducer(loadingState, action);
      
      expect(result.error).toBe('Test error');
      expect(result.loading).toBe(false);
    });

    it('should clear error', () => {
      const errorState = { ...initialState, error: 'Previous error' };
      const action = setError({ error: null });
      const result = trendingTokensSlice.reducer(errorState, action);
      
      expect(result.error).toBe(null);
    });
  });

  describe('setPage', () => {
    it('should update page and hasMore', () => {
      const action = setPage({ page: 2, hasMore: false });
      const result = trendingTokensSlice.reducer(initialState, action);
      
      expect(result.page).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        ...initialState,
        tokens: { [mockToken.id]: mockToken },
        loading: true,
        error: 'Some error',
        page: 5,
      };
      
      const result = trendingTokensSlice.reducer(modifiedState, resetState());
      expect(result).toEqual(initialState);
    });
  });

  describe('batchUpdate', () => {
    it('should apply multiple price and audit updates', () => {
      const token2 = { ...mockToken, id: 'token2' };
      const existingState = {
        ...initialState,
        tokens: { 
          [mockToken.id]: mockToken,
          [token2.id]: token2,
        },
      };
      
      const timestamp = new Date();
      const action = batchUpdate({
        priceUpdates: [
          { tokenId: mockToken.id, priceUsd: 3.0, mcap: 3000000, timestamp },
          { tokenId: token2.id, priceUsd: 4.0, mcap: 4000000, timestamp },
        ],
        auditUpdates: [
          { tokenId: mockToken.id, audit: { honeypot: true }, timestamp },
        ],
      });
      
      const result = trendingTokensSlice.reducer(existingState, action);
      
      expect(result.tokens[mockToken.id].priceUsd).toBe(3.0);
      expect(result.tokens[mockToken.id].mcap).toBe(3000000);
      expect(result.tokens[mockToken.id].audit.honeypot).toBe(true);
      expect(result.tokens[token2.id].priceUsd).toBe(4.0);
      expect(result.tokens[token2.id].mcap).toBe(4000000);
    });

    it('should handle empty batch updates', () => {
      const action = batchUpdate({});
      const result = trendingTokensSlice.reducer(initialState, action);
      
      expect(result).toEqual(initialState);
    });
  });
});
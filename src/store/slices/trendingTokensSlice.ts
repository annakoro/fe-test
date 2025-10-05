// Trending Tokens Redux Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TokensState, UpdateTokensPayload, UpdateTokenPricePayload, UpdateTokenAuditPayload, SetSortConfigPayload, SetLoadingPayload, SetErrorPayload, SetPagePayload } from '../types';

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

export const trendingTokensSlice = createSlice({
  name: 'trendingTokens',
  initialState,
  reducers: {
    updateTokens: (state, action: PayloadAction<UpdateTokensPayload>) => {
      const { tokens, replace = false } = action.payload;
      
      if (replace) {
        // Replace entire dataset while preserving existing price/mcap data
        const newTokens: Record<string, any> = {};
        tokens.forEach(token => {
          const existingToken = state.tokens[token.id];
          newTokens[token.id] = {
            ...token,
            // Preserve existing price and mcap if available
            ...(existingToken && {
              priceUsd: existingToken.priceUsd,
              mcap: existingToken.mcap,
              lastUpdated: existingToken.lastUpdated,
            }),
          };
        });
        state.tokens = newTokens;
      } else {
        // Merge new tokens with existing ones
        tokens.forEach(token => {
          state.tokens[token.id] = {
            ...state.tokens[token.id],
            ...token,
          };
        });
      }
      
      state.lastUpdated = new Date();
    },

    updateTokenPrice: (state, action: PayloadAction<UpdateTokenPricePayload>) => {
      const { tokenId, priceUsd, mcap, timestamp } = action.payload;
      
      if (state.tokens[tokenId]) {
        state.tokens[tokenId].priceUsd = priceUsd;
        state.tokens[tokenId].mcap = mcap;
        state.tokens[tokenId].lastUpdated = timestamp;
      }
    },

    updateTokenAudit: (state, action: PayloadAction<UpdateTokenAuditPayload>) => {
      const { tokenId, audit, timestamp } = action.payload;
      
      if (state.tokens[tokenId]) {
        state.tokens[tokenId].audit = {
          ...state.tokens[tokenId].audit,
          ...audit,
        };
        state.tokens[tokenId].lastUpdated = timestamp;
      }
    },

    removeToken: (state, action: PayloadAction<string>) => {
      delete state.tokens[action.payload];
    },

    setSortConfig: (state, action: PayloadAction<SetSortConfigPayload>) => {
      state.sortConfig = action.payload;
    },

    setLoading: (state, action: PayloadAction<SetLoadingPayload>) => {
      state.loading = action.payload.loading;
    },

    setError: (state, action: PayloadAction<SetErrorPayload>) => {
      state.error = action.payload.error;
      if (action.payload.error) {
        state.loading = false;
      }
    },

    setPage: (state, action: PayloadAction<SetPagePayload>) => {
      state.page = action.payload.page;
      state.hasMore = action.payload.hasMore;
    },

    resetState: () => initialState,

    // Batch update action for performance optimization
    batchUpdate: (state, action: PayloadAction<{
      priceUpdates?: UpdateTokenPricePayload[];
      auditUpdates?: UpdateTokenAuditPayload[];
    }>) => {
      const { priceUpdates = [], auditUpdates = [] } = action.payload;
      
      // Apply price updates
      priceUpdates.forEach(({ tokenId, priceUsd, mcap, timestamp }) => {
        if (state.tokens[tokenId]) {
          state.tokens[tokenId].priceUsd = priceUsd;
          state.tokens[tokenId].mcap = mcap;
          state.tokens[tokenId].lastUpdated = timestamp;
        }
      });

      // Apply audit updates
      auditUpdates.forEach(({ tokenId, audit, timestamp }) => {
        if (state.tokens[tokenId]) {
          state.tokens[tokenId].audit = {
            ...state.tokens[tokenId].audit,
            ...audit,
          };
          state.tokens[tokenId].lastUpdated = timestamp;
        }
      });
    },

    // Memory cleanup action to remove old tokens
    cleanupOldTokens: (state, action: PayloadAction<{ maxAge: number }>) => {
      const { maxAge } = action.payload;
      const now = new Date();
      const tokensToRemove: string[] = [];
      
      Object.entries(state.tokens).forEach(([tokenId, token]) => {
        if (token.lastUpdated) {
          const age = now.getTime() - token.lastUpdated.getTime();
          if (age > maxAge) {
            tokensToRemove.push(tokenId);
          }
        }
      });
      
      tokensToRemove.forEach(tokenId => {
        delete state.tokens[tokenId];
      });
      
      console.log(`Cleaned up ${tokensToRemove.length} old trending tokens`);
    },
  },
});

export const {
  updateTokens,
  updateTokenPrice,
  updateTokenAudit,
  removeToken,
  setSortConfig,
  setLoading,
  setError,
  setPage,
  resetState,
  batchUpdate,
  cleanupOldTokens,
} = trendingTokensSlice.actions;
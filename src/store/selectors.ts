// Redux Selectors

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';
import { TokenData } from '../types';
import { sortTokens, sortNewTokens } from '../utils/sortingUtils';

// Basic selectors
export const selectTrendingTokensState = (state: RootState) => state.trendingTokens;
export const selectNewTokensState = (state: RootState) => state.newTokens;
export const selectFiltersState = (state: RootState) => state.filters;

// Trending tokens selectors
export const selectTrendingTokens = (state: RootState) => state.trendingTokens.tokens;
export const selectTrendingTokensArray = createSelector(
  [selectTrendingTokens],
  (tokens) => Object.values(tokens)
);

export const selectSortedTrendingTokens = createSelector(
  [selectTrendingTokensArray, (state: RootState) => state.trendingTokens.sortConfig],
  (tokens, sortConfig) => {
    return sortTokens(tokens, sortConfig);
  }
);

// New tokens selectors
export const selectNewTokens = (state: RootState) => state.newTokens.tokens;
export const selectNewTokensArray = createSelector(
  [selectNewTokens],
  (tokens) => Object.values(tokens)
);

export const selectSortedNewTokens = createSelector(
  [selectNewTokensArray, (state: RootState) => state.newTokens.sortConfig],
  (tokens, sortConfig) => {
    return sortNewTokens(tokens, sortConfig);
  }
);

// Filtered selectors
export const selectFilteredTrendingTokens = createSelector(
  [selectSortedTrendingTokens, selectFiltersState],
  (tokens, filters) => applyFilters(tokens, filters)
);

export const selectFilteredNewTokens = createSelector(
  [selectSortedNewTokens, selectFiltersState],
  (tokens, filters) => applyFilters(tokens, filters)
);

// Loading and error selectors
export const selectTrendingTokensLoading = (state: RootState) => state.trendingTokens.loading;
export const selectNewTokensLoading = (state: RootState) => state.newTokens.loading;
export const selectTrendingTokensError = (state: RootState) => state.trendingTokens.error;
export const selectNewTokensError = (state: RootState) => state.newTokens.error;

// Pagination selectors
export const selectTrendingTokensPage = (state: RootState) => state.trendingTokens.page;
export const selectNewTokensPage = (state: RootState) => state.newTokens.page;
export const selectTrendingTokensHasMore = (state: RootState) => state.trendingTokens.hasMore;
export const selectNewTokensHasMore = (state: RootState) => state.newTokens.hasMore;

// Combined selectors
export const selectIsAnyTableLoading = createSelector(
  [selectTrendingTokensLoading, selectNewTokensLoading],
  (trendingLoading, newLoading) => trendingLoading || newLoading
);

export const selectAnyTableError = createSelector(
  [selectTrendingTokensError, selectNewTokensError],
  (trendingError, newError) => trendingError || newError
);

// Utility functions (kept for potential future use)
// function getNestedValue(obj: any, path: string): any {
//   return path.split('.').reduce((current, key) => current?.[key], obj);
// }

function applyFilters(tokens: TokenData[], filters: any): TokenData[] {
  return tokens.filter(token => {
    // Chain filter
    if (filters.chain && token.chain !== filters.chain) {
      return false;
    }
    
    // Volume filter
    if (filters.minVolume && token.volumeUsd < filters.minVolume) {
      return false;
    }
    
    // Market cap filter
    if (filters.minMarketCap && token.mcap < filters.minMarketCap) {
      return false;
    }
    
    // Age filter (in hours)
    if (filters.maxAge) {
      const tokenAgeHours = (Date.now() - new Date(token.tokenCreatedTimestamp).getTime()) / (1000 * 60 * 60);
      if (tokenAgeHours > filters.maxAge) {
        return false;
      }
    }
    
    // Honeypot filter
    if (filters.excludeHoneypots && token.audit.honeypot) {
      return false;
    }
    
    return true;
  });
}

// Memoized token lookup selectors
export const selectTrendingTokenById = createSelector(
  [selectTrendingTokens, (_: RootState, tokenId: string) => tokenId],
  (tokens, tokenId) => tokens[tokenId]
);

export const selectNewTokenById = createSelector(
  [selectNewTokens, (_: RootState, tokenId: string) => tokenId],
  (tokens, tokenId) => tokens[tokenId]
);
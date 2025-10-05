import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from './index';
import {
  selectFilteredTrendingTokens,
  selectFilteredNewTokens,
  selectTrendingTokensState,
  selectNewTokensState,
  selectFiltersState,
  selectTrendingTokensLoading,
  selectNewTokensLoading,
  selectTrendingTokensError,
  selectNewTokensError,
  selectIsAnyTableLoading,
  selectAnyTableError,
} from './selectors';
import { 
  updateTokens as updateTrendingTokens,
  setSortConfig as setTrendingSortConfig,
  setLoading as setTrendingLoading,
  setError as setTrendingError,
  setPage as setTrendingPage,
  resetState as resetTrendingState,
} from './slices/trendingTokensSlice';
import {
  updateTokens as updateNewTokens,
  setSortConfig as setNewTokensSortConfig,
  setLoading as setNewTokensLoading,
  setError as setNewTokensError,
  setPage as setNewTokensPage,
  resetState as resetNewTokensState,
} from './slices/newTokensSlice';
import {
  updateFilters,
  setChainFilter,
  setMinVolumeFilter,
  setMaxAgeFilter,
  setMinMarketCapFilter,
  setExcludeHoneypotsFilter,
  resetFilters,
} from './slices/filtersSlice';
import { TokenData, FilterState } from '../types';
import { SupportedChainName } from '../types/api';

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Trending tokens hooks
export const useTrendingTokens = () => {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector(selectFilteredTrendingTokens);
  const state = useAppSelector(selectTrendingTokensState);
  
  const updateTokens = useCallback((tokens: TokenData[], replace?: boolean) => {
    dispatch(updateTrendingTokens({ tokens, replace }));
  }, [dispatch]);
  
  const setSortConfig = useCallback((column: string, direction: 'asc' | 'desc') => {
    dispatch(setTrendingSortConfig({ column, direction }));
  }, [dispatch]);
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch(setTrendingLoading({ loading }));
  }, [dispatch]);
  
  const setError = useCallback((error: string | null) => {
    dispatch(setTrendingError({ error }));
  }, [dispatch]);
  
  const setPage = useCallback((page: number, hasMore: boolean) => {
    dispatch(setTrendingPage({ page, hasMore }));
  }, [dispatch]);
  
  const resetState = useCallback(() => {
    dispatch(resetTrendingState());
  }, [dispatch]);
  
  return {
    tokens,
    sortConfig: state.sortConfig,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    page: state.page,
    lastUpdated: state.lastUpdated,
    updateTokens,
    setSortConfig,
    setLoading,
    setError,
    setPage,
    resetState,
  };
};

// New tokens hooks
export const useNewTokens = () => {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector(selectFilteredNewTokens);
  const state = useAppSelector(selectNewTokensState);
  
  const updateTokens = useCallback((tokens: TokenData[], replace?: boolean) => {
    dispatch(updateNewTokens({ tokens, replace }));
  }, [dispatch]);
  
  const setSortConfig = useCallback((column: string, direction: 'asc' | 'desc') => {
    dispatch(setNewTokensSortConfig({ column, direction }));
  }, [dispatch]);
  
  const setLoading = useCallback((loading: boolean) => {
    dispatch(setNewTokensLoading({ loading }));
  }, [dispatch]);
  
  const setError = useCallback((error: string | null) => {
    dispatch(setNewTokensError({ error }));
  }, [dispatch]);
  
  const setPage = useCallback((page: number, hasMore: boolean) => {
    dispatch(setNewTokensPage({ page, hasMore }));
  }, [dispatch]);
  
  const resetState = useCallback(() => {
    dispatch(resetNewTokensState());
  }, [dispatch]);
  
  return {
    tokens,
    sortConfig: state.sortConfig,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    page: state.page,
    lastUpdated: state.lastUpdated,
    updateTokens,
    setSortConfig,
    setLoading,
    setError,
    setPage,
    resetState,
  };
};

// Filters hooks
export const useFilters = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFiltersState);
  
  const setChain = useCallback((chain: SupportedChainName | null) => {
    dispatch(setChainFilter(chain));
  }, [dispatch]);
  
  const setMinVolume = useCallback((minVolume: number | null) => {
    dispatch(setMinVolumeFilter(minVolume));
  }, [dispatch]);
  
  const setMaxAge = useCallback((maxAge: number | null) => {
    dispatch(setMaxAgeFilter(maxAge));
  }, [dispatch]);
  
  const setMinMarketCap = useCallback((minMarketCap: number | null) => {
    dispatch(setMinMarketCapFilter(minMarketCap));
  }, [dispatch]);
  
  const setExcludeHoneypots = useCallback((excludeHoneypots: boolean) => {
    dispatch(setExcludeHoneypotsFilter(excludeHoneypots));
  }, [dispatch]);
  
  const updateAllFilters = useCallback((newFilters: Partial<FilterState>) => {
    dispatch(updateFilters(newFilters));
  }, [dispatch]);
  
  const resetAllFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);
  
  return {
    filters,
    setChain,
    setMinVolume,
    setMaxAge,
    setMinMarketCap,
    setExcludeHoneypots,
    updateAllFilters,
    resetAllFilters,
  };
};

// Combined hooks for common use cases
export const useTableStates = () => {
  const trendingLoading = useAppSelector(selectTrendingTokensLoading);
  const newTokensLoading = useAppSelector(selectNewTokensLoading);
  const trendingError = useAppSelector(selectTrendingTokensError);
  const newTokensError = useAppSelector(selectNewTokensError);
  const isAnyLoading = useAppSelector(selectIsAnyTableLoading);
  const anyError = useAppSelector(selectAnyTableError);
  
  return {
    trendingLoading,
    newTokensLoading,
    trendingError,
    newTokensError,
    isAnyLoading,
    anyError,
  };
};


// Sorting Hook Tests

import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSorting } from '../useSorting';
import { trendingTokensSlice } from '../../store/slices/trendingTokensSlice';
import { newTokensSlice } from '../../store/slices/newTokensSlice';
import { filtersSlice } from '../../store/slices/filtersSlice';
import { SortConfig } from '../../types';

// Mock store setup
const createMockStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      trendingTokens: trendingTokensSlice.reducer,
      newTokens: newTokensSlice.reducer,
      filters: filtersSlice.reducer,
    },
    preloadedState: initialState,
  });
};

const renderHookWithProvider = (hook: any, store: any) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(hook, { wrapper });
};

describe('useSorting', () => {
  const mockSortConfig: SortConfig = {
    column: 'volumeUsd',
    direction: 'desc',
  };

  test('should return current sort config and handle sort function', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: mockSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: mockSortConfig 
      }),
      store
    );

    expect(result.current.sortConfig).toEqual(mockSortConfig);
    expect(typeof result.current.handleSort).toBe('function');
  });

  test('should dispatch trending tokens sort config when table type is trending', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: mockSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: mockSortConfig 
      }),
      store
    );

    act(() => {
      result.current.handleSort('priceUsd');
    });

    const state = store.getState();
    expect(state.trendingTokens.sortConfig.column).toBe('priceUsd');
    expect(state.trendingTokens.sortConfig.direction).toBe('desc'); // Default for price
  });

  test('should dispatch new tokens sort config when table type is new', () => {
    const newTokensSortConfig: SortConfig = {
      column: 'tokenCreatedTimestamp',
      direction: 'desc',
    };

    const store = createMockStore({
      newTokens: {
        tokens: {},
        sortConfig: newTokensSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'new', 
        currentSortConfig: newTokensSortConfig 
      }),
      store
    );

    act(() => {
      result.current.handleSort('volumeUsd');
    });

    const state = store.getState();
    expect(state.newTokens.sortConfig.column).toBe('volumeUsd');
    expect(state.newTokens.sortConfig.direction).toBe('desc'); // Default for volume
  });

  test('should toggle sort direction when clicking same column', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: { column: 'priceUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: { column: 'priceUsd', direction: 'desc' }
      }),
      store
    );

    act(() => {
      result.current.handleSort('priceUsd');
    });

    const state = store.getState();
    expect(state.trendingTokens.sortConfig.column).toBe('priceUsd');
    expect(state.trendingTokens.sortConfig.direction).toBe('asc'); // Toggled
  });

  test('should start with asc for text columns', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: { column: 'priceUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: { column: 'priceUsd', direction: 'desc' }
      }),
      store
    );

    act(() => {
      result.current.handleSort('tokenName');
    });

    const state = store.getState();
    expect(state.trendingTokens.sortConfig.column).toBe('tokenName');
    expect(state.trendingTokens.sortConfig.direction).toBe('asc'); // Default for text
  });

  test('should handle memoization correctly', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: mockSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    const { result, rerender } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: mockSortConfig 
      }),
      store
    );

    const firstHandleSort = result.current.handleSort;

    // Rerender with same props
    rerender();

    const secondHandleSort = result.current.handleSort;

    // Should be the same function reference due to memoization
    expect(firstHandleSort).toBe(secondHandleSort);
  });

  test('should handle different table types correctly', () => {
    const trendingSortConfig: SortConfig = {
      column: 'volumeUsd',
      direction: 'desc',
    };

    const newTokensSortConfig: SortConfig = {
      column: 'tokenCreatedTimestamp',
      direction: 'desc',
    };

    const store = createMockStore({
      trendingTokens: {
        tokens: {},
        sortConfig: trendingSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
      newTokens: {
        tokens: {},
        sortConfig: newTokensSortConfig,
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
    });

    // Test trending table
    const { result: trendingResult } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'trending', 
        currentSortConfig: trendingSortConfig 
      }),
      store
    );

    expect(trendingResult.current.sortConfig).toEqual(trendingSortConfig);

    // Test new tokens table
    const { result: newResult } = renderHookWithProvider(
      () => useSorting({ 
        tableType: 'new', 
        currentSortConfig: newTokensSortConfig 
      }),
      store
    );

    expect(newResult.current.sortConfig).toEqual(newTokensSortConfig);
  });
});
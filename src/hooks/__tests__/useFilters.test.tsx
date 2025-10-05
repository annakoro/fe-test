import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useFilters } from '../useFilters';
import { filtersSlice } from '../../store/slices/filtersSlice';
import { FilterState } from '../../types/token';

// Mock store setup
const createMockStore = (initialState: Partial<FilterState> = {}) => {
  return configureStore({
    reducer: {
      filters: filtersSlice.reducer,
    },
    preloadedState: {
      filters: {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
        ...initialState,
      },
    },
  });
};

const renderHookWithStore = (initialState: Partial<FilterState> = {}) => {
  const store = createMockStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  
  return {
    ...renderHook(() => useFilters(), { wrapper }),
    store,
  };
};

describe('useFilters', () => {
  it('returns current filter state', () => {
    const initialState = {
      chain: 'ETH' as const,
      minVolume: 1000,
      excludeHoneypots: true,
    };
    
    const { result } = renderHookWithStore(initialState);
    
    expect(result.current.filters).toEqual({
      chain: 'ETH',
      minVolume: 1000,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: true,
    });
  });

  it('updates filters with validation', () => {
    const { result } = renderHookWithStore();
    
    act(() => {
      const updateResult = result.current.updateFilters({ chain: 'SOL', minVolume: 5000 });
      expect(updateResult.success).toBe(true);
      expect(updateResult.errors).toEqual({});
    });
    
    expect(result.current.filters.chain).toBe('SOL');
    expect(result.current.filters.minVolume).toBe(5000);
  });

  it('rejects invalid filter updates', () => {
    const { result } = renderHookWithStore();
    
    act(() => {
      const updateResult = result.current.updateFilters({ minVolume: -100 });
      expect(updateResult.success).toBe(false);
      expect(updateResult.errors.minVolume).toBe('Minimum volume cannot be negative');
    });
    
    // Filter should not be updated
    expect(result.current.filters.minVolume).toBe(null);
  });

  it('generates correct API parameters', () => {
    const initialState = {
      chain: 'BASE' as const,
      minVolume: 2000,
      maxAge: 48,
      excludeHoneypots: true,
    };
    
    const { result } = renderHookWithStore(initialState);
    
    const apiParams = result.current.getApiParams();
    expect(apiParams).toEqual({
      chain: 'BASE',
      minVolume: 2000,
      maxAge: 48,
      excludeHoneypots: true,
    });
  });

  it('generates correct WebSocket parameters', () => {
    const initialState = {
      chain: 'BSC' as const,
      minMarketCap: 100000,
    };
    
    const { result } = renderHookWithStore(initialState);
    
    const wsParams = result.current.getWebSocketParams();
    expect(wsParams).toEqual({
      chain: 'BSC',
      minVolume: null,
      maxAge: null,
      minMarketCap: 100000,
      excludeHoneypots: false,
    });
  });

  it('excludes invalid values from API parameters', () => {
    const initialState = {
      minVolume: -100, // Invalid
      maxAge: 0, // Invalid
      minMarketCap: 50000, // Valid
    };
    
    const { result } = renderHookWithStore(initialState);
    
    const apiParams = result.current.getApiParams();
    expect(apiParams).toEqual({
      minMarketCap: 50000,
    });
  });

  it('detects filter changes correctly', () => {
    const { result } = renderHookWithStore();
    
    const previousFilters: FilterState = {
      chain: 'ETH',
      minVolume: 1000,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: false,
    };
    
    // Current filters are different
    act(() => {
      result.current.updateFilters({ chain: 'SOL' });
    });
    
    expect(result.current.hasFiltersChanged(previousFilters)).toBe(true);
  });

  it('detects no filter changes when filters are the same', () => {
    const initialState = {
      chain: 'ETH' as const,
      minVolume: 1000,
    };
    
    const { result } = renderHookWithStore(initialState);
    
    const previousFilters: FilterState = {
      chain: 'ETH',
      minVolume: 1000,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: false,
    };
    
    expect(result.current.hasFiltersChanged(previousFilters)).toBe(false);
  });

  it('reports validation status correctly', () => {
    const { result } = renderHookWithStore();
    
    expect(result.current.isValid).toBe(true);
    expect(result.current.validationErrors).toEqual({});
    
    act(() => {
      result.current.updateFilters({ minVolume: -100 });
    });
    
    // Should still be valid because invalid update was rejected
    expect(result.current.isValid).toBe(true);
  });

  it('handles null values correctly', () => {
    const initialState = {
      chain: 'ETH' as const,
      minVolume: 1000,
    };
    
    const { result } = renderHookWithStore(initialState);
    
    act(() => {
      result.current.updateFilters({ chain: null, minVolume: null });
    });
    
    expect(result.current.filters.chain).toBe(null);
    expect(result.current.filters.minVolume).toBe(null);
    
    const apiParams = result.current.getApiParams();
    expect(apiParams).toEqual({});
  });

  it('handles boolean filters correctly', () => {
    const { result } = renderHookWithStore();
    
    act(() => {
      result.current.updateFilters({ excludeHoneypots: true });
    });
    
    expect(result.current.filters.excludeHoneypots).toBe(true);
    
    const apiParams = result.current.getApiParams();
    expect(apiParams.excludeHoneypots).toBe(true);
    
    act(() => {
      result.current.updateFilters({ excludeHoneypots: false });
    });
    
    const updatedApiParams = result.current.getApiParams();
    expect(updatedApiParams.excludeHoneypots).toBeUndefined();
  });
});
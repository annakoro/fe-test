// Filters Slice Tests

import { filtersSlice, setChainFilter, setMinVolumeFilter, setMaxAgeFilter, setMinMarketCapFilter, setExcludeHoneypotsFilter, updateFilters, resetFilters } from '../slices/filtersSlice';
import { FilterState } from '../../types';

describe('filtersSlice', () => {
  const initialState: FilterState = {
    chain: null,
    minVolume: null,
    maxAge: null,
    minMarketCap: null,
    excludeHoneypots: false,
  };

  it('should return the initial state', () => {
    expect(filtersSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setChainFilter', () => {
    it('should set chain filter', () => {
      const action = setChainFilter('ETH');
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.chain).toBe('ETH');
    });

    it('should clear chain filter', () => {
      const stateWithChain = { ...initialState, chain: 'ETH' as const };
      const action = setChainFilter(null);
      const result = filtersSlice.reducer(stateWithChain, action);
      
      expect(result.chain).toBe(null);
    });
  });

  describe('setMinVolumeFilter', () => {
    it('should set minimum volume filter', () => {
      const action = setMinVolumeFilter(10000);
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.minVolume).toBe(10000);
    });

    it('should clear minimum volume filter', () => {
      const stateWithVolume = { ...initialState, minVolume: 10000 };
      const action = setMinVolumeFilter(null);
      const result = filtersSlice.reducer(stateWithVolume, action);
      
      expect(result.minVolume).toBe(null);
    });
  });

  describe('setMaxAgeFilter', () => {
    it('should set maximum age filter', () => {
      const action = setMaxAgeFilter(24);
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.maxAge).toBe(24);
    });

    it('should clear maximum age filter', () => {
      const stateWithAge = { ...initialState, maxAge: 24 };
      const action = setMaxAgeFilter(null);
      const result = filtersSlice.reducer(stateWithAge, action);
      
      expect(result.maxAge).toBe(null);
    });
  });

  describe('setMinMarketCapFilter', () => {
    it('should set minimum market cap filter', () => {
      const action = setMinMarketCapFilter(1000000);
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.minMarketCap).toBe(1000000);
    });

    it('should clear minimum market cap filter', () => {
      const stateWithMcap = { ...initialState, minMarketCap: 1000000 };
      const action = setMinMarketCapFilter(null);
      const result = filtersSlice.reducer(stateWithMcap, action);
      
      expect(result.minMarketCap).toBe(null);
    });
  });

  describe('setExcludeHoneypotsFilter', () => {
    it('should set exclude honeypots filter to true', () => {
      const action = setExcludeHoneypotsFilter(true);
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.excludeHoneypots).toBe(true);
    });

    it('should set exclude honeypots filter to false', () => {
      const stateWithHoneypots = { ...initialState, excludeHoneypots: true };
      const action = setExcludeHoneypotsFilter(false);
      const result = filtersSlice.reducer(stateWithHoneypots, action);
      
      expect(result.excludeHoneypots).toBe(false);
    });
  });

  describe('updateFilters', () => {
    it('should update multiple filters at once', () => {
      const updates = {
        chain: 'SOL' as const,
        minVolume: 50000,
        excludeHoneypots: true,
      };
      
      const action = updateFilters(updates);
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result.chain).toBe('SOL');
      expect(result.minVolume).toBe(50000);
      expect(result.excludeHoneypots).toBe(true);
      expect(result.maxAge).toBe(null); // Should remain unchanged
      expect(result.minMarketCap).toBe(null); // Should remain unchanged
    });

    it('should partially update filters', () => {
      const existingState = {
        ...initialState,
        chain: 'ETH' as const,
        minVolume: 10000,
        excludeHoneypots: true,
      };
      
      const updates = {
        minVolume: 25000,
        maxAge: 12,
      };
      
      const action = updateFilters(updates);
      const result = filtersSlice.reducer(existingState, action);
      
      expect(result.chain).toBe('ETH'); // Should remain unchanged
      expect(result.minVolume).toBe(25000); // Should be updated
      expect(result.maxAge).toBe(12); // Should be updated
      expect(result.excludeHoneypots).toBe(true); // Should remain unchanged
    });

    it('should handle empty updates', () => {
      const action = updateFilters({});
      const result = filtersSlice.reducer(initialState, action);
      
      expect(result).toEqual(initialState);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to initial state', () => {
      const modifiedState: FilterState = {
        chain: 'ETH',
        minVolume: 10000,
        maxAge: 24,
        minMarketCap: 1000000,
        excludeHoneypots: true,
      };
      
      const result = filtersSlice.reducer(modifiedState, resetFilters());
      expect(result).toEqual(initialState);
    });
  });
});
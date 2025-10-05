import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateFilters } from '../store/slices/filtersSlice';
import { FilterState } from '../types/token';
import { filtersToApiParams, validateFilters } from '../utils/filterValidation';

/**
 * Custom hook for managing filter state and integration with API/WebSocket
 */
export const useFilters = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(state => state.filters);

  /**
   * Update filters with validation
   */
  const updateFiltersWithValidation = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const validation = validateFilters(updatedFilters);
    
    if (validation.isValid) {
      dispatch(updateFilters(newFilters));
      return { success: true, errors: {} };
    } else {
      console.warn('Filter validation failed:', validation.errors);
      return { success: false, errors: validation.errors };
    }
  }, [dispatch, filters]);

  /**
   * Get API parameters from current filters
   */
  const getApiParams = useCallback(() => {
    return filtersToApiParams(filters);
  }, [filters]);

  /**
   * Get WebSocket subscription parameters from current filters
   */
  const getWebSocketParams = useCallback(() => {
    const params = filtersToApiParams(filters);
    
    // Convert API params to WebSocket subscription format
    return {
      chain: params.chain || null,
      minVolume: params.minVolume || null,
      maxAge: params.maxAge || null,
      minMarketCap: params.minMarketCap || null,
      excludeHoneypots: params.excludeHoneypots || false,
    };
  }, [filters]);

  /**
   * Check if filters have changed and require re-subscription
   */
  const hasFiltersChanged = useCallback((previousFilters: FilterState) => {
    return (
      filters.chain !== previousFilters.chain ||
      filters.minVolume !== previousFilters.minVolume ||
      filters.maxAge !== previousFilters.maxAge ||
      filters.minMarketCap !== previousFilters.minMarketCap ||
      filters.excludeHoneypots !== previousFilters.excludeHoneypots
    );
  }, [filters]);

  return {
    filters,
    updateFilters: updateFiltersWithValidation,
    getApiParams,
    getWebSocketParams,
    hasFiltersChanged,
    isValid: validateFilters(filters).isValid,
    validationErrors: validateFilters(filters).errors,
  };
};
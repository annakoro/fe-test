// Sorting Hook for Table Components

import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setSortConfig as setTrendingSortConfig } from '../store/slices/trendingTokensSlice';
import { setSortConfig as setNewTokensSortConfig } from '../store/slices/newTokensSlice';
import { SortConfig } from '../types';
import { toggleSortDirection } from '../utils/sortingUtils';

export type TableType = 'trending' | 'new';

interface UseSortingProps {
  tableType: TableType;
  currentSortConfig: SortConfig;
}

interface UseSortingReturn {
  handleSort: (columnKey: string) => void;
  sortConfig: SortConfig;
}

export function useSorting({ tableType, currentSortConfig }: UseSortingProps): UseSortingReturn {
  const dispatch = useAppDispatch();

  const handleSort = useCallback((columnKey: string) => {
    // Calculate new sort configuration
    const newSortConfig = toggleSortDirection(currentSortConfig, columnKey);
    
    // Dispatch to appropriate slice based on table type
    if (tableType === 'trending') {
      dispatch(setTrendingSortConfig(newSortConfig));
    } else {
      dispatch(setNewTokensSortConfig(newSortConfig));
    }
  }, [dispatch, tableType, currentSortConfig]);

  return {
    handleSort,
    sortConfig: currentSortConfig,
  };
}

export default useSorting;
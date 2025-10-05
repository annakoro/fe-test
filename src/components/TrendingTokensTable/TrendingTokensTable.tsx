import React, { useEffect, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { VirtualizedTable } from '../VirtualizedTable';
import { AppState } from '../../store/types';
import { FilterState, TokenData } from '../../types';
import { 
  updateTokens, 
  setSortConfig, 
  setLoading, 
  setError, 
  setPage 
} from '../../store/slices/trendingTokensSlice';
import { apiService } from '../../services/apiService';
import { createWebSocketService } from '../../services/webSocketService';
import { transformScannerResult } from '../../utils/dataTransform';
import { sortTokens } from '../../utils/sortingUtils';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import { PerformanceMonitor } from '../../utils/performanceUtils';

const TableContainer = styled.div`
  flex: 1;
  margin-right: 8px;
  display: flex;
  flex-direction: column;
`;

const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
  padding: 0 16px;
`;

interface TrendingTokensTableProps {
  filters: FilterState;
  webSocketService: ReturnType<typeof createWebSocketService>;
}

export const TrendingTokensTable: React.FC<TrendingTokensTableProps> = memo(({
  filters,
  webSocketService
}) => {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const dispatch = useDispatch();
  const { tokens, sortConfig, loading, error, hasMore, page } = useSelector(
    (state: AppState) => state.trendingTokens
  );

  // Track visible range for subscription management
  const [visibleRange, setVisibleRange] = React.useState<{ startIndex: number; endIndex: number } | null>(null);

  // Convert tokens object to sorted array
  const sortedTokens = useMemo(() => {
    const tokenArray = Object.values(tokens);
    return sortTokens(tokenArray, sortConfig);
  }, [tokens, sortConfig]);

  // Initialize subscription manager for visible tokens
  const {
    subscriptionStats,
    getSubscriptionStatus,
    retryFailedSubscriptions
  } = useSubscriptionManager({
    webSocketService,
    tokens: sortedTokens,
    visibleRange: visibleRange || undefined,
    enabled: webSocketService.getConnectionStatus() === 'connected'
  });

  // Fetch initial data and subsequent pages
  const fetchTokens = useCallback(async (pageNum: number = 0, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        dispatch(setLoading({ loading: true }));
      }

      const params = {
        chain: filters.chain || undefined,
        minVolume: filters.minVolume || undefined,
        maxAge: filters.maxAge || undefined,
        minMarketCap: filters.minMarketCap || undefined,
        excludeHoneypots: filters.excludeHoneypots || undefined,
        page: pageNum,
        limit: 50,
        sortBy: 'volumeUsd', // Default sorting for trending tokens
        sortOrder: 'desc' as const
      };

      const response = await apiService.fetchScannerData(params);
      const transformedTokens = response.results
        .map(transformScannerResult)
        .filter((token): token is TokenData => token !== null);

      dispatch(updateTokens({ 
        tokens: transformedTokens, 
        replace: pageNum === 0 
      }));
      
      dispatch(setPage({ 
        page: pageNum, 
        hasMore: response.results.length === params.limit 
      }));
      
      dispatch(setError({ error: null }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending tokens';
      dispatch(setError({ error: errorMessage }));
    } finally {
      dispatch(setLoading({ loading: false }));
    }
  }, [dispatch, filters]);

  // Handle WebSocket subscriptions for trending tokens (scanner-filter and pair-stats)
  useEffect(() => {
    const subscribeToTrendingTokens = () => {
      // Subscribe to scanner-filter for trending tokens
      webSocketService.subscribe({
        type: 'subscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            tableType: 'trending',
            chain: filters.chain || undefined,
            minVolume: filters.minVolume || undefined,
            maxAge: filters.maxAge || undefined,
            minMarketCap: filters.minMarketCap || undefined,
            excludeHoneypots: filters.excludeHoneypots || undefined
          }
        }
      });

      // Subscribe to pair-stats for audit updates (for all tokens, not just visible ones)
      Object.keys(tokens).forEach(tokenId => {
        webSocketService.subscribe({
          type: 'subscribe',
          payload: {
            room: 'pair-stats',
            params: { pairAddress: tokenId }
          }
        });
      });
    };

    if (webSocketService.getConnectionStatus() === 'connected') {
      subscribeToTrendingTokens();
    }

    // Set up message handler for real-time updates
    const handleWebSocketMessage = () => {
      // Handle different message types
      // This will be processed by the WebSocket middleware
    };

    webSocketService.onMessage(handleWebSocketMessage);

    return () => {
      webSocketService.removeMessageCallback(handleWebSocketMessage);
    };
  }, [webSocketService, tokens, filters]);

  // Handle visible range changes for subscription management
  const handleVisibleRangeChange = useCallback((range: { startIndex: number; endIndex: number }) => {
    setVisibleRange(range);
  }, []);

  // Load initial data when component mounts or filters change
  useEffect(() => {
    fetchTokens(0, false);
  }, [fetchTokens]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    const newDirection = 
      sortConfig.column === column && sortConfig.direction === 'desc' 
        ? 'asc' 
        : 'desc';
    
    dispatch(setSortConfig({ column, direction: newDirection }));
  }, [dispatch, sortConfig]);

  // Handle load more for infinite scrolling
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTokens(page + 1, true);
    }
  }, [fetchTokens, loading, hasMore, page]);

  return (
    <TableContainer>
      <TableTitle>Trending Tokens</TableTitle>
      <VirtualizedTable
        tokens={sortedTokens}
        sortConfig={sortConfig}
        onSort={handleSort}
        onLoadMore={handleLoadMore}
        loading={loading}
        error={error}
        onVisibleRangeChange={handleVisibleRangeChange}
      />
    </TableContainer>
  );
});

// Set display name for debugging
TrendingTokensTable.displayName = 'TrendingTokensTable';

export default TrendingTokensTable;
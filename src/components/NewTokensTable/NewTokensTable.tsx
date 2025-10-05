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
} from '../../store/slices/newTokensSlice';
import { apiService } from '../../services/apiService';
import { createWebSocketService } from '../../services/webSocketService';
import { transformScannerResult } from '../../utils/dataTransform';
import { sortTokens } from '../../utils/sortingUtils';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import { PerformanceMonitor } from '../../utils/performanceUtils';

const TableContainer = styled.div`
  flex: 1;
  margin-left: 8px;
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

interface NewTokensTableProps {
  filters: FilterState;
  webSocketService: ReturnType<typeof createWebSocketService>;
}

export const NewTokensTable: React.FC<NewTokensTableProps> = memo(({
  filters,
  webSocketService
}) => {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const dispatch = useDispatch();
  const { tokens, sortConfig, loading, error, hasMore, page } = useSelector(
    (state: AppState) => state.newTokens
  );

  // Track visible range for subscription management
  const [visibleRange, setVisibleRange] = React.useState<{ startIndex: number; endIndex: number } | null>(null);

  // Helper function to get token value for comparison
  const getTokenValue = useCallback((token: TokenData, column: string): any => {
    switch (column) {
      case 'priceUsd':
        return token.priceUsd;
      case 'volumeUsd':
        return token.volumeUsd;
      case 'mcap':
        return token.mcap;
      case 'transactions.buys':
        return token.transactions.buys;
      case 'transactions.sells':
        return token.transactions.sells;
      case 'liquidity.current':
        return token.liquidity.current;
      case 'priceChangePcs.5m':
        return token.priceChangePcs['5m'];
      case 'priceChangePcs.1h':
        return token.priceChangePcs['1h'];
      case 'priceChangePcs.6h':
        return token.priceChangePcs['6h'];
      case 'priceChangePcs.24h':
        return token.priceChangePcs['24h'];
      default:
        return 0;
    }
  }, []);

  // Convert tokens object to sorted array
  // For new tokens, maintain age-based primary sorting but allow secondary sorting
  const sortedTokens = useMemo(() => {
    const tokenArray = Object.values(tokens);
    
    // If sorting by age (primary sort), use standard sorting
    if (sortConfig.column === 'tokenCreatedTimestamp') {
      return sortTokens(tokenArray, sortConfig);
    }
    
    // For secondary sorting, first sort by the selected column, then by age as tiebreaker
    const primarySorted = sortTokens(tokenArray, sortConfig);
    
    // Apply age-based tiebreaker for tokens with same values
    return primarySorted.sort((a, b) => {
      const aValue = getTokenValue(a, sortConfig.column);
      const bValue = getTokenValue(b, sortConfig.column);
      
      // If values are equal, sort by age (newest first)
      if (aValue === bValue) {
        return new Date(b.tokenCreatedTimestamp).getTime() - new Date(a.tokenCreatedTimestamp).getTime();
      }
      
      return 0; // Keep primary sort order
    });
  }, [tokens, sortConfig, getTokenValue]);

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
        sortBy: 'tokenCreatedTimestamp', // Default sorting for new tokens
        sortOrder: 'desc' as const // Newest first
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch new tokens';
      dispatch(setError({ error: errorMessage }));
    } finally {
      dispatch(setLoading({ loading: false }));
    }
  }, [dispatch, filters]);

  // Handle WebSocket subscriptions for new tokens (scanner-filter and pair-stats)
  useEffect(() => {
    const subscribeToNewTokens = () => {
      // Subscribe to scanner-filter for new tokens
      webSocketService.subscribe({
        type: 'subscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            tableType: 'new',
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
      subscribeToNewTokens();
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
      <TableTitle>New Tokens</TableTitle>
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
NewTokensTable.displayName = 'NewTokensTable';

export default NewTokensTable;
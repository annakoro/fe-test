import React, { useCallback, useMemo, useState, memo } from 'react';
import { List } from 'react-window';
import { useInfiniteLoader } from 'react-window-infinite-loader';
import styled from 'styled-components';
import { VirtualizedTableProps } from '../../types/components';
import { TokenRow } from '../TokenRow/TokenRow';
import { TableHeader, TABLE_COLUMNS } from '../TableHeader/TableHeader';
import { ErrorState } from '../ErrorState';
import { EmptyState } from '../EmptyState';
import { PerformanceMonitor } from '../../utils/performanceUtils';

const TableContainer = styled.div`
  height: 600px;
  width: 100%;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  font-size: 14px;
  color: #6c757d;
`;

const ListContainer = styled.div`
  height: calc(100% - 50px); // Account for header height
`;

// Row height for virtualization
const ROW_HEIGHT = 60;

interface RowRendererProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = memo(({
  tokens,
  sortConfig,
  onSort,
  onLoadMore,
  loading,
  error,
  onVisibleRangeChange
}) => {
  const performanceMonitor = PerformanceMonitor.getInstance();
  
  // Track visible range for subscription management
  const [visibleRange, setVisibleRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  
  // Memoize the token array to prevent unnecessary re-renders
  const tokenArray = useMemo(() => {
    const endTiming = performanceMonitor.startTiming('tokenArray_memoization');
    const result = tokens;
    endTiming();
    return result;
  }, [tokens, performanceMonitor]);
  
  // Calculate total item count (tokens + loading indicator if needed)
  const itemCount = tokenArray.length + (loading ? 1 : 0);
  
  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return index < tokenArray.length;
  }, [tokenArray.length]);

  // Load more items when needed
  const loadMoreItems = useCallback(async () => {
    if (!loading) {
      onLoadMore();
    }
  }, [loading, onLoadMore]);

  // Handle visible range changes for subscription management
  const handleRowsRendered = useCallback(({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
    const newVisibleRange = { startIndex, endIndex };
    setVisibleRange(newVisibleRange);
    
    // Notify parent component about visible range changes
    if (onVisibleRangeChange) {
      onVisibleRangeChange(newVisibleRange);
    }
  }, [onVisibleRangeChange]);

  // Use infinite loader hook
  const infiniteLoaderOnRowsRendered = useInfiniteLoader({
    isRowLoaded: isItemLoaded,
    rowCount: itemCount,
    loadMoreRows: async () => {
      await loadMoreItems();
    },
    threshold: 10
  });

  // Combine infinite loader and visible range handling
  const onRowsRendered = useCallback((visibleRows: { startIndex: number; stopIndex: number }) => {
    infiniteLoaderOnRowsRendered(visibleRows);
    handleRowsRendered({ startIndex: visibleRows.startIndex, endIndex: visibleRows.stopIndex });
  }, [infiniteLoaderOnRowsRendered, handleRowsRendered]);

  // Memoized row renderer for react-window
  const RowRenderer: React.FC<RowRendererProps> = useMemo(() => memo(({ index, style }) => {
    const endTiming = performanceMonitor.startTiming('RowRenderer');
    
    // If this is the loading row
    if (index >= tokenArray.length) {
      endTiming();
      return (
        <div style={style}>
          <LoadingContainer>
            Loading more tokens...
          </LoadingContainer>
        </div>
      );
    }

    const token = tokenArray[index];
    if (!token) {
      endTiming();
      return (
        <div style={style}>
          <LoadingContainer>
            Loading...
          </LoadingContainer>
        </div>
      );
    }

    const result = <TokenRow token={token} style={style} />;
    endTiming();
    return result;
  }), [tokenArray, performanceMonitor]);

  // Handle retry on error
  const handleRetry = () => {
    onLoadMore();
  };

  // Show error state
  if (error && tokenArray.length === 0) {
    return (
      <TableContainer>
        <ErrorState
          title="Failed to load token data"
          message={error}
          onRetry={handleRetry}
          variant="default"
          size="medium"
        />
      </TableContainer>
    );
  }

  // Show empty state
  if (!loading && tokenArray.length === 0) {
    return (
      <TableContainer>
        <TableHeader 
          columns={TABLE_COLUMNS}
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <EmptyState
          title="No tokens found"
          message="No tokens match your current filters. Try adjusting your filter criteria."
          variant="compact"
          size="medium"
          actions={[
            {
              label: 'Clear Filters',
              onClick: handleRetry,
              variant: 'secondary'
            }
          ]}
        />
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={sortConfig}
        onSort={onSort}
      />
      
      <ListContainer>
        <List
          defaultHeight={550} // Height minus header
          rowCount={itemCount}
          rowHeight={ROW_HEIGHT}
          onRowsRendered={onRowsRendered}
          overscanCount={5} // Render 5 extra items for smooth scrolling
          rowComponent={RowRenderer}
          rowProps={{}}
        />
      </ListContainer>
      
      {/* Show loading indicator at bottom if loading and we have tokens */}
      {loading && tokenArray.length > 0 && (
        <LoadingContainer>
          Loading more tokens...
        </LoadingContainer>
      )}
    </TableContainer>
  );
});

// Set display name for debugging
VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;
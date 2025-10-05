import React, { useMemo, memo } from 'react';
import { VirtualizedTableProps } from '../../types/components';
import { TokenRow } from '../TokenRow/TokenRow';
import { TableHeader, TABLE_COLUMNS } from '../TableHeader/TableHeader';
import { ErrorState } from '../ErrorState';
import { EmptyState } from '../EmptyState';

import '../../styles/table.css';



// Row height for virtualization
const ROW_HEIGHT = 60;

export const VirtualizedTable: React.FC<VirtualizedTableProps> = memo(({
  tokens,
  sortConfig,
  onSort,
  onLoadMore,
  loading,
  error,
  onVisibleRangeChange
}) => {
  // Memoize the token array to prevent unnecessary re-renders
  const tokenArray = useMemo(() => {
    return tokens;
  }, [tokens]);

  // Handle retry on error
  const handleRetry = () => {
    onLoadMore();
  };

  // Show error state
  if (error && tokenArray.length === 0) {
    return (
      <div className="crypto-table-container" role="table" aria-label="Token data table">
        <div className="crypto-table-scroll-wrapper">
          <div className="crypto-table-content">
            <ErrorState
              title="Failed to load token data"
              message={error}
              onRetry={handleRetry}
              variant="default"
              size="medium"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!loading && tokenArray.length === 0) {
    return (
      <div className="crypto-table-container" role="table" aria-label="Token data table">
        <div className="crypto-table-scroll-wrapper">
          <div className="crypto-table-content">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crypto-table-container" role="table" aria-label="Token data table">
      <div className="crypto-table-scroll-wrapper">
        <div className="crypto-table-content">
          <TableHeader 
            columns={TABLE_COLUMNS}
            sortConfig={sortConfig}
            onSort={onSort}
          />
          
          <div className="crypto-table-body" role="rowgroup" style={{ height: '400px', overflowY: 'auto' }}>
            {tokenArray.map((token, index) => (
              <TokenRow 
                key={token.id} 
                token={token} 
                style={{ height: `${ROW_HEIGHT}px` }}
              />
            ))}
            
            {/* Show loading indicator at bottom if loading */}
            {loading && (
              <div className="crypto-table-loading" role="status" aria-live="polite">
                <div className="crypto-table-loading-spinner" aria-hidden="true"></div>
                <span>Loading more tokens...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;
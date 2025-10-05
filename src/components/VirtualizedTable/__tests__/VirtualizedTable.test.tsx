import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualizedTable } from '../VirtualizedTable';
import { TokenData, SortConfig } from '../../../types/token';

// Mock react-window and react-window-infinite-loader
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, onItemsRendered }: any) => {
    // Simulate rendering first few items
    const items = [];
    const itemsToRender = Math.min(itemCount, 10);
    
    for (let i = 0; i < itemsToRender; i++) {
      items.push(
        <div key={i} data-testid={`virtual-row-${i}`}>
          {children({ index: i, style: { height: itemSize } })}
        </div>
      );
    }
    
    return <div data-testid="virtual-list">{items}</div>;
  }
}));

jest.mock('react-window-infinite-loader', () => {
  return ({ children, isItemLoaded, loadMoreItems }: any) => {
    const mockOnItemsRendered = jest.fn();
    const mockRef = { current: null };
    
    // Simulate calling loadMoreItems when needed
    if (!isItemLoaded(5)) {
      loadMoreItems();
    }
    
    return children({ onItemsRendered: mockOnItemsRendered, ref: mockRef });
  };
});

// Mock TokenRow component
jest.mock('../../../components/TokenRow/TokenRow', () => ({
  TokenRow: ({ token, style }: any) => (
    <div style={style} data-testid={`token-row-${token.id}`}>
      {token.tokenName} - {token.tokenSymbol}
    </div>
  )
}));

// Mock TableHeader component
jest.mock('../../../components/TableHeader/TableHeader', () => ({
  TableHeader: ({ onSort, sortConfig }: any) => (
    <div data-testid="table-header">
      <button onClick={() => onSort('priceUsd')}>Sort by Price</button>
      <span>Sort: {sortConfig.column} {sortConfig.direction}</span>
    </div>
  ),
  TABLE_COLUMNS: []
}));

const mockTokens: TokenData[] = [
  {
    id: 'token-1',
    tokenName: 'Token One',
    tokenSymbol: 'TOK1',
    tokenAddress: '0x123',
    pairAddress: '0x456',
    chain: 'ETH',
    exchange: 'Uniswap',
    priceUsd: 1.23,
    volumeUsd: 100000,
    mcap: 1000000,
    priceChangePcs: { "5m": 1.5, "1h": -0.5, "6h": 2.1, "24h": -1.2 },
    transactions: { buys: 10, sells: 5 },
    audit: { mintable: false, freezable: false, honeypot: false, contractVerified: true },
    tokenCreatedTimestamp: new Date(),
    liquidity: { current: 50000, changePc: 5.2 },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed'
  },
  {
    id: 'token-2',
    tokenName: 'Token Two',
    tokenSymbol: 'TOK2',
    tokenAddress: '0x789',
    pairAddress: '0xabc',
    chain: 'BSC',
    exchange: 'PancakeSwap',
    priceUsd: 0.45,
    volumeUsd: 75000,
    mcap: 500000,
    priceChangePcs: { "5m": -2.1, "1h": 3.2, "6h": -1.8, "24h": 4.5 },
    transactions: { buys: 8, sells: 12 },
    audit: { mintable: true, freezable: false, honeypot: false, contractVerified: true },
    tokenCreatedTimestamp: new Date(),
    liquidity: { current: 25000, changePc: -2.1 },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed'
  }
];

const defaultSortConfig: SortConfig = {
  column: 'volumeUsd',
  direction: 'desc'
};

const mockOnSort = jest.fn();
const mockOnLoadMore = jest.fn();

describe('VirtualizedTable', () => {
  beforeEach(() => {
    mockOnSort.mockClear();
    mockOnLoadMore.mockClear();
  });

  it('renders table with tokens correctly', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByTestId('table-header')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByTestId('token-row-token-1')).toBeInTheDocument();
    expect(screen.getByTestId('token-row-token-2')).toBeInTheDocument();
  });

  it('passes sort configuration to header correctly', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Sort: volumeUsd desc')).toBeInTheDocument();
  });

  it('handles sort events from header', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByText('Sort by Price'));
    expect(mockOnSort).toHaveBeenCalledWith('priceUsd');
  });

  it('shows loading state when loading is true', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    expect(screen.getAllByText('Loading more tokens...')).toHaveLength(2);
  });

  it('shows error state when error exists and no tokens', () => {
    render(
      <VirtualizedTable
        tokens={[]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error="Failed to fetch data"
      />
    );

    expect(screen.getByText('Failed to load token data')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles retry button click in error state', () => {
    render(
      <VirtualizedTable
        tokens={[]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error="Network error"
      />
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('shows empty state when no tokens and not loading', () => {
    render(
      <VirtualizedTable
        tokens={[]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('No tokens found matching your filters')).toBeInTheDocument();
    expect(screen.getByTestId('table-header')).toBeInTheDocument();
  });

  it('shows loading indicator at bottom when loading with existing tokens', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    // Should show both the tokens and the loading indicator
    expect(screen.getByTestId('token-row-token-1')).toBeInTheDocument();
    expect(screen.getAllByText('Loading more tokens...')).toHaveLength(2); // One in virtual list, one at bottom
  });

  it('calls loadMoreItems when infinite loader detects need for more data', async () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    // The mock infinite loader should call loadMoreItems
    await waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalled();
    });
  });

  it('renders loading row when index exceeds token array length', () => {
    render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    // The virtual list should render loading rows for indices beyond token array
    expect(screen.getAllByText('Loading more tokens...')).toHaveLength(2);
  });

  it('handles empty token array gracefully', () => {
    render(
      <VirtualizedTable
        tokens={[]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    expect(screen.getByText('Loading more tokens...')).toBeInTheDocument();
  });

  it('prevents multiple simultaneous load requests', () => {
    const { rerender } = render(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    // Clear previous calls
    mockOnLoadMore.mockClear();

    // Re-render with loading still true
    rerender(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={true}
        error={null}
      />
    );

    // Should not call loadMore again while already loading
    expect(mockOnLoadMore).not.toHaveBeenCalled();
  });

  it('updates when tokens prop changes', () => {
    const { rerender } = render(
      <VirtualizedTable
        tokens={[mockTokens[0]]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByTestId('token-row-token-1')).toBeInTheDocument();
    expect(screen.queryByTestId('token-row-token-2')).not.toBeInTheDocument();

    rerender(
      <VirtualizedTable
        tokens={mockTokens}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
        onLoadMore={mockOnLoadMore}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByTestId('token-row-token-1')).toBeInTheDocument();
    expect(screen.getByTestId('token-row-token-2')).toBeInTheDocument();
  });
});
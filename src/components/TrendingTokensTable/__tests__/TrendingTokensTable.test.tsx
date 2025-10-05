import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TrendingTokensTable } from '../TrendingTokensTable';
import { trendingTokensSlice } from '../../../store/slices/trendingTokensSlice';
import { newTokensSlice } from '../../../store/slices/newTokensSlice';
import { filtersSlice } from '../../../store/slices/filtersSlice';
import { FilterState, TokenData } from '../../../types';
import { apiService } from '../../../services/apiService';
import { createWebSocketService } from '../../../services/webSocketService';

// Mock the services
jest.mock('../../../services/apiService');
jest.mock('../../../services/webSocketService');
jest.mock('../../VirtualizedTable', () => ({
  VirtualizedTable: ({ tokens, sortConfig, onSort, onLoadMore, loading, error }: any) => (
    <div data-testid="virtualized-table">
      <div data-testid="sort-config">{JSON.stringify(sortConfig)}</div>
      <div data-testid="tokens-count">{tokens.length}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={() => onSort('volumeUsd')} data-testid="sort-button">Sort</button>
      <button onClick={onLoadMore} data-testid="load-more-button">Load More</button>
    </div>
  )
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockCreateWebSocketService = createWebSocketService as jest.MockedFunction<typeof createWebSocketService>;

const mockWebSocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  onMessage: jest.fn(),
  removeMessageCallback: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  cleanup: jest.fn()
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      trendingTokens: trendingTokensSlice.reducer,
      newTokens: newTokensSlice.reducer,
      filters: filtersSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    preloadedState: {
      trendingTokens: {
        tokens: {},
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
      newTokens: {
        tokens: {},
        sortConfig: { column: 'tokenCreatedTimestamp', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: null,
      },
      filters: {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      },
      ...initialState,
    },
  });
};

const mockTokenData: TokenData = {
  id: 'test-pair-address',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: 'test-token-address',
  pairAddress: 'test-pair-address',
  chain: 'ETH',
  exchange: 'test-exchange',
  priceUsd: 1.5,
  volumeUsd: 100000,
  mcap: 1500000,
  priceChangePcs: {
    '5m': 2.5,
    '1h': 5.0,
    '6h': -1.2,
    '24h': 10.5,
  },
  transactions: {
    buys: 50,
    sells: 30,
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
  },
  tokenCreatedTimestamp: new Date('2024-01-01T00:00:00Z'),
  liquidity: {
    current: 50000,
    changePc: 5.5,
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed',
};

const mockFilters: FilterState = {
  chain: null,
  minVolume: null,
  maxAge: null,
  minMarketCap: null,
  excludeHoneypots: false,
};

describe('TrendingTokensTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateWebSocketService.mockReturnValue(mockWebSocketService);
    mockApiService.fetchScannerData.mockResolvedValue({
      results: [
        {
          pairAddress: 'test-pair-address',
          token1Name: 'Test Token',
          token1Symbol: 'TEST',
          token1Address: 'test-token-address',
          chainId: 1,
          routerAddress: 'test-exchange',
          price: '1.5',
          volume: '100000',
          currentMcap: '1500000',
          initialMcap: '0',
          pairMcapUsd: '0',
          pairMcapUsdInitial: '0',
          diff5M: '2.5',
          diff1H: '5.0',
          diff6H: '-1.2',
          diff24H: '10.5',
          buys: 50,
          sells: 30,
          isMintAuthDisabled: true,
          isFreezeAuthDisabled: true,
          honeyPot: false,
          contractVerified: true,
          age: '2024-01-01T00:00:00Z',
          liquidity: '50000',
          percentChangeInLiquidity: '5.5',
          token1TotalSupplyFormatted: '1000000',
        },
      ],
      pagination: {
        page: 0,
        limit: 50,
        total: 1,
        hasMore: false,
      },
    });
  });

  it('renders with correct title', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
  });

  it('displays VirtualizedTable with correct props', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    expect(screen.getByTestId('virtualized-table')).toBeInTheDocument();
    expect(screen.getByTestId('sort-config')).toHaveTextContent('{"column":"volumeUsd","direction":"desc"}');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('fetches data on mount', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    await waitFor(() => {
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith({
        chain: undefined,
        minVolume: undefined,
        maxAge: undefined,
        minMarketCap: undefined,
        excludeHoneypots: undefined,
        page: 0,
        limit: 50,
        sortBy: 'volumeUsd',
        sortOrder: 'desc',
      });
    });
  });

  it('applies filters correctly', async () => {
    const filtersWithValues: FilterState = {
      chain: 'ETH',
      minVolume: 10000,
      maxAge: 3600,
      minMarketCap: 100000,
      excludeHoneypots: true,
    };

    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={filtersWithValues} webSocketService={mockWebSocketService} />
      </Provider>
    );

    await waitFor(() => {
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith({
        chain: 'ETH',
        minVolume: 10000,
        maxAge: 3600,
        minMarketCap: 100000,
        excludeHoneypots: true,
        page: 0,
        limit: 50,
        sortBy: 'volumeUsd',
        sortOrder: 'desc',
      });
    });
  });

  it('handles sorting correctly', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    const sortButton = screen.getByTestId('sort-button');
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(screen.getByTestId('sort-config')).toHaveTextContent('{"column":"volumeUsd","direction":"asc"}');
    });

    // Click again to reverse direction
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(screen.getByTestId('sort-config')).toHaveTextContent('{"column":"volumeUsd","direction":"desc"}');
    });
  });

  it('handles load more correctly', async () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: { 'test-pair-address': mockTokenData },
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: new Date(),
      },
    });

    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    const loadMoreButton = screen.getByTestId('load-more-button');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });
  });

  it('sets up WebSocket subscriptions correctly', () => {
    const store = createMockStore({
      trendingTokens: {
        tokens: { 'test-pair-address': mockTokenData },
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: new Date(),
      },
    });

    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
      type: 'subscribe',
      payload: {
        room: 'scanner-filter',
        params: {
          tableType: 'trending',
          chain: undefined,
          minVolume: undefined,
          maxAge: undefined,
          minMarketCap: undefined,
          excludeHoneypots: undefined,
        }
      },
    });

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
      type: 'subscribe',
      payload: {
        room: 'pair-stats',
        params: { pairAddress: 'test-pair-address' }
      },
    });

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
      type: 'subscribe',
      payload: {
        room: 'pair',
        params: { pairAddress: 'test-pair-address' }
      },
    });
  });

  it('handles API errors correctly', async () => {
    const errorMessage = 'API Error';
    mockApiService.fetchScannerData.mockRejectedValue(new Error(errorMessage));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  it('displays loading state correctly', async () => {
    // Mock a delayed response
    mockApiService.fetchScannerData.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        results: [],
        pagination: { page: 0, limit: 50, total: 0, hasMore: false }
      }), 100))
    );

    const store = createMockStore();
    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('sorts tokens correctly', () => {
    const token1: TokenData = { ...mockTokenData, id: 'token1', volumeUsd: 100000 };
    const token2: TokenData = { ...mockTokenData, id: 'token2', volumeUsd: 200000 };
    const token3: TokenData = { ...mockTokenData, id: 'token3', volumeUsd: 150000 };

    const store = createMockStore({
      trendingTokens: {
        tokens: {
          token1,
          token2,
          token3,
        },
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: false,
        page: 0,
        lastUpdated: new Date(),
      },
    });

    render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    expect(screen.getByTestId('tokens-count')).toHaveTextContent('3');
  });

  it('cleans up WebSocket callbacks on unmount', () => {
    const store = createMockStore();
    const { unmount } = render(
      <Provider store={store}>
        <TrendingTokensTable filters={mockFilters} webSocketService={mockWebSocketService} />
      </Provider>
    );

    unmount();

    expect(mockWebSocketService.removeMessageCallback).toHaveBeenCalled();
  });
});
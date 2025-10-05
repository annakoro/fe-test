import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CryptoScannerApp } from '../CryptoScannerApp';
import { createWebSocketService } from '../../../services/webSocketService';
import { apiService } from '../../../services/apiService';
import { mockTokenData, mockScannerApiResponse } from '../../../utils/__tests__/testUtils';

// Mock the WebSocket service
jest.mock('../../../services/webSocketService');
jest.mock('../../../services/apiService');

const mockWebSocketService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  onMessage: jest.fn(),
  removeMessageCallback: jest.fn(),
  cleanup: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
};

const mockApiService = {
  fetchScannerData: jest.fn().mockResolvedValue(mockScannerApiResponse),
};

beforeEach(() => {
  (createWebSocketService as jest.Mock).mockReturnValue(mockWebSocketService);
  (apiService.fetchScannerData as jest.Mock).mockImplementation(mockApiService.fetchScannerData);
  
  // Reset all mocks
  jest.clearAllMocks();
});

describe('CryptoScannerApp Integration Tests', () => {
  it('renders the main application with all components', async () => {
    render(<CryptoScannerApp />);
    
    // Check for main title
    expect(screen.getByText('📊 Crypto Scanner Tables')).toBeInTheDocument();
    
    // Check for filter panel
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Check for table titles
    expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
    expect(screen.getByText('New Tokens')).toBeInTheDocument();
    
    // Check for status indicator
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('initializes WebSocket connection on mount', async () => {
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(mockWebSocketService.connect).toHaveBeenCalledTimes(1);
    });
    
    expect(mockWebSocketService.onMessage).toHaveBeenCalled();
  });

  it('fetches initial data for both tables', async () => {
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      // Should fetch data for both trending and new tokens tables
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'volumeUsd',
          sortOrder: 'desc',
          page: 0,
          limit: 50,
        })
      );
      
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'tokenCreatedTimestamp',
          sortOrder: 'desc',
          page: 0,
          limit: 50,
        })
      );
    });
  });

  it('applies filters to both tables', async () => {
    render(<CryptoScannerApp />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
    
    // Find and interact with chain filter
    const chainSelect = screen.getByLabelText(/chain/i);
    fireEvent.change(chainSelect, { target: { value: 'ETH' } });
    
    await waitFor(() => {
      // Should refetch data with chain filter applied
      expect(mockApiService.fetchScannerData).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'ETH',
        })
      );
    });
  });

  it('handles WebSocket message processing', async () => {
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(mockWebSocketService.onMessage).toHaveBeenCalled();
    });
    
    // Get the message handler that was registered
    const messageHandler = mockWebSocketService.onMessage.mock.calls[0][0];
    
    // Simulate a tick event
    const tickMessage = {
      type: 'tick',
      payload: {
        pairAddress: 'test-pair-address',
        priceToken1Usd: 1.5,
        isOutlier: false,
        timestamp: new Date().toISOString(),
      },
    };
    
    // Call the message handler
    messageHandler(tickMessage);
    
    // The message should be processed by the Redux middleware
    // This is tested more thoroughly in the middleware tests
  });

  it('handles responsive layout', () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('1200px') ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    render(<CryptoScannerApp />);
    
    // Check that tables are rendered
    expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
    expect(screen.getByText('New Tokens')).toBeInTheDocument();
  });

  it('handles WebSocket connection errors gracefully', async () => {
    // Mock WebSocket connection failure
    mockWebSocketService.connect.mockRejectedValueOnce(new Error('Connection failed'));
    
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(mockWebSocketService.connect).toHaveBeenCalled();
    });
    
    // App should still render even if WebSocket fails
    expect(screen.getByText('📊 Crypto Scanner Tables')).toBeInTheDocument();
  });

  it('cleans up WebSocket connection on unmount', async () => {
    const { unmount } = render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(mockWebSocketService.connect).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockWebSocketService.removeMessageCallback).toHaveBeenCalled();
    expect(mockWebSocketService.cleanup).toHaveBeenCalled();
  });

  it('integrates filter changes with WebSocket subscriptions', async () => {
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(mockWebSocketService.connect).toHaveBeenCalled();
    });
    
    // Change a filter
    const volumeInput = screen.getByLabelText(/minimum volume/i);
    fireEvent.change(volumeInput, { target: { value: '10000' } });
    
    await waitFor(() => {
      // Should update WebSocket subscriptions with new filter
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            params: expect.objectContaining({
              minVolume: 10000,
            }),
          }),
        })
      );
    });
  });

  it('handles sorting in both tables independently', async () => {
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
      expect(screen.getByText('New Tokens')).toBeInTheDocument();
    });
    
    // Find sort buttons in both tables
    const trendingHeaders = screen.getAllByText(/price/i);
    const newTokenHeaders = screen.getAllByText(/volume/i);
    
    // Click sort on trending table
    if (trendingHeaders.length > 0) {
      fireEvent.click(trendingHeaders[0]);
    }
    
    // Click sort on new tokens table
    if (newTokenHeaders.length > 0) {
      fireEvent.click(newTokenHeaders[0]);
    }
    
    // Both tables should handle sorting independently
    // This is tested more thoroughly in individual table component tests
  });

  it('displays loading states during data fetching', async () => {
    // Mock delayed API response
    mockApiService.fetchScannerData.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockScannerApiResponse), 100))
    );
    
    render(<CryptoScannerApp />);
    
    // Should show loading states initially
    await waitFor(() => {
      expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('displays error states when API calls fail', async () => {
    // Mock API failure
    mockApiService.fetchScannerData.mockRejectedValueOnce(new Error('API Error'));
    
    render(<CryptoScannerApp />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

// Test utilities for creating mock data
export const createMockTokenData = (overrides = {}) => ({
  id: 'test-token-id',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: '0x123',
  pairAddress: '0x456',
  chain: 'ETH' as const,
  exchange: 'Uniswap V2',
  priceUsd: 1.0,
  volumeUsd: 10000,
  mcap: 1000000,
  priceChangePcs: {
    '5m': 0.5,
    '1h': 1.0,
    '6h': 2.0,
    '24h': 5.0,
  },
  transactions: {
    buys: 10,
    sells: 5,
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
  },
  tokenCreatedTimestamp: new Date(),
  liquidity: {
    current: 50000,
    changePc: 10.0,
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed' as const,
  ...overrides,
});
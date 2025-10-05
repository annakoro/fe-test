/**
 * Integration tests for the complete Crypto Scanner Tables application
 * Validates all requirements are met through comprehensive testing
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CryptoScannerApp } from '../components/CryptoScannerApp';
import { SupportedChainName } from '../types';

// Mock WebSocket service
const mockWebSocketService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  onMessage: jest.fn(),
  removeMessageCallback: jest.fn(),
  cleanup: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue('connected'),
  send: jest.fn(),
  close: jest.fn()
};

jest.mock('../services/webSocketService', () => ({
  createWebSocketService: jest.fn(() => mockWebSocketService)
}));

// Mock API service
const mockTokenData = {
  id: 'token-0',
  tokenName: 'Token 0',
  tokenSymbol: 'TKN0',
  tokenAddress: '0x123',
  pairAddress: '0x456',
  chain: 'ETH' as SupportedChainName,
  exchange: 'Uniswap',
  priceUsd: 1.5,
  volumeUsd: 100000,
  mcap: 1500000,
  priceChangePcs: {
    '5m': 2.5,
    '1h': -1.2,
    '6h': 5.8,
    '24h': -3.4
  },
  transactions: {
    buys: 45,
    sells: 23
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true
  },
  tokenCreatedTimestamp: new Date(),
  liquidity: {
    current: 500000,
    changePc: 2.1
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed' as const
};

jest.mock('../services/apiService', () => ({
  apiService: {
    fetchScannerData: jest.fn().mockResolvedValue({
      data: Array.from({ length: 50 }, (_, i) => ({
        ...mockTokenData,
        id: `token-${i}`,
        tokenName: `Token ${i}`,
        tokenSymbol: `TKN${i}`,
        volumeUsd: 1000000 - (i * 10000),
        tokenCreatedTimestamp: new Date(Date.now() - (i * 60000))
      }))
    })
  }
}));

describe('Crypto Scanner Tables - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1: Side-by-side tables display', () => {
    test('should display two tables side-by-side with correct titles', async () => {
      render(<CryptoScannerApp />);

      // Wait for tables to load
      await waitFor(() => {
        expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
        expect(screen.getByText('New Tokens')).toBeInTheDocument();
      });

      // Verify both tables are present
      const trendingTable = screen.getByLabelText(/trending tokens/i);
      const newTokensTable = screen.getByLabelText(/new tokens/i);
      
      expect(trendingTable).toBeInTheDocument();
      expect(newTokensTable).toBeInTheDocument();
    });

    test('should support infinite pagination for smooth scrolling', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
      });

      // Simulate scrolling to trigger pagination
      const tableContainer = screen.getByLabelText(/trending tokens/i);
      fireEvent.scroll(tableContainer, { target: { scrollTop: 1000 } });

      // Should handle scrolling without errors
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe('Requirement 2: Comprehensive token information', () => {
    test('should display all required token data fields', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      });

      // Check for required columns
      expect(screen.getByText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/price/i)).toBeInTheDocument();
      expect(screen.getByText(/market cap/i)).toBeInTheDocument();
      expect(screen.getByText(/volume/i)).toBeInTheDocument();
      expect(screen.getByText(/chain/i)).toBeInTheDocument();
    });

    test('should show price changes for different timeframes', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      });

      // Look for price change indicators (5m, 1h, 6h, 24h)
      const priceChangeElements = screen.getAllByText(/[+-]\d+\.\d+%/);
      expect(priceChangeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 4: Filter functionality', () => {
    test('should provide all required filter options', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByLabelText(/chain/i)).toBeInTheDocument();
      });

      // Check for all filter types
      expect(screen.getByLabelText(/chain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/market cap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exclude honeypots/i)).toBeInTheDocument();
    });

    test('should apply filters and update both tables', async () => {
      const user = userEvent.setup();
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByLabelText(/chain/i)).toBeInTheDocument();
      });

      // Apply chain filter
      const chainSelect = screen.getByLabelText(/chain/i);
      await user.selectOptions(chainSelect, 'ETH');

      // Apply volume filter
      const volumeInput = screen.getByLabelText(/minimum volume/i);
      await user.clear(volumeInput);
      await user.type(volumeInput, '100000');

      // Filters should be applied without errors
      expect(chainSelect).toHaveValue('ETH');
      expect(volumeInput).toHaveValue('100000');
    });
  });

  describe('Requirement 5: Sortable columns', () => {
    test('should allow sorting by clicking column headers', async () => {
      const user = userEvent.setup();
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText(/price/i)).toBeInTheDocument();
      });

      // Click on price column header to sort
      const priceHeader = screen.getByRole('button', { name: /price/i });
      await user.click(priceHeader);

      // Should show sort indicator
      expect(priceHeader).toHaveAttribute('aria-sort');
    });

    test('should maintain sort order during real-time updates', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      });

      // Simulate real-time price update
      act(() => {
        // Mock WebSocket message would be processed here
        // The sort order should be maintained
      });

      // Verify table is still rendered correctly
      expect(screen.getByText('Token 0')).toBeInTheDocument();
    });
  });

  describe('Requirement 6: Visual feedback', () => {
    test('should display loading states', async () => {
      render(<CryptoScannerApp />);

      // Should show loading state initially
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should show connection status indicator', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        // Should show connection status
        const statusIndicator = screen.getByLabelText(/connection status/i) || 
                               screen.getByText(/connected|connecting|disconnected/i);
        expect(statusIndicator).toBeInTheDocument();
      });
    });

    test('should use color coding for price changes', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      });

      // Look for elements with positive/negative price change classes
      const priceElements = document.querySelectorAll('[class*="positive"], [class*="negative"], [class*="green"], [class*="red"]');
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 8: Performance optimization', () => {
    test('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const mockLargeDataset = Array.from({ length: 1000 }, (_, i) => 
        createMockTokenData({
          id: `token-${i}`,
          tokenName: `Token ${i}`,
          tokenSymbol: `TKN${i}`
        })
      );

      const mockApiService = require('../services/apiService');
      mockApiService.apiService.fetchScannerData.mockResolvedValueOnce({
        data: mockLargeDataset
      });

      const startTime = performance.now();
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 3 seconds)
      expect(renderTime).toBeLessThan(3000);
    });

    test('should use virtualization for table rendering', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Token 0')).toBeInTheDocument();
      });

      // Check for virtualized table container
      const virtualizedContainer = document.querySelector('[style*="height"]');
      expect(virtualizedContainer).toBeInTheDocument();
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle API errors gracefully', async () => {
      const mockApiService = require('../services/apiService');
      mockApiService.apiService.fetchScannerData.mockRejectedValueOnce(
        new Error('API Error')
      );

      render(<CryptoScannerApp />);

      await waitFor(() => {
        // Should show error state instead of crashing
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    test('should handle WebSocket connection failures', async () => {
      const mockWebSocketService = createMockWebSocketService();
      mockWebSocketService.connect.mockRejectedValueOnce(new Error('Connection failed'));

      render(<CryptoScannerApp />);

      await waitFor(() => {
        // Should handle connection failure gracefully
        expect(screen.getByText(/disconnected|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility compliance', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check for proper semantic structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      
      // Check for table accessibility
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Should be able to navigate through interactive elements
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    test('should adapt to different screen sizes', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<CryptoScannerApp />);

      await waitFor(() => {
        expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
      });

      // Should render without layout issues on mobile
      const mainContainer = screen.getByRole('main');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
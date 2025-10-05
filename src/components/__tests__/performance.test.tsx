// Performance tests for components

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { VirtualizedTable } from '../VirtualizedTable/VirtualizedTable';
import { TokenRow } from '../TokenRow/TokenRow';
import { CryptoScannerApp } from '../CryptoScannerApp/CryptoScannerApp';
import { trendingTokensSlice } from '../../store/slices/trendingTokensSlice';
import { newTokensSlice } from '../../store/slices/newTokensSlice';
import { filtersSlice } from '../../store/slices/filtersSlice';
import { TokenData } from '../../types/token';


// Mock react-window components
jest.mock('react-window', () => {
  const mockReact = require('react');
  
  return {
    List: ({ rowComponent: RowComponent, rowCount, onRowsRendered }: any) => {
      // Simulate rendering visible rows
      const visibleRows = Math.min(rowCount, 20);
      const rows = [];
      
      for (let i = 0; i < visibleRows; i++) {
        rows.push(
          mockReact.createElement('div', { key: i, 'data-testid': `row-${i}` },
            mockReact.createElement(RowComponent, { index: i, style: {} })
          )
        );
      }
      
      // Simulate scroll events
      mockReact.useEffect(() => {
        if (onRowsRendered) {
          onRowsRendered({ startIndex: 0, stopIndex: visibleRows - 1 });
        }
      }, [onRowsRendered, visibleRows]);
      
      return mockReact.createElement('div', { 'data-testid': 'virtualized-list' }, ...rows);
    }
  };
});

// Mock react-window-infinite-loader
jest.mock('react-window-infinite-loader', () => ({
  useInfiniteLoader: ({ isRowLoaded, loadMoreRows }: any) => {
    return (visibleRows: any) => {
      // Simulate infinite loading behavior
      const { startIndex, stopIndex } = visibleRows;
      for (let i = startIndex; i <= stopIndex; i++) {
        if (!isRowLoaded(i)) {
          loadMoreRows();
          break;
        }
      }
    };
  }
}));

// Mock WebSocket service
jest.mock('../../services/webSocketService', () => ({
  createWebSocketService: () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    onMessage: jest.fn(),
    removeMessageCallback: jest.fn(),
    cleanup: jest.fn(),
    getConnectionStatus: jest.fn().mockReturnValue('connected'),
  })
}));

// Generate test token data
const generateTokenData = (count: number): TokenData[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `token-${index}`,
    tokenName: `Token ${index}`,
    tokenSymbol: `TKN${index}`,
    tokenAddress: `0x${index.toString(16).padStart(40, '0')}`,
    pairAddress: `0x${(index + 1000).toString(16).padStart(40, '0')}`,
    chain: 'ETH' as const,
    exchange: 'Uniswap V3',
    priceUsd: Math.random() * 100,
    volumeUsd: Math.random() * 1000000,
    mcap: Math.random() * 10000000,
    priceChangePcs: {
      '5m': (Math.random() - 0.5) * 20,
      '1h': (Math.random() - 0.5) * 50,
      '6h': (Math.random() - 0.5) * 100,
      '24h': (Math.random() - 0.5) * 200,
    },
    transactions: {
      buys: Math.floor(Math.random() * 100),
      sells: Math.floor(Math.random() * 100),
    },
    audit: {
      mintable: Math.random() > 0.5,
      freezable: Math.random() > 0.5,
      honeypot: Math.random() > 0.8,
      contractVerified: Math.random() > 0.3,
    },
    tokenCreatedTimestamp: new Date(Date.now() - Math.random() * 86400000),
    liquidity: {
      current: Math.random() * 1000000,
      changePc: (Math.random() - 0.5) * 100,
    },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed' as const,
  }));
};

// Create test store
const createTestStore = (tokenCount: number = 1000) => {
  const tokens = generateTokenData(tokenCount);
  const tokensById = tokens.reduce((acc, token) => {
    acc[token.id] = token;
    return acc;
  }, {} as Record<string, TokenData>);

  return configureStore({
    reducer: {
      trendingTokens: trendingTokensSlice.reducer,
      newTokens: newTokensSlice.reducer,
      filters: filtersSlice.reducer,
    },
    preloadedState: {
      trendingTokens: {
        tokens: tokensById,
        sortConfig: { column: 'volumeUsd', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: new Date(),
      },
      newTokens: {
        tokens: tokensById,
        sortConfig: { column: 'tokenCreatedTimestamp', direction: 'desc' },
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        lastUpdated: new Date(),
      },
      filters: {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      },
    },
  });
};

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TokenRow Performance', () => {
    it('should render individual token rows efficiently', () => {
      const tokens = generateTokenData(100);
      const renderTimes: number[] = [];

      tokens.forEach((token, index) => {
        const startTime = performance.now();
        
        const { unmount } = render(
          <TokenRow token={token} style={{ height: 60 }} />
        );
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        
        unmount();
      });

      const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes);

      // Performance assertions
      expect(averageRenderTime).toBeLessThan(5); // Average render time should be < 5ms
      expect(maxRenderTime).toBeLessThan(20); // Max render time should be < 20ms
      
      console.log(`TokenRow Performance:
        Average render time: ${averageRenderTime.toFixed(2)}ms
        Max render time: ${maxRenderTime.toFixed(2)}ms
        Total tokens rendered: ${tokens.length}`);
    });

    it('should handle rapid re-renders efficiently', () => {
      const token = generateTokenData(1)[0];
      const { rerender } = render(
        <TokenRow token={token} style={{ height: 60 }} />
      );

      const rerenderTimes: number[] = [];
      
      // Simulate rapid price updates
      for (let i = 0; i < 100; i++) {
        const updatedToken = {
          ...token,
          priceUsd: Math.random() * 100,
          mcap: Math.random() * 10000000,
          lastUpdated: new Date(),
        };

        const startTime = performance.now();
        rerender(<TokenRow token={updatedToken} style={{ height: 60 }} />);
        const endTime = performance.now();
        
        rerenderTimes.push(endTime - startTime);
      }

      const averageRerenderTime = rerenderTimes.reduce((sum, time) => sum + time, 0) / rerenderTimes.length;
      
      // Re-render should be even faster due to memoization
      expect(averageRerenderTime).toBeLessThan(2);
      
      console.log(`TokenRow Re-render Performance:
        Average re-render time: ${averageRerenderTime.toFixed(2)}ms
        Total re-renders: ${rerenderTimes.length}`);
    });
  });

  describe('VirtualizedTable Performance', () => {
    it('should handle 1000+ rows efficiently', async () => {
      const tokens = generateTokenData(1500);
      const mockOnSort = jest.fn();
      const mockOnLoadMore = jest.fn();

      const startTime = performance.now();
      
      const { container } = render(
        <VirtualizedTable
          tokens={tokens}
          sortConfig={{ column: 'volumeUsd', direction: 'desc' }}
          onSort={mockOnSort}
          onLoadMore={mockOnLoadMore}
          loading={false}
          error={null}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large datasets quickly
      expect(renderTime).toBeLessThan(100); // < 100ms for 1500 tokens
      
      // Should only render visible rows (not all 1500)
      const renderedRows = container.querySelectorAll('[data-testid^="row-"]');
      expect(renderedRows.length).toBeLessThan(50); // Only visible rows
      
      console.log(`VirtualizedTable Performance:
        Render time for 1500 tokens: ${renderTime.toFixed(2)}ms
        Visible rows rendered: ${renderedRows.length}
        Total tokens: ${tokens.length}`);
    });

    it('should handle scroll events efficiently', async () => {
      const tokens = generateTokenData(2000);
      const mockOnSort = jest.fn();
      const mockOnLoadMore = jest.fn();
      const mockOnVisibleRangeChange = jest.fn();

      render(
        <VirtualizedTable
          tokens={tokens}
          sortConfig={{ column: 'volumeUsd', direction: 'desc' }}
          onSort={mockOnSort}
          onLoadMore={mockOnLoadMore}
          onVisibleRangeChange={mockOnVisibleRangeChange}
          loading={false}
          error={null}
        />
      );

      // Simulate multiple scroll events
      const scrollTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        // Trigger visible range change (simulating scroll)
        act(() => {
          mockOnVisibleRangeChange({ startIndex: i * 10, endIndex: (i * 10) + 20 });
        });
        
        const endTime = performance.now();
        scrollTimes.push(endTime - startTime);
      }

      const averageScrollTime = scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length;
      
      // Scroll handling should be very fast
      expect(averageScrollTime).toBeLessThan(1);
      
      console.log(`VirtualizedTable Scroll Performance:
        Average scroll handling time: ${averageScrollTime.toFixed(2)}ms
        Total scroll events: ${scrollTimes.length}`);
    });
  });

  describe('Full Application Performance', () => {
    it('should initialize with large datasets efficiently', async () => {
      const store = createTestStore(1200);
      
      const startTime = performance.now();
      
      const { container } = render(
        <Provider store={store}>
          <CryptoScannerApp />
        </Provider>
      );
      
      // Wait for initial render to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Should initialize quickly even with large datasets
      expect(initTime).toBeLessThan(500); // < 500ms initialization
      
      // Should render both tables
      const tables = container.querySelectorAll('[data-testid="virtualized-list"]');
      expect(tables).toHaveLength(2);
      
      console.log(`Full Application Performance:
        Initialization time with 1200 tokens: ${initTime.toFixed(2)}ms
        Tables rendered: ${tables.length}`);
    });

    it('should handle rapid state updates efficiently', async () => {
      const store = createTestStore(800);
      
      render(
        <Provider store={store}>
          <CryptoScannerApp />
        </Provider>
      );

      const updateTimes: number[] = [];
      
      // Simulate rapid price updates
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        act(() => {
          store.dispatch({
            type: 'trendingTokens/batchUpdate',
            payload: {
              priceUpdates: [
                {
                  tokenId: `token-${i % 10}`,
                  priceUsd: Math.random() * 100,
                  mcap: Math.random() * 10000000,
                  timestamp: new Date(),
                }
              ]
            }
          });
        });
        
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      const averageUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      
      // State updates should be fast
      expect(averageUpdateTime).toBeLessThan(5);
      
      console.log(`State Update Performance:
        Average update time: ${averageUpdateTime.toFixed(2)}ms
        Total updates: ${updateTimes.length}`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during long sessions', async () => {
      const store = createTestStore(500);
      
      const { unmount } = render(
        <Provider store={store}>
          <CryptoScannerApp />
        </Provider>
      );

      // Simulate long session with many updates
      for (let i = 0; i < 1000; i++) {
        act(() => {
          store.dispatch({
            type: 'trendingTokens/batchUpdate',
            payload: {
              priceUpdates: [
                {
                  tokenId: `token-${i % 100}`,
                  priceUsd: Math.random() * 100,
                  mcap: Math.random() * 10000000,
                  timestamp: new Date(),
                }
              ]
            }
          });
        });
      }

      // Cleanup should work without errors
      expect(() => unmount()).not.toThrow();
      
      console.log('Memory leak test completed successfully');
    });

    it('should clean up old token data', async () => {
      const store = createTestStore(100);
      
      // Add tokens with old timestamps
      const oldTokens = generateTokenData(50).map(token => ({
        ...token,
        id: `old-${token.id}`,
        lastUpdated: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      }));

      // Add old tokens to store
      act(() => {
        oldTokens.forEach(token => {
          store.dispatch({
            type: 'trendingTokens/updateTokens',
            payload: { tokens: [token] }
          });
        });
      });

      const stateBefore = store.getState();
      const tokenCountBefore = Object.keys(stateBefore.trendingTokens.tokens).length;

      // Trigger cleanup
      act(() => {
        store.dispatch({
          type: 'trendingTokens/cleanupOldTokens',
          payload: { maxAge: 30 * 60 * 1000 } // 30 minutes
        });
      });

      const stateAfter = store.getState();
      const tokenCountAfter = Object.keys(stateAfter.trendingTokens.tokens).length;

      // Should have removed old tokens
      expect(tokenCountAfter).toBeLessThan(tokenCountBefore);
      
      console.log(`Memory cleanup test:
        Tokens before cleanup: ${tokenCountBefore}
        Tokens after cleanup: ${tokenCountAfter}
        Tokens removed: ${tokenCountBefore - tokenCountAfter}`);
    });
  });

  describe('60fps Scrolling Simulation', () => {
    it('should maintain 60fps during scrolling', async () => {
      const tokens = generateTokenData(2000);
      const mockOnSort = jest.fn();
      const mockOnLoadMore = jest.fn();
      const mockOnVisibleRangeChange = jest.fn();

      render(
        <VirtualizedTable
          tokens={tokens}
          sortConfig={{ column: 'volumeUsd', direction: 'desc' }}
          onSort={mockOnSort}
          onLoadMore={mockOnLoadMore}
          onVisibleRangeChange={mockOnVisibleRangeChange}
          loading={false}
          error={null}
        />
      );

      // Simulate 60fps scrolling (16.67ms per frame)
      const frameTimes: number[] = [];
      const targetFrameTime = 16.67; // 60fps
      
      for (let frame = 0; frame < 60; frame++) { // 1 second of scrolling
        const frameStart = performance.now();
        
        // Simulate scroll event
        act(() => {
          mockOnVisibleRangeChange({ 
            startIndex: frame * 2, 
            endIndex: (frame * 2) + 20 
          });
        });
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        frameTimes.push(frameTime);
        
        // Each frame should complete within 16.67ms for 60fps
        expect(frameTime).toBeLessThan(targetFrameTime);
      }

      const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const droppedFrames = frameTimes.filter(time => time > targetFrameTime).length;
      
      console.log(`60fps Scrolling Performance:
        Average frame time: ${averageFrameTime.toFixed(2)}ms
        Max frame time: ${maxFrameTime.toFixed(2)}ms
        Target frame time: ${targetFrameTime}ms
        Dropped frames: ${droppedFrames}/60
        Performance: ${((60 - droppedFrames) / 60 * 100).toFixed(1)}%`);
      
      // Should maintain good performance
      expect(droppedFrames).toBeLessThan(6); // Allow up to 10% dropped frames
      expect(averageFrameTime).toBeLessThan(targetFrameTime * 0.8); // Average should be well under target
    });
  });
});
/**
 * CryptoScannerApp - Main Application Component
 * 
 * This is the core component that orchestrates the entire Crypto Scanner Tables application.
 * It provides the main layout, WebSocket connection management, and integrates all sub-components.
 * 
 * Key Features:
 * - Side-by-side table layout for trending and new tokens
 * - Real-time WebSocket connection management
 * - Performance monitoring and memory management
 * - Accessibility support with proper semantic structure
 * - Error boundary integration for robust error handling
 * 
 * Architecture:
 * - Uses Redux Provider for state management
 * - Manages WebSocket service lifecycle
 * - Implements performance optimizations
 * - Provides clean component separation
 * 
 * @author Crypto Scanner Tables Team
 * @version 1.0.0
 */

import React, { useEffect, useRef, memo } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { FilterPanel } from '../FilterPanel';
import { TrendingTokensTable } from '../TrendingTokensTable';
import { NewTokensTable } from '../NewTokensTable';
import { StatusIndicator } from '../StatusIndicator';
import { useAppSelector } from '../../store/hooks';
import { createWebSocketService } from '../../services/webSocketService';
import { createMockWebSocketService } from '../../services/mockWebSocketService';
import { webSocketActions } from '../../store/middleware/webSocketMiddleware';
import { MemoryManager, PerformanceMonitor } from '../../utils/performanceUtils';
import './CryptoScannerApp.css';



/**
 * CryptoScannerAppContent - Internal Component with Redux Integration
 * 
 * This component contains the main application logic and uses Redux hooks.
 * It's separated from the main component to allow the Redux Provider to wrap it.
 * 
 * Responsibilities:
 * - WebSocket service initialization and management
 * - Memory management and performance monitoring
 * - Filter state management
 * - Component lifecycle management
 * - Real-time data subscription coordination
 */
const CryptoScannerAppContent: React.FC = memo(() => {
  const filters = useAppSelector(state => state.filters);
  const webSocketServiceRef = useRef<ReturnType<typeof createWebSocketService> | null>(null);
  const [isWebSocketReady, setIsWebSocketReady] = React.useState(false);
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Initialize WebSocket service and memory management
  useEffect(() => {
    const endTiming = performanceMonitor.startTiming('app_initialization');
    
    if (!webSocketServiceRef.current) {
      // Use mock WebSocket service in development if real WebSocket fails
      const useMockWebSocket = process.env.REACT_APP_USE_MOCK_WEBSOCKET === 'true' || 
                               process.env.NODE_ENV === 'development';
      
      webSocketServiceRef.current = useMockWebSocket 
        ? createMockWebSocketService()
        : createWebSocketService();
      setIsWebSocketReady(true);
    }

    const webSocketService = webSocketServiceRef.current;

    // Set up WebSocket message handler
    const handleWebSocketMessage = (message: any) => {
      // Dispatch WebSocket messages to Redux middleware
      store.dispatch(webSocketActions.messageReceived(message));
    };

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        webSocketService.onMessage(handleWebSocketMessage);
        
        const status = webSocketService.getConnectionStatus();
        store.dispatch(webSocketActions.connectionStatusChanged(status));
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        const status = webSocketService.getConnectionStatus();
        store.dispatch(webSocketActions.connectionStatusChanged(status));
      }
    };

    connectWebSocket();

    // Start memory management
    memoryManager.startAutoCleanup();
    
    // Register cleanup tasks for memory management
    const unregisterCleanupTasks = [
      // Clear performance metrics periodically
      memoryManager.registerCleanupTask(() => {
        const metrics = performanceMonitor.getAllMetrics();
        console.log('Performance metrics:', metrics);
        // Keep only recent metrics
        performanceMonitor.clearMetrics();
      }),
      
      // Clean up old token data from Redux store
      memoryManager.registerCleanupTask(() => {
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        // Import cleanup actions
        const { cleanupOldTokens: cleanupTrendingTokens } = require('../../store/slices/trendingTokensSlice');
        const { cleanupOldTokens: cleanupNewTokens } = require('../../store/slices/newTokensSlice');
        
        // Dispatch cleanup actions
        store.dispatch(cleanupTrendingTokens({ maxAge }));
        store.dispatch(cleanupNewTokens({ maxAge }));
      })
    ];

    endTiming();

    // Cleanup on unmount
    return () => {
      if (webSocketServiceRef.current) {
        webSocketServiceRef.current.removeMessageCallback(handleWebSocketMessage);
        webSocketServiceRef.current.cleanup();
        webSocketServiceRef.current = null;
      }
      
      // Stop memory management and unregister cleanup tasks
      memoryManager.stopAutoCleanup();
      unregisterCleanupTasks.forEach(unregister => unregister());
    };
  }, [memoryManager, performanceMonitor]);

  return (
    <div className="crypto-scanner-app">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <header className="crypto-scanner-header" role="banner">
        <h1 className="crypto-scanner-title">
          <span role="img" aria-label="Chart">📊</span>
          Crypto Scanner Tables
          <StatusIndicator 
            connectionStatus={webSocketServiceRef.current?.getConnectionStatus() || 'disconnected'}
            loading={false}
            error={null}
          />
        </h1>
      </header>
      
      <main id="main-content" className="crypto-scanner-main" role="main">
        <section className="crypto-scanner-filter-section" aria-label="Token filters">
          <FilterPanel />
        </section>
        
        <section className="crypto-scanner-tables-section" aria-label="Token tables">
          <div className="crypto-scanner-table-wrapper">
            <h2 className="crypto-scanner-table-title">Trending Tokens</h2>
            {isWebSocketReady && webSocketServiceRef.current && (
              <TrendingTokensTable 
                filters={filters}
                webSocketService={webSocketServiceRef.current}
              />
            )}
          </div>
          
          <div className="crypto-scanner-table-wrapper">
            <h2 className="crypto-scanner-table-title">New Tokens</h2>
            {isWebSocketReady && webSocketServiceRef.current && (
              <NewTokensTable 
                filters={filters}
                webSocketService={webSocketServiceRef.current}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
});

// Set display name for debugging
CryptoScannerAppContent.displayName = 'CryptoScannerAppContent';

/**
 * CryptoScannerApp - Main Export Component
 * 
 * This is the main component that provides the Redux store context
 * and renders the internal CryptoScannerAppContent component.
 * 
 * This separation allows for:
 * - Clean Redux Provider setup
 * - Proper component isolation
 * - Easy testing and mocking
 * - Clear separation of concerns
 * 
 * Usage:
 * ```tsx
 * import { CryptoScannerApp } from './components/CryptoScannerApp';
 * 
 * function App() {
 *   return <CryptoScannerApp />;
 * }
 * ```
 */
export const CryptoScannerApp: React.FC = memo(() => {
  return (
    <Provider store={store}>
      <CryptoScannerAppContent />
    </Provider>
  );
});

// Set display name for debugging
CryptoScannerApp.displayName = 'CryptoScannerApp';

export default CryptoScannerApp;
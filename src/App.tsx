import React, { useEffect } from 'react';
import { CryptoScannerApp } from './components/CryptoScannerApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationManager } from './components/NotificationManager';
import { errorHandler } from './utils/errorHandler';
import { PerformanceMonitor } from './utils/performanceUtils';

/**
 * Main Application Component
 * 
 * This is the root component that initializes the Crypto Scanner Tables application.
 * It provides global error handling, performance monitoring, and notification management.
 * 
 * Features:
 * - Global error boundary for unhandled errors
 * - Performance monitoring initialization
 * - Notification system for user feedback
 * - Accessibility support with proper semantic structure
 */
function App() {
  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const endTiming = performanceMonitor.startTiming('app_startup');

    // Initialize global error handler
    errorHandler.initialize();

    // Log application startup
    console.log('🚀 Crypto Scanner Tables Application Started');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Version:', process.env.REACT_APP_VERSION || '1.0.0');

    endTiming();

    // Cleanup on unmount
    return () => {
      errorHandler.cleanup();
      console.log('🛑 Crypto Scanner Tables Application Stopped');
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        // Log critical application errors
        console.error('🚨 Critical Application Error:', { 
          error: error.message, 
          errorInfo, 
          errorId,
          timestamp: new Date().toISOString()
        });
        
        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Integration with error reporting service would go here
          // e.g., Sentry.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <div className="app-container">
        {/* Skip link for accessibility */}
        <a href="#main-app" className="skip-link">
          Skip to main application
        </a>
        
        {/* Main application content */}
        <main id="main-app" role="main">
          <CryptoScannerApp />
        </main>
        
        {/* Global notification system */}
        <NotificationManager 
          maxNotifications={5}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
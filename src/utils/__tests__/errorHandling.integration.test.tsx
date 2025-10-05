import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { NotificationManager } from '../../components/NotificationManager';
import { errorHandler } from '../errorHandler';

// Mock component that can throw errors
const TestComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component working</div>;
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    errorHandler.cleanup();
    errorHandler.initialize();
  });

  afterEach(() => {
    errorHandler.cleanup();
  });

  it('integrates error boundary with notification system', async () => {
    const onError = jest.fn();

    render(
      <div>
        <ErrorBoundary onError={onError}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
        <NotificationManager />
      </div>
    );

    // Error boundary should catch the error
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('displays notifications for manually reported errors', async () => {
    render(<NotificationManager />);

    // Report an error manually
    errorHandler.reportError(new Error('Manual error test'));

    await waitFor(() => {
      expect(screen.getByText('Display Error')).toBeInTheDocument();
      expect(screen.getByText(/display error occurred/)).toBeInTheDocument();
    });
  });

  it('handles API errors with proper notifications', async () => {
    render(<NotificationManager />);

    // Report an API error
    errorHandler.reportApiError(
      new Error('API request failed'),
      '/api/test',
      'GET',
      500,
      { error: 'Server error' }
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    });
  });

  it('handles WebSocket errors with proper notifications', async () => {
    render(<NotificationManager />);

    // Report a WebSocket error
    errorHandler.reportWebSocketError(
      new Error('WebSocket connection failed'),
      'connecting'
    );

    await waitFor(() => {
      expect(screen.getByText('Real-time Connection Issue')).toBeInTheDocument();
      expect(screen.getByText(/Lost connection to real-time updates/)).toBeInTheDocument();
    });
  });

  it('allows dismissing notifications', async () => {
    render(<NotificationManager />);

    // Report an error
    errorHandler.reportError(new Error('Dismissible error'));

    await waitFor(() => {
      expect(screen.getByText('Display Error')).toBeInTheDocument();
    });

    // Dismiss the notification
    const dismissButton = screen.getByText('×');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Display Error')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('limits the number of notifications displayed', async () => {
    render(<NotificationManager maxNotifications={2} />);

    // Report multiple errors
    errorHandler.reportError(new Error('Error 1'));
    errorHandler.reportError(new Error('Error 2'));
    errorHandler.reportError(new Error('Error 3'));

    await waitFor(() => {
      const notifications = screen.getAllByText('Display Error');
      expect(notifications).toHaveLength(2);
    });
  });

  it('provides error recovery actions', async () => {
    const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(<NotificationManager />);

    // Report a global error that should have a refresh action
    errorHandler.reportError(new Error('Global error'), 'global-error');

    await waitFor(() => {
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    // Click the refresh action
    fireEvent.click(screen.getByText('Refresh Page'));

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });

  it('handles unhandled promise rejections', async () => {
    render(<NotificationManager />);

    // Simulate an unhandled promise rejection
    const mockEvent = {
      reason: new Error('Unhandled promise rejection'),
      preventDefault: jest.fn(),
    } as any;

    // Call the handler directly since we can't easily trigger the actual event
    const handler = (errorHandler as any).handleUnhandledRejection;
    handler(mockEvent);

    await waitFor(() => {
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('handles global JavaScript errors', async () => {
    render(<NotificationManager />);

    // Simulate a global error
    const mockEvent = {
      message: 'Global JavaScript error',
      filename: 'test.js',
      lineno: 10,
      colno: 5,
      error: new Error('Global JavaScript error'),
    } as ErrorEvent;

    // Call the handler directly
    const handler = (errorHandler as any).handleGlobalError;
    handler(mockEvent);

    await waitFor(() => {
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });
  });
});
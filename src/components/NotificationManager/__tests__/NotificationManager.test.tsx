import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { NotificationManager } from '../NotificationManager';
import { errorHandler, ErrorNotification } from '../../../utils/errorHandler';

// Mock the ErrorNotification component
jest.mock('../../ErrorNotification', () => ({
  ErrorNotification: ({ notification, onDismiss }: any) => (
    <div data-testid={`notification-${notification.id}`}>
      <div>{notification.title}</div>
      <div>{notification.message}</div>
      <button onClick={() => onDismiss(notification.id)}>Dismiss</button>
    </div>
  ),
}));

const mockNotification1: ErrorNotification = {
  id: 'error-1',
  type: 'error',
  title: 'Error 1',
  message: 'First error message',
  timestamp: new Date(),
};

const mockNotification2: ErrorNotification = {
  id: 'error-2',
  type: 'warning',
  title: 'Warning 1',
  message: 'First warning message',
  timestamp: new Date(),
};

const mockNotification3: ErrorNotification = {
  id: 'error-3',
  type: 'info',
  title: 'Info 1',
  message: 'First info message',
  timestamp: new Date(),
};

describe('NotificationManager', () => {
  beforeEach(() => {
    // Clear any existing listeners
    errorHandler.cleanup();
    errorHandler.initialize();
  });

  afterEach(() => {
    errorHandler.cleanup();
  });

  it('renders nothing when there are no notifications', () => {
    const { container } = render(<NotificationManager />);
    expect(container.firstChild).toBeNull();
  });

  it('displays notifications when they are reported', async () => {
    render(<NotificationManager />);

    // Simulate error notification
    errorHandler.reportError(new Error('Test error'));

    await waitFor(() => {
      expect(screen.getByText('Display Error')).toBeInTheDocument();
    });
  });

  it('displays multiple notifications', async () => {
    render(<NotificationManager />);

    // Report multiple errors
    errorHandler.reportError(new Error('First error'));
    errorHandler.reportError(new Error('Second error'));

    await waitFor(() => {
      expect(screen.getAllByText('Display Error')).toHaveLength(2);
    });
  });

  it('limits the number of notifications displayed', async () => {
    render(<NotificationManager maxNotifications={2} />);

    // Report more notifications than the limit
    errorHandler.reportError(new Error('Error 1'));
    errorHandler.reportError(new Error('Error 2'));
    errorHandler.reportError(new Error('Error 3'));

    await waitFor(() => {
      const notifications = screen.getAllByText('Display Error');
      expect(notifications).toHaveLength(2);
    });
  });

  it('removes oldest notifications when limit is exceeded', async () => {
    const { container } = render(<NotificationManager maxNotifications={2} />);

    // Use the notification listener directly to have more control
    const notificationListener = (notification: ErrorNotification) => {
      // This will be called by the error handler
    };

    const unsubscribe = errorHandler.onNotification(notificationListener);

    // Manually trigger notifications to test the limit
    const listeners = (errorHandler as any).notificationListeners;
    
    listeners.forEach((listener: any) => listener(mockNotification1));
    listeners.forEach((listener: any) => listener(mockNotification2));
    listeners.forEach((listener: any) => listener(mockNotification3));

    await waitFor(() => {
      // Should only show the last 2 notifications
      expect(screen.queryByTestId('notification-error-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('notification-error-2')).toBeInTheDocument();
      expect(screen.getByTestId('notification-error-3')).toBeInTheDocument();
    });

    unsubscribe();
  });

  it('removes notifications when dismissed', async () => {
    render(<NotificationManager />);

    // Manually trigger a notification
    const listeners = (errorHandler as any).notificationListeners;
    listeners.forEach((listener: any) => listener(mockNotification1));

    await waitFor(() => {
      expect(screen.getByTestId('notification-error-1')).toBeInTheDocument();
    });

    // Dismiss the notification
    const dismissButton = screen.getByText('Dismiss');
    dismissButton.click();

    await waitFor(() => {
      expect(screen.queryByTestId('notification-error-1')).not.toBeInTheDocument();
    });
  });

  it('handles different notification types', async () => {
    render(<NotificationManager />);

    // Manually trigger different types of notifications
    const listeners = (errorHandler as any).notificationListeners;
    listeners.forEach((listener: any) => listener(mockNotification1)); // error
    listeners.forEach((listener: any) => listener(mockNotification2)); // warning
    listeners.forEach((listener: any) => listener(mockNotification3)); // info

    await waitFor(() => {
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 1')).toBeInTheDocument();
      expect(screen.getByText('Info 1')).toBeInTheDocument();
    });
  });

  it('unsubscribes from error handler on unmount', () => {
    const unsubscribeSpy = jest.fn();
    
    // Mock the onNotification method to return our spy
    const originalOnNotification = errorHandler.onNotification;
    errorHandler.onNotification = jest.fn().mockReturnValue(unsubscribeSpy);

    const { unmount } = render(<NotificationManager />);

    expect(errorHandler.onNotification).toHaveBeenCalled();

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();

    // Restore original method
    errorHandler.onNotification = originalOnNotification;
  });

  it('passes correct props to ErrorNotification components', async () => {
    render(<NotificationManager />);

    // Manually trigger a notification
    const listeners = (errorHandler as any).notificationListeners;
    listeners.forEach((listener: any) => listener(mockNotification2)); // warning type

    await waitFor(() => {
      expect(screen.getByTestId('notification-error-2')).toBeInTheDocument();
    });

    // The ErrorNotification mock should receive the notification and onDismiss props
    expect(screen.getByText('Warning 1')).toBeInTheDocument();
    expect(screen.getByText('First warning message')).toBeInTheDocument();
  });

  it('maintains notification order', async () => {
    render(<NotificationManager />);

    // Manually trigger notifications in order
    const listeners = (errorHandler as any).notificationListeners;
    listeners.forEach((listener: any) => listener(mockNotification1));
    
    // Small delay to ensure order
    await new Promise(resolve => setTimeout(resolve, 10));
    listeners.forEach((listener: any) => listener(mockNotification2));

    await waitFor(() => {
      const notifications = screen.getAllByText(/Error 1|Warning 1/);
      expect(notifications).toHaveLength(2);
    });

    // Check that notifications appear in the correct order in the DOM
    const container = screen.getByTestId('notification-error-1').parentElement;
    const firstNotification = container?.firstElementChild;
    const secondNotification = container?.lastElementChild;

    expect(firstNotification).toHaveAttribute('data-testid', 'notification-error-1');
    expect(secondNotification).toHaveAttribute('data-testid', 'notification-error-2');
  });
});
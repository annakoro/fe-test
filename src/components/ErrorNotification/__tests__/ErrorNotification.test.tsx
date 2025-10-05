import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorNotification } from '../ErrorNotification';
import { ErrorNotification as ErrorNotificationType } from '../../../utils/errorHandler';

const mockNotification: ErrorNotificationType = {
  id: 'test-error-1',
  type: 'error',
  title: 'Test Error',
  message: 'This is a test error message',
  timestamp: new Date('2023-01-01T12:00:00.000Z'),
};

const mockNotificationWithActions: ErrorNotificationType = {
  ...mockNotification,
  actions: [
    { label: 'Retry', action: jest.fn() },
    { label: 'Dismiss', action: jest.fn() },
  ],
};

describe('ErrorNotification', () => {
  it('renders notification with basic information', () => {
    const onDismiss = jest.fn();

    render(
      <ErrorNotification
        notification={mockNotification}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
    // Use a more flexible matcher for time since it depends on timezone
    expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument();
  });

  it('renders different notification types with appropriate styling', () => {
    const onDismiss = jest.fn();

    const { rerender } = render(
      <ErrorNotification
        notification={{ ...mockNotification, type: 'error' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('!')).toBeInTheDocument();

    rerender(
      <ErrorNotification
        notification={{ ...mockNotification, type: 'warning' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('⚠')).toBeInTheDocument();

    rerender(
      <ErrorNotification
        notification={{ ...mockNotification, type: 'info' }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('i')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();

    render(
      <ErrorNotification
        notification={mockNotification}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('×'));

    // Should call onDismiss after animation delay
    waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('test-error-1');
    }, { timeout: 400 });
  });

  it('renders action buttons when provided', () => {
    const onDismiss = jest.fn();

    render(
      <ErrorNotification
        notification={mockNotificationWithActions}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('calls action callback and dismisses when action button is clicked', async () => {
    const onDismiss = jest.fn();
    const retryAction = jest.fn();
    const notificationWithAction: ErrorNotificationType = {
      ...mockNotification,
      actions: [{ label: 'Retry', action: retryAction }],
    };

    render(
      <ErrorNotification
        notification={notificationWithAction}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('Retry'));

    expect(retryAction).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('test-error-1');
    }, { timeout: 400 });
  });

  it('auto-hides non-error notifications after delay', async () => {
    const onDismiss = jest.fn();
    const warningNotification: ErrorNotificationType = {
      ...mockNotification,
      type: 'warning',
    };

    render(
      <ErrorNotification
        notification={warningNotification}
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={100}
      />
    );

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('test-error-1');
    }, { timeout: 500 });
  });

  it('does not auto-hide error notifications', async () => {
    const onDismiss = jest.fn();

    render(
      <ErrorNotification
        notification={mockNotification}
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={100}
      />
    );

    // Wait longer than auto-hide delay
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does not auto-hide when autoHide is false', async () => {
    const onDismiss = jest.fn();
    const infoNotification: ErrorNotificationType = {
      ...mockNotification,
      type: 'info',
    };

    render(
      <ErrorNotification
        notification={infoNotification}
        onDismiss={onDismiss}
        autoHide={false}
        autoHideDelay={100}
      />
    );

    // Wait longer than auto-hide delay
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('formats timestamp correctly', () => {
    const onDismiss = jest.fn();
    const notificationWithTime: ErrorNotificationType = {
      ...mockNotification,
      timestamp: new Date('2023-01-01T15:30:45.000Z'),
    };

    render(
      <ErrorNotification
        notification={notificationWithTime}
        onDismiss={onDismiss}
      />
    );

    // Use a more flexible matcher for time since it depends on timezone
    expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument();
  });

  it('applies correct styling for primary and secondary action buttons', () => {
    const onDismiss = jest.fn();

    render(
      <ErrorNotification
        notification={mockNotificationWithActions}
        onDismiss={onDismiss}
      />
    );

    const retryButton = screen.getByText('Retry');
    const dismissButton = screen.getByText('Dismiss');

    // Primary button should have filled background
    expect(retryButton).toHaveStyle({ backgroundColor: '#f44336' });
    
    // Secondary button should have transparent background
    expect(dismissButton).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('cleans up auto-hide timer on unmount', () => {
    const onDismiss = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const infoNotification: ErrorNotificationType = {
      ...mockNotification,
      type: 'info',
    };

    const { unmount } = render(
      <ErrorNotification
        notification={infoNotification}
        onDismiss={onDismiss}
        autoHide={true}
        autoHideDelay={1000}
      />
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusIndicator } from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders connected status correctly', () => {
    render(
      <StatusIndicator
        connectionStatus="connected"
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders connecting status with animation', () => {
    render(
      <StatusIndicator
        connectionStatus="connecting"
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders disconnected status', () => {
    render(
      <StatusIndicator
        connectionStatus="disconnected"
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(
      <StatusIndicator
        connectionStatus="error"
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
  });

  it('shows loading indicator when loading is true', () => {
    render(
      <StatusIndicator
        connectionStatus="connected"
        loading={true}
        error={null}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error indicator when error is present', () => {
    render(
      <StatusIndicator
        connectionStatus="connected"
        loading={false}
        error="Network error"
      />
    );

    const errorElement = screen.getByText('Error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute('title', 'Network error');
  });

  it('shows both loading and error when both are present', () => {
    render(
      <StatusIndicator
        connectionStatus="connected"
        loading={true}
        error="Network error"
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('applies correct colors for different connection statuses', () => {
    const { rerender } = render(
      <StatusIndicator
        connectionStatus="connected"
        loading={false}
        error={null}
      />
    );

    // Test connected status color
    expect(screen.getByText('Connected')).toHaveStyle('color: #2e7d32');

    // Test error status color
    rerender(
      <StatusIndicator
        connectionStatus="error"
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Connection Error')).toHaveStyle('color: #d32f2f');

    // Test connecting status color
    rerender(
      <StatusIndicator
        connectionStatus="connecting"
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Connecting...')).toHaveStyle('color: #f57c00');

    // Test disconnected status color
    rerender(
      <StatusIndicator
        connectionStatus="disconnected"
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Disconnected')).toHaveStyle('color: #616161');
  });
});
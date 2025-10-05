import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Component crashed" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByText('Reload Application')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} errorMessage="Test error" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      }),
      expect.any(String)
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Application Error')).not.toBeInTheDocument();
  });

  it('resets error boundary when retry button is clicked', async () => {
    let shouldThrow = true;
    
    const TestComponent: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Error should be displayed initially
    expect(screen.getByText('Application Error')).toBeInTheDocument();

    // Stop throwing errors
    shouldThrow = false;

    // Click retry button
    fireEvent.click(screen.getByText('Reload Application'));

    // Wait for reset
    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument();
    }, { timeout: 300 });
  });

  it('resets when resetKeys change', () => {
    const TestWrapper: React.FC<{ resetKey: string }> = ({ resetKey }) => (
      <ErrorBoundary resetKeys={[resetKey]}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const { rerender } = render(<TestWrapper resetKey="key1" />);

    // Error should be displayed
    expect(screen.getByText('Application Error')).toBeInTheDocument();

    // Change reset key
    rerender(<TestWrapper resetKey="key2" />);

    // Should attempt to reset (though component will throw again)
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('provides user-friendly error messages for different error types', () => {
    // Create an error with the ChunkLoadError name
    const ChunkLoadError = class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ChunkLoadError';
      }
    };

    const ThrowChunkError: React.FC = () => {
      throw new ChunkLoadError('Loading chunk failed');
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowChunkError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Loading chunk 123 failed" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Failed to load part of the application/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network Error: Failed to fetch" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Network connection issue/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="WebSocket connection failed" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Real-time connection lost/)).toBeInTheDocument();
  });

  it('logs error information in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error for logging" />
      </ErrorBoundary>
    );

    expect(console.group).toHaveBeenCalledWith(expect.stringContaining('Error Boundary Caught Error'));
    expect(console.error).toHaveBeenCalledWith('Error:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error Info:', expect.any(Object));
    expect(console.groupEnd).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('generates unique error IDs', () => {
    const onError1 = jest.fn();
    const onError2 = jest.fn();

    const { unmount } = render(
      <ErrorBoundary onError={onError1}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    unmount();

    render(
      <ErrorBoundary onError={onError2}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorId1 = onError1.mock.calls[0][2];
    const errorId2 = onError2.mock.calls[0][2];

    expect(errorId1).not.toBe(errorId2);
    expect(errorId1).toMatch(/^error_\d+_[a-z0-9]+$/);
    expect(errorId2).toMatch(/^error_\d+_[a-z0-9]+$/);
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Click retry to trigger timeout
    fireEvent.click(screen.getByText('Reload Application'));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
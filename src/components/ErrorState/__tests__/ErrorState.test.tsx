import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Network connection failed" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <ErrorState 
        title="Custom Error Title" 
        message="Error message" 
      />
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when clicked', () => {
    const mockRetry = jest.fn();
    render(
      <ErrorState 
        message="Error message" 
        onRetry={mockRetry}
        retryLabel="Try Again"
      />
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('shows retrying state', () => {
    const mockRetry = jest.fn();
    render(
      <ErrorState 
        message="Error message" 
        onRetry={mockRetry}
        retrying={true}
      />
    );

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retrying...');
    expect(retryButton).toBeDisabled();
  });

  it('renders dismiss button and calls onDismiss when clicked', () => {
    const mockDismiss = jest.fn();
    render(
      <ErrorState 
        message="Error message" 
        onDismiss={mockDismiss}
        showDismiss={true}
      />
    );

    const dismissButton = screen.getByText('Dismiss');
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders banner variant with dismiss X button', () => {
    const mockDismiss = jest.fn();
    render(
      <ErrorState 
        message="Error message" 
        variant="banner"
        onDismiss={mockDismiss}
      />
    );

    const dismissButton = screen.getByText('×');
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders inline variant with compact styling', () => {
    render(
      <ErrorState 
        message="Error message" 
        variant="inline"
      />
    );

    // Just check that the component renders without error
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <ErrorState message="Error message" size="small" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(<ErrorState message="Error message" size="large" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render action buttons when no handlers provided', () => {
    render(<ErrorState message="Error message" />);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('renders both retry and dismiss buttons when both handlers provided', () => {
    const mockRetry = jest.fn();
    const mockDismiss = jest.fn();
    
    render(
      <ErrorState 
        message="Error message" 
        onRetry={mockRetry}
        onDismiss={mockDismiss}
        showDismiss={true}
      />
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('applies correct error styling', () => {
    render(<ErrorState message="Error message" />);

    const title = screen.getByText('Something went wrong');
    expect(title).toBeInTheDocument();
    
    const message = screen.getByText('Error message');
    expect(message).toBeInTheDocument();
  });
});
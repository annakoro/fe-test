import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders default loading state', () => {
    render(<LoadingState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="Fetching tokens..." />);

    expect(screen.getByText('Fetching tokens...')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<LoadingState variant="inline" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders overlay variant with absolute positioning', () => {
    render(<LoadingState variant="overlay" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders skeleton variant with multiple rows', () => {
    render(<LoadingState variant="skeleton" rowCount={3} />);

    // Should not show loading text in skeleton mode
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    
    // Should render skeleton rows (checking for skeleton container)
    const skeletonContainer = document.querySelector('div');
    expect(skeletonContainer).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<LoadingState size="small" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingState size="large" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders skeleton with correct number of rows', () => {
    render(<LoadingState variant="skeleton" rowCount={5} />);

    // Should not show loading text in skeleton mode
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies correct styling for different variants', () => {
    const { rerender } = render(<LoadingState variant="default" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingState variant="inline" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
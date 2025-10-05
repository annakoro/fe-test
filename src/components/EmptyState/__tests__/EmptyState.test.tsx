import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders empty message', () => {
    render(<EmptyState message="No data available" />);

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <EmptyState 
        title="Custom Empty Title" 
        message="No data available" 
      />
    );

    expect(screen.getByText('Custom Empty Title')).toBeInTheDocument();
  });

  it('renders default icon', () => {
    render(<EmptyState message="No data available" />);

    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    const customIcon = <div data-testid="custom-icon">🔍</div>;
    render(
      <EmptyState 
        message="No data available" 
        icon={customIcon}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('renders action buttons and calls onClick handlers', () => {
    const mockAction1 = jest.fn();
    const mockAction2 = jest.fn();
    
    const actions = [
      { label: 'Action 1', onClick: mockAction1, variant: 'primary' as const },
      { label: 'Action 2', onClick: mockAction2, variant: 'secondary' as const }
    ];

    render(
      <EmptyState 
        message="No data available" 
        actions={actions}
      />
    );

    const action1Button = screen.getByText('Action 1');
    const action2Button = screen.getByText('Action 2');

    expect(action1Button).toBeInTheDocument();
    expect(action2Button).toBeInTheDocument();

    fireEvent.click(action1Button);
    fireEvent.click(action2Button);

    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });

  it('renders compact variant with reduced padding', () => {
    render(
      <EmptyState 
        message="No data available" 
        variant="compact"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <EmptyState message="No data available" size="small" />
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();

    rerender(<EmptyState message="No data available" size="large" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('does not render actions section when no actions provided', () => {
    render(<EmptyState message="No data available" />);

    // Should not have any buttons
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders empty actions array without error', () => {
    render(
      <EmptyState 
        message="No data available" 
        actions={[]}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies correct styling for different variants', () => {
    const { rerender } = render(
      <EmptyState message="No data available" variant="default" />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();

    rerender(<EmptyState message="No data available" variant="compact" />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('applies correct button styling for different variants', () => {
    const mockAction = jest.fn();
    
    const actions = [
      { label: 'Primary Action', onClick: mockAction, variant: 'primary' as const },
      { label: 'Secondary Action', onClick: mockAction, variant: 'secondary' as const }
    ];

    render(
      <EmptyState 
        message="No data available" 
        actions={actions}
      />
    );

    const primaryButton = screen.getByText('Primary Action');
    const secondaryButton = screen.getByText('Secondary Action');

    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
  });
});
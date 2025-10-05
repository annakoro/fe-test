import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityFilter } from '../SecurityFilter';

describe('SecurityFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and checkbox', () => {
    render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    expect(screen.getByText('Security Options')).toBeInTheDocument();
    expect(screen.getByText('Exclude honeypots')).toBeInTheDocument();
    expect(screen.getByText('Filter out tokens identified as potential honeypots')).toBeInTheDocument();
  });

  it('displays unchecked checkbox when excludeHoneypots is false', () => {
    render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('displays checked checkbox when excludeHoneypots is true', () => {
    render(<SecurityFilter excludeHoneypots={true} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onChange with true when checkbox is checked', () => {
    render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checkbox is unchecked', () => {
    render(<SecurityFilter excludeHoneypots={true} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('can be toggled multiple times', () => {
    const { rerender } = render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    
    // First click - check
    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalledWith(true);
    
    // Re-render with updated state
    rerender(<SecurityFilter excludeHoneypots={true} onChange={mockOnChange} />);
    
    // Second click - uncheck
    const updatedCheckbox = screen.getByRole('checkbox');
    fireEvent.click(updatedCheckbox);
    expect(mockOnChange).toHaveBeenCalledWith(false);
    
    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });

  it('checkbox is accessible via label click', () => {
    render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    const label = screen.getByText('Exclude honeypots');
    fireEvent.click(label);
    
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('has proper accessibility attributes', () => {
    render(<SecurityFilter excludeHoneypots={false} onChange={mockOnChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox).toHaveClass('filter-checkbox');
  });
});
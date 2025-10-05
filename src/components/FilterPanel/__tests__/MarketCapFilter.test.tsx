import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketCapFilter } from '../MarketCapFilter';

describe('MarketCapFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and preset options', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    expect(screen.getByText('Min Market Cap (USD)')).toBeInTheDocument();
    expect(screen.getByText('No minimum')).toBeInTheDocument();
    expect(screen.getByText('$1K')).toBeInTheDocument();
    expect(screen.getByText('$10K')).toBeInTheDocument();
    expect(screen.getByText('$100K')).toBeInTheDocument();
    expect(screen.getByText('$1M')).toBeInTheDocument();
    expect(screen.getByText('$10M')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('displays preset value when selected', () => {
    render(<MarketCapFilter value={1000000} onChange={mockOnChange} />);
    
    const select = screen.getByDisplayValue('$1M');
    expect(select).toBeInTheDocument();
  });

  it('shows custom input when custom is selected', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('displays formatted value when value is set', () => {
    render(<MarketCapFilter value={1500000} onChange={mockOnChange} />);
    
    expect(screen.getByText('Current: $1.5M')).toBeInTheDocument();
  });

  it('formats display values correctly', () => {
    const { rerender } = render(<MarketCapFilter value={1000} onChange={mockOnChange} />);
    expect(screen.getByText('Current: $1.0K')).toBeInTheDocument();
    
    rerender(<MarketCapFilter value={1500000} onChange={mockOnChange} />);
    expect(screen.getByText('Current: $1.5M')).toBeInTheDocument();
    
    rerender(<MarketCapFilter value={500} onChange={mockOnChange} />);
    expect(screen.getByText('Current: $500')).toBeInTheDocument();
  });

  it('calls onChange with preset value', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '100000' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(100000);
  });

  it('calls onChange with null when "No minimum" is selected', () => {
    render(<MarketCapFilter value={1000} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('handles custom input value', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    // Select custom option
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    // Enter custom value
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '50000' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(50000);
  });

  it('accepts zero as valid value', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  it('rejects negative values in custom input', () => {
    render(<MarketCapFilter value={1000} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '-500' } });
    fireEvent.blur(input);
    
    // Should reset to previous value, not call onChange with negative
    expect(mockOnChange).not.toHaveBeenCalledWith(-500);
  });

  it('handles Enter key in custom input', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '75000' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith(75000);
  });

  it('handles invalid custom input', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('switches between preset and custom modes correctly', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    
    // Select preset
    fireEvent.change(select, { target: { value: '10000' } });
    expect(mockOnChange).toHaveBeenCalledWith(10000);
    expect(screen.queryByPlaceholderText('Enter amount')).not.toBeInTheDocument();
    
    // Switch to custom
    fireEvent.change(select, { target: { value: 'custom' } });
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('handles decimal values in custom input', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '1500.50' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(1500.5);
  });

  it('does not show value display when value is null', () => {
    render(<MarketCapFilter value={null} onChange={mockOnChange} />);
    
    expect(screen.queryByText(/Current:/)).not.toBeInTheDocument();
  });
});
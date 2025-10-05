import { render, screen, fireEvent } from '@testing-library/react';
import { AgeFilter } from '../AgeFilter';

describe('AgeFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and preset options', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    expect(screen.getByText('Max Age (hours)')).toBeInTheDocument();
    expect(screen.getByText('No limit')).toBeInTheDocument();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText('6 hours')).toBeInTheDocument();
    expect(screen.getByText('24 hours')).toBeInTheDocument();
    expect(screen.getByText('1 week')).toBeInTheDocument();
    expect(screen.getByText('1 month')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('displays preset value when selected', () => {
    render(<AgeFilter value={24} onChange={mockOnChange} />);
    
    const select = screen.getByDisplayValue('24 hours');
    expect(select).toBeInTheDocument();
  });

  it('shows custom input when custom is selected', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    expect(screen.getByPlaceholderText('Hours')).toBeInTheDocument();
  });

  it('calls onChange with preset value', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '6' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with null when "No limit" is selected', () => {
    render(<AgeFilter value={24} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('handles custom input value', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    // Select custom option
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    // Enter custom value
    const input = screen.getByPlaceholderText('Hours');
    fireEvent.change(input, { target: { value: '48' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(48);
  });

  it('rejects negative values in custom input', () => {
    render(<AgeFilter value={24} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Hours');
    fireEvent.change(input, { target: { value: '-10' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).not.toHaveBeenCalledWith(-10);
  });

  it('handles Enter key in custom input', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Hours');
    fireEvent.change(input, { target: { value: '72' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith(72);
  });

  it('handles invalid custom input', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Hours');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('switches between preset and custom modes correctly', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    
    // Select preset
    fireEvent.change(select, { target: { value: '24' } });
    expect(mockOnChange).toHaveBeenCalledWith(24);
    expect(screen.queryByPlaceholderText('Hours')).not.toBeInTheDocument();
    
    // Switch to custom
    fireEvent.change(select, { target: { value: 'custom' } });
    expect(screen.getByPlaceholderText('Hours')).toBeInTheDocument();
  });

  it('accepts decimal values in custom input', () => {
    render(<AgeFilter value={null} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    const input = screen.getByPlaceholderText('Hours');
    fireEvent.change(input, { target: { value: '12.5' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(12.5);
  });
});
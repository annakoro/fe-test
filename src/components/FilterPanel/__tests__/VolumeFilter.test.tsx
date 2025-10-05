import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VolumeFilter } from '../VolumeFilter';

describe('VolumeFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and placeholder', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    expect(screen.getByLabelText('Min Volume (USD)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter minimum volume')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<VolumeFilter value={1000} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)') as HTMLInputElement;
    expect(input.value).toBe('1000');
  });

  it('displays empty string when value is null', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('calls onChange with numeric value on blur', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: '5000' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(5000);
  });

  it('calls onChange with null for empty input on blur', () => {
    render(<VolumeFilter value={1000} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with null for invalid input on blur', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('rejects negative values and resets to previous value', () => {
    render(<VolumeFilter value={1000} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '-500' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).not.toHaveBeenCalled();
    expect(input.value).toBe('1000');
  });

  it('handles Enter key press', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: '2500' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith(2500);
  });

  it('accepts zero as valid value', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  it('handles decimal values', () => {
    render(<VolumeFilter value={null} onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(input, { target: { value: '1500.50' } });
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith(1500.5);
  });

  it('updates input value when prop changes', () => {
    const { rerender } = render(<VolumeFilter value={1000} onChange={mockOnChange} />);
    
    let input = screen.getByLabelText('Min Volume (USD)') as HTMLInputElement;
    expect(input.value).toBe('1000');
    
    rerender(<VolumeFilter value={2000} onChange={mockOnChange} />);
    
    input = screen.getByLabelText('Min Volume (USD)') as HTMLInputElement;
    expect(input.value).toBe('2000');
  });
});
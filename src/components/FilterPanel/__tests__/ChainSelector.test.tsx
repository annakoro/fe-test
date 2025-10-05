import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChainSelector } from '../ChainSelector';
import { SupportedChainName } from '../../../types/api';

describe('ChainSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with all chain options', () => {
    render(<ChainSelector value={null} onChange={mockOnChange} />);
    
    expect(screen.getByLabelText('Chain')).toBeInTheDocument();
    expect(screen.getByText('All Chains')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('BSC')).toBeInTheDocument();
  });

  it('displays selected value correctly', () => {
    render(<ChainSelector value="ETH" onChange={mockOnChange} />);
    
    const select = screen.getByLabelText('Chain') as HTMLSelectElement;
    expect(select.value).toBe('ETH');
  });

  it('displays "All Chains" when value is null', () => {
    render(<ChainSelector value={null} onChange={mockOnChange} />);
    
    const select = screen.getByLabelText('Chain') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('calls onChange with selected chain', () => {
    render(<ChainSelector value={null} onChange={mockOnChange} />);
    
    const select = screen.getByLabelText('Chain');
    fireEvent.change(select, { target: { value: 'SOL' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('SOL');
  });

  it('calls onChange with null when "All Chains" is selected', () => {
    render(<ChainSelector value="ETH" onChange={mockOnChange} />);
    
    const select = screen.getByLabelText('Chain');
    fireEvent.change(select, { target: { value: '' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('handles all supported chain values', () => {
    const chains: SupportedChainName[] = ['ETH', 'SOL', 'BASE', 'BSC'];
    
    chains.forEach(chain => {
      mockOnChange.mockClear();
      render(<ChainSelector value={null} onChange={mockOnChange} />);
      
      const select = screen.getByLabelText('Chain');
      fireEvent.change(select, { target: { value: chain } });
      
      expect(mockOnChange).toHaveBeenCalledWith(chain);
    });
  });
});
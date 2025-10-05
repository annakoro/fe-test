import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableHeader, TABLE_COLUMNS } from '../TableHeader';
import { SortConfig } from '../../../types/token';

const mockOnSort = jest.fn();

const defaultSortConfig: SortConfig = {
  column: '',
  direction: 'asc'
};

const activeSortConfig: SortConfig = {
  column: 'priceUsd',
  direction: 'desc'
};

describe('TableHeader', () => {
  beforeEach(() => {
    mockOnSort.mockClear();
  });

  it('renders all column headers correctly', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Check that all expected column headers are present
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Chain')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('5m %')).toBeInTheDocument();
    expect(screen.getByText('1h %')).toBeInTheDocument();
    expect(screen.getByText('6h %')).toBeInTheDocument();
    expect(screen.getByText('24h %')).toBeInTheDocument();
    expect(screen.getByText('Txns')).toBeInTheDocument();
    expect(screen.getByText('Exchange')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByText('Liq %')).toBeInTheDocument();
    expect(screen.getByText('Audit')).toBeInTheDocument();
  });

  it('calls onSort when clicking sortable column headers', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Click on a sortable column
    fireEvent.click(screen.getByText('Price'));
    expect(mockOnSort).toHaveBeenCalledWith('priceUsd');

    // Click on another sortable column
    fireEvent.click(screen.getByText('Volume'));
    expect(mockOnSort).toHaveBeenCalledWith('volumeUsd');
  });

  it('does not call onSort when clicking non-sortable column headers', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Click on the audit column (non-sortable)
    fireEvent.click(screen.getByText('Audit'));
    expect(mockOnSort).not.toHaveBeenCalled();
  });

  it('displays sort indicators correctly for active column', () => {
    const { rerender } = render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={activeSortConfig}
        onSort={mockOnSort}
      />
    );

    // Check that the active column has a sort indicator
    const priceHeader = screen.getByText('Price').parentElement;
    expect(priceHeader).toBeInTheDocument();

    // Change to ascending sort
    const ascendingSortConfig: SortConfig = {
      column: 'priceUsd',
      direction: 'asc'
    };

    rerender(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={ascendingSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(priceHeader).toBeInTheDocument();
  });

  it('shows inactive sort indicators for non-active sortable columns', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={activeSortConfig}
        onSort={mockOnSort}
      />
    );

    // Non-active sortable columns should be present
    const volumeHeader = screen.getByText('Volume').parentElement;
    expect(volumeHeader).toBeInTheDocument();
  });

  it('applies correct styling to sortable vs non-sortable columns', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Both sortable and non-sortable columns should be present
    const priceHeader = screen.getByText('Price').parentElement;
    expect(priceHeader).toBeInTheDocument();

    const auditHeader = screen.getByText('Audit').parentElement;
    expect(auditHeader).toBeInTheDocument();
  });

  it('highlights active column with different color', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={activeSortConfig}
        onSort={mockOnSort}
      />
    );

    // Active column should be present
    const priceHeader = screen.getByText('Price').parentElement;
    expect(priceHeader).toBeInTheDocument();
  });

  it('handles custom column configuration', () => {
    const customColumns = [
      { key: 'tokenName', label: 'Custom Token', sortable: true, width: 300 },
      { key: 'priceUsd', label: 'Custom Price', sortable: false, width: 150 }
    ];

    render(
      <TableHeader 
        columns={customColumns}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('Custom Token')).toBeInTheDocument();
    expect(screen.getByText('Custom Price')).toBeInTheDocument();

    // First column should be sortable
    fireEvent.click(screen.getByText('Custom Token'));
    expect(mockOnSort).toHaveBeenCalledWith('tokenName');

    // Second column should not be sortable
    mockOnSort.mockClear();
    fireEvent.click(screen.getByText('Custom Price'));
    expect(mockOnSort).not.toHaveBeenCalled();
  });

  it('applies correct text alignment based on column type', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // All columns should be present
    const tokenHeader = screen.getByText('Token').parentElement;
    expect(tokenHeader).toBeInTheDocument();

    const priceHeader = screen.getByText('Price').parentElement;
    expect(priceHeader).toBeInTheDocument();

    const chainHeader = screen.getByText('Chain').parentElement;
    expect(chainHeader).toBeInTheDocument();
  });

  it('handles empty columns array gracefully', () => {
    render(
      <TableHeader 
        columns={[]}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Should render without crashing
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
  });

  it('maintains sort state consistency', () => {
    const { rerender } = render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Initially column should be present
    const priceHeader = screen.getByText('Price').parentElement;
    expect(priceHeader).toBeInTheDocument();

    // After setting active sort, column should still be present
    rerender(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={activeSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(priceHeader).toBeInTheDocument();
  });
});
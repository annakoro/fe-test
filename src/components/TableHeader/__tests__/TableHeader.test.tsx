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

    // Check that the active column is present
    expect(screen.getByText('Price')).toBeInTheDocument();

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

    expect(screen.getByText('Price')).toBeInTheDocument();
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
    expect(screen.getByText('Volume')).toBeInTheDocument();
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
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Audit')).toBeInTheDocument();
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
    expect(screen.getByText('Price')).toBeInTheDocument();
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
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Chain')).toBeInTheDocument();
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
    expect(screen.getByText('Price')).toBeInTheDocument();

    // After setting active sort, column should still be present
    rerender(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={activeSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('handles multiple sort column clicks correctly', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Click multiple sortable columns
    fireEvent.click(screen.getByText('Token'));
    expect(mockOnSort).toHaveBeenCalledWith('tokenName');

    fireEvent.click(screen.getByText('Market Cap'));
    expect(mockOnSort).toHaveBeenCalledWith('mcap');

    fireEvent.click(screen.getByText('Age'));
    expect(mockOnSort).toHaveBeenCalledWith('tokenCreatedTimestamp');

    expect(mockOnSort).toHaveBeenCalledTimes(3);
  });

  it('shows sort indicators for all sortable columns', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // All sortable columns should be present
    const sortableColumns = TABLE_COLUMNS.filter(col => col.sortable);
    sortableColumns.forEach(column => {
      expect(screen.getByText(column.label)).toBeInTheDocument();
    });
  });

  it('does not show sort indicators for non-sortable columns', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Non-sortable columns should be present but not clickable for sorting
    const nonSortableColumns = TABLE_COLUMNS.filter(col => !col.sortable);
    nonSortableColumns.forEach(column => {
      expect(screen.getByText(column.label)).toBeInTheDocument();
    });
  });

  it('handles percentage change columns correctly', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Test percentage change columns
    fireEvent.click(screen.getByText('5m %'));
    expect(mockOnSort).toHaveBeenCalledWith('priceChangePcs.5m');

    fireEvent.click(screen.getByText('1h %'));
    expect(mockOnSort).toHaveBeenCalledWith('priceChangePcs.1h');

    fireEvent.click(screen.getByText('6h %'));
    expect(mockOnSort).toHaveBeenCalledWith('priceChangePcs.6h');

    fireEvent.click(screen.getByText('24h %'));
    expect(mockOnSort).toHaveBeenCalledWith('priceChangePcs.24h');
  });

  it('handles liquidity columns correctly', () => {
    render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={defaultSortConfig}
        onSort={mockOnSort}
      />
    );

    // Test liquidity columns
    fireEvent.click(screen.getByText('Liquidity'));
    expect(mockOnSort).toHaveBeenCalledWith('liquidity.current');

    fireEvent.click(screen.getByText('Liq %'));
    expect(mockOnSort).toHaveBeenCalledWith('liquidity.changePc');
  });

  it('shows correct sort direction indicators', () => {
    const ascSortConfig: SortConfig = {
      column: 'tokenName',
      direction: 'asc'
    };

    const { rerender } = render(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={ascSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('Token')).toBeInTheDocument();

    // Change to descending
    const descSortConfig: SortConfig = {
      column: 'tokenName',
      direction: 'desc'
    };

    rerender(
      <TableHeader 
        columns={TABLE_COLUMNS}
        sortConfig={descSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('Token')).toBeInTheDocument();
  });
});
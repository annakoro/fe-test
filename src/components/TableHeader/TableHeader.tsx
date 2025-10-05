import React from 'react';
import styled from 'styled-components';
import { TableHeaderProps, TableColumn } from '../../types/components';
import { toggleSortDirection } from '../../utils/sortingUtils';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  font-size: 12px;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeaderCell = styled.div<{ 
  width?: number; 
  align?: 'left' | 'center' | 'right';
  $sortable?: boolean;
  $active?: boolean;
}>`
  flex: ${props => props.width ? `0 0 ${props.width}px` : '1'};
  padding: 0 8px;
  text-align: ${props => props.align || 'left'};
  cursor: ${props => props.$sortable ? 'pointer' : 'default'};
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: ${props => {
    switch (props.align) {
      case 'center': return 'center';
      case 'right': return 'flex-end';
      default: return 'flex-start';
    }
  }};
  
  ${props => props.$sortable && `
    &:hover {
      background-color: #e9ecef;
      border-radius: 4px;
    }
  `}
  
  ${props => props.$active && `
    color: #007bff;
  `}
`;

const SortIcon = styled.span<{ direction: 'asc' | 'desc' | null }>`
  margin-left: 4px;
  font-size: 10px;
  opacity: ${props => props.direction ? 1 : 0.3};
  transition: opacity 0.2s ease;
  
  &::after {
    content: ${props => {
      if (props.direction === 'asc') return '"▲"';
      if (props.direction === 'desc') return '"▼"';
      return '"▲"';
    }};
  }
`;

// Define the table columns with their properties
export const TABLE_COLUMNS: TableColumn[] = [
  { key: 'tokenName', label: 'Token', sortable: true, width: 200 },
  { key: 'chain', label: 'Chain', sortable: true, width: 80 },
  { key: 'priceUsd', label: 'Price', sortable: true, width: 120 },
  { key: 'mcap', label: 'Market Cap', sortable: true, width: 100 },
  { key: 'volumeUsd', label: 'Volume', sortable: true, width: 100 },
  { key: 'priceChangePcs.5m', label: '5m %', sortable: true, width: 80 },
  { key: 'priceChangePcs.1h', label: '1h %', sortable: true, width: 80 },
  { key: 'priceChangePcs.6h', label: '6h %', sortable: true, width: 80 },
  { key: 'priceChangePcs.24h', label: '24h %', sortable: true, width: 80 },
  { key: 'transactions', label: 'Txns', sortable: true, width: 80 },
  { key: 'exchange', label: 'Exchange', sortable: true, width: 100 },
  { key: 'tokenCreatedTimestamp', label: 'Age', sortable: true, width: 60 },
  { key: 'liquidity.current', label: 'Liquidity', sortable: true, width: 100 },
  { key: 'liquidity.changePc', label: 'Liq %', sortable: true, width: 80 },
  { key: 'audit', label: 'Audit', sortable: false, width: 60 },
];

// Columns that should default to descending sort
export const DEFAULT_DESC_COLUMNS = [
  'priceUsd', 'mcap', 'volumeUsd', 'transactions', 'tokenCreatedTimestamp', 'liquidity.current'
];

export const TableHeader: React.FC<TableHeaderProps> = ({ 
  columns = TABLE_COLUMNS, 
  sortConfig, 
  onSort 
}) => {
  const handleSort = (columnKey: string, sortable: boolean) => {
    if (!sortable) return;
    
    // Calculate the new sort configuration
    const newSortConfig = toggleSortDirection(sortConfig, columnKey);
    onSort(newSortConfig.column);
  };

  const getSortDirection = (columnKey: string): 'asc' | 'desc' | null => {
    if (sortConfig.column === columnKey) {
      return sortConfig.direction;
    }
    return null;
  };

  const getAlignment = (columnKey: string): 'left' | 'center' | 'right' => {
    // Numeric columns should be right-aligned
    const rightAlignColumns = [
      'priceUsd', 'mcap', 'volumeUsd', 'priceChangePcs.5m', 'priceChangePcs.1h', 
      'priceChangePcs.6h', 'priceChangePcs.24h', 'liquidity.current', 'liquidity.changePc'
    ];
    
    // Center-aligned columns
    const centerAlignColumns = ['chain', 'transactions', 'tokenCreatedTimestamp', 'audit'];
    
    if (rightAlignColumns.includes(columnKey)) return 'right';
    if (centerAlignColumns.includes(columnKey)) return 'center';
    return 'left';
  };

  return (
    <HeaderContainer>
      {columns.map((column) => (
        <HeaderCell
          key={column.key}
          width={column.width}
          align={getAlignment(column.key)}
          $sortable={column.sortable}
          $active={sortConfig.column === column.key}
          onClick={() => handleSort(column.key, column.sortable)}
        >
          {column.label}
          {column.sortable && (
            <SortIcon direction={getSortDirection(column.key)} />
          )}
        </HeaderCell>
      ))}
    </HeaderContainer>
  );
};

export default TableHeader;
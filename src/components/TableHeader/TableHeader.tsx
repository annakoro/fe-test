import React from 'react';
import { TableHeaderProps, TableColumn } from '../../types/components';
import { toggleSortDirection } from '../../utils/sortingUtils';
import '../../styles/table.css';

// Define responsive column visibility classes
const getColumnClasses = (columnKey: string): string => {
  const baseClass = `crypto-table-header-cell crypto-table-col-${getColumnType(columnKey)}`;
  
  switch (columnKey) {
    case 'chain':
      return `${baseClass} hide-sm`;
    case 'mcap':
    case 'volumeUsd':
    case 'transactions':
      return `${baseClass} hide-md`;
    case 'priceChangePcs.5m':
    case 'priceChangePcs.1h':
    case 'priceChangePcs.6h':
    case 'exchange':
    case 'liquidity.current':
    case 'liquidity.changePc':
      return `${baseClass} hide-lg`;
    default:
      return baseClass;
  }
};

const getColumnType = (columnKey: string): string => {
  if (columnKey === 'tokenName') return 'token';
  if (columnKey === 'chain') return 'chain';
  if (columnKey === 'priceUsd') return 'price';
  if (columnKey === 'mcap') return 'mcap';
  if (columnKey === 'volumeUsd') return 'volume';
  if (columnKey.includes('priceChangePcs') || columnKey.includes('changePc')) return 'change';
  if (columnKey === 'transactions') return 'txns';
  if (columnKey === 'exchange') return 'exchange';
  if (columnKey === 'tokenCreatedTimestamp') return 'age';
  if (columnKey.includes('liquidity')) return 'liquidity';
  if (columnKey === 'audit') return 'audit';
  return 'change';
};

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
    <div className="crypto-table-header" role="row">
      {columns.map((column) => {
          const isActive = sortConfig.column === column.key;
          const sortDirection = getSortDirection(column.key);
          const alignment = getAlignment(column.key);
          
          return (
            <div
              key={column.key}
              className={`${getColumnClasses(column.key)} align-${alignment} ${column.sortable ? 'sortable' : ''} ${isActive ? 'active' : ''}`}
              role="columnheader"
              tabIndex={column.sortable ? 0 : -1}
              onClick={() => handleSort(column.key, column.sortable)}
              onKeyDown={(e) => {
                if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSort(column.key, column.sortable);
                }
              }}
              aria-sort={
                isActive 
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : column.sortable ? 'none' : undefined
              }
              aria-label={
                column.sortable 
                  ? `Sort by ${column.label} ${isActive ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`
                  : column.label
              }
            >
              {column.label}
              {column.sortable && (
                <span 
                  className={`crypto-table-sort-icon ${isActive ? 'active' : ''}`}
                  aria-hidden="true"
                >
                  {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '▲'}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default TableHeader;
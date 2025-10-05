// Sorting Utilities for Token Data

import { TokenData, SortConfig } from '../types';

export type SortableColumnKey = 
  | 'tokenName'
  | 'tokenSymbol'
  | 'chain'
  | 'priceUsd'
  | 'mcap'
  | 'volumeUsd'
  | 'priceChangePcs.5m'
  | 'priceChangePcs.1h'
  | 'priceChangePcs.6h'
  | 'priceChangePcs.24h'
  | 'transactions.buys'
  | 'transactions.sells'
  | 'transactions'
  | 'exchange'
  | 'tokenCreatedTimestamp'
  | 'liquidity.current'
  | 'liquidity.changePc';

/**
 * Get nested property value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return null;
    return current[key];
  }, obj);
}

/**
 * Get sortable value for a token based on column key
 */
export function getSortableValue(token: TokenData, columnKey: string): any {
  switch (columnKey) {
    case 'tokenName':
      return token.tokenName?.toLowerCase() || '';
    
    case 'tokenSymbol':
      return token.tokenSymbol?.toLowerCase() || '';
    
    case 'chain':
      return token.chain?.toLowerCase() || '';
    
    case 'priceUsd':
      return token.priceUsd || 0;
    
    case 'mcap':
      return token.mcap || 0;
    
    case 'volumeUsd':
      return token.volumeUsd || 0;
    
    case 'priceChangePcs.5m':
      return token.priceChangePcs?.['5m'] || 0;
    
    case 'priceChangePcs.1h':
      return token.priceChangePcs?.['1h'] || 0;
    
    case 'priceChangePcs.6h':
      return token.priceChangePcs?.['6h'] || 0;
    
    case 'priceChangePcs.24h':
      return token.priceChangePcs?.['24h'] || 0;
    
    case 'transactions':
    case 'transactions.buys':
      return token.transactions?.buys || 0;
    
    case 'transactions.sells':
      return token.transactions?.sells || 0;
    
    case 'exchange':
      return token.exchange?.toLowerCase() || '';
    
    case 'tokenCreatedTimestamp':
      return token.tokenCreatedTimestamp ? new Date(token.tokenCreatedTimestamp).getTime() : 0;
    
    case 'liquidity.current':
      return token.liquidity?.current || 0;
    
    case 'liquidity.changePc':
      return token.liquidity?.changePc || 0;
    
    default:
      // Fallback for nested properties
      return getNestedValue(token, columnKey) || 0;
  }
}

/**
 * Compare two values for sorting
 */
function compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
  // Handle null/undefined values
  if (a === null || a === undefined) a = '';
  if (b === null || b === undefined) b = '';
  
  // Handle different data types
  if (typeof a === 'string' && typeof b === 'string') {
    const result = a.localeCompare(b);
    return direction === 'asc' ? result : -result;
  }
  
  if (typeof a === 'number' && typeof b === 'number') {
    const result = a - b;
    return direction === 'asc' ? result : -result;
  }
  
  // Convert to strings for mixed types
  const aStr = String(a);
  const bStr = String(b);
  const result = aStr.localeCompare(bStr);
  return direction === 'asc' ? result : -result;
}

/**
 * Sort tokens array based on sort configuration
 */
export function sortTokens(tokens: TokenData[], sortConfig: SortConfig): TokenData[] {
  if (!sortConfig.column) {
    return tokens;
  }

  return [...tokens].sort((a, b) => {
    const aValue = getSortableValue(a, sortConfig.column);
    const bValue = getSortableValue(b, sortConfig.column);
    
    return compareValues(aValue, bValue, sortConfig.direction);
  });
}

/**
 * Sort tokens with special handling for new tokens table
 * New tokens maintain age-based primary sorting but allow secondary sorting
 */
export function sortNewTokens(tokens: TokenData[], sortConfig: SortConfig): TokenData[] {
  if (!sortConfig.column) {
    return tokens;
  }

  // If sorting by age (primary sort), use normal sorting
  if (sortConfig.column === 'tokenCreatedTimestamp') {
    return sortTokens(tokens, sortConfig);
  }

  // For other columns, sort by the selected column but maintain age as secondary sort
  return [...tokens].sort((a, b) => {
    const aValue = getSortableValue(a, sortConfig.column);
    const bValue = getSortableValue(b, sortConfig.column);
    
    const primaryResult = compareValues(aValue, bValue, sortConfig.direction);
    
    // If primary values are equal, sort by age (newest first)
    if (primaryResult === 0) {
      const aAge = getSortableValue(a, 'tokenCreatedTimestamp');
      const bAge = getSortableValue(b, 'tokenCreatedTimestamp');
      return compareValues(aAge, bAge, 'desc'); // Always newest first for secondary sort
    }
    
    return primaryResult;
  });
}

/**
 * Toggle sort direction for a column
 */
export function toggleSortDirection(currentConfig: SortConfig, columnKey: string): SortConfig {
  if (currentConfig.column === columnKey) {
    // Same column, toggle direction
    return {
      column: columnKey,
      direction: currentConfig.direction === 'asc' ? 'desc' : 'asc',
    };
  } else {
    // Different column, start with appropriate default direction
    const defaultDescColumns = [
      'priceUsd', 'mcap', 'volumeUsd', 'transactions', 'transactions.buys', 
      'transactions.sells', 'liquidity.current', 'tokenCreatedTimestamp'
    ];
    
    return {
      column: columnKey,
      direction: defaultDescColumns.includes(columnKey) ? 'desc' : 'asc',
    };
  }
}

/**
 * Validate if a column key is sortable
 */
export function isSortableColumn(columnKey: string): boolean {
  const sortableColumns: SortableColumnKey[] = [
    'tokenName', 'tokenSymbol', 'chain', 'priceUsd', 'mcap', 'volumeUsd',
    'priceChangePcs.5m', 'priceChangePcs.1h', 'priceChangePcs.6h', 'priceChangePcs.24h',
    'transactions', 'transactions.buys', 'transactions.sells', 'exchange',
    'tokenCreatedTimestamp', 'liquidity.current', 'liquidity.changePc'
  ];
  
  return sortableColumns.includes(columnKey as SortableColumnKey);
}
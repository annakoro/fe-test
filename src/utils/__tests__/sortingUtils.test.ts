// Sorting Utils Tests

import {
  getSortableValue,
  sortTokens,
  sortNewTokens,
  toggleSortDirection,
  isSortableColumn,
} from '../sortingUtils';
import { TokenData, SortConfig } from '../../types';

// Mock token data for testing
const createMockToken = (overrides: Partial<TokenData> = {}): TokenData => ({
  id: 'test-token-1',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: '0x123',
  pairAddress: '0x456',
  chain: 'ETH',
  exchange: 'Uniswap',
  priceUsd: 1.5,
  volumeUsd: 10000,
  mcap: 1500000,
  priceChangePcs: {
    '5m': 2.5,
    '1h': -1.2,
    '6h': 5.8,
    '24h': -3.4,
  },
  transactions: {
    buys: 45,
    sells: 23,
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
  },
  tokenCreatedTimestamp: new Date('2024-01-15T10:30:00Z'),
  liquidity: {
    current: 50000,
    changePc: 12.5,
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed',
  ...overrides,
});

describe('getSortableValue', () => {
  const mockToken = createMockToken();

  test('should return correct values for string fields', () => {
    expect(getSortableValue(mockToken, 'tokenName')).toBe('test token');
    expect(getSortableValue(mockToken, 'tokenSymbol')).toBe('test');
    expect(getSortableValue(mockToken, 'chain')).toBe('eth');
    expect(getSortableValue(mockToken, 'exchange')).toBe('uniswap');
  });

  test('should return correct values for numeric fields', () => {
    expect(getSortableValue(mockToken, 'priceUsd')).toBe(1.5);
    expect(getSortableValue(mockToken, 'volumeUsd')).toBe(10000);
    expect(getSortableValue(mockToken, 'mcap')).toBe(1500000);
  });

  test('should return correct values for nested fields', () => {
    expect(getSortableValue(mockToken, 'priceChangePcs.5m')).toBe(2.5);
    expect(getSortableValue(mockToken, 'priceChangePcs.1h')).toBe(-1.2);
    expect(getSortableValue(mockToken, 'transactions.buys')).toBe(45);
    expect(getSortableValue(mockToken, 'transactions.sells')).toBe(23);
    expect(getSortableValue(mockToken, 'liquidity.current')).toBe(50000);
    expect(getSortableValue(mockToken, 'liquidity.changePc')).toBe(12.5);
  });

  test('should return timestamp for date fields', () => {
    const timestamp = getSortableValue(mockToken, 'tokenCreatedTimestamp');
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBe(new Date('2024-01-15T10:30:00Z').getTime());
  });

  test('should handle transactions field as buys', () => {
    expect(getSortableValue(mockToken, 'transactions')).toBe(45);
  });

  test('should return fallback values for missing data', () => {
    const emptyToken = createMockToken({
      tokenName: undefined as any,
      priceUsd: undefined as any,
      priceChangePcs: undefined as any,
    });

    expect(getSortableValue(emptyToken, 'tokenName')).toBe('');
    expect(getSortableValue(emptyToken, 'priceUsd')).toBe(0);
    expect(getSortableValue(emptyToken, 'priceChangePcs.5m')).toBe(0);
  });
});

describe('sortTokens', () => {
  const tokens: TokenData[] = [
    createMockToken({
      id: '1',
      tokenName: 'Alpha Token',
      priceUsd: 10,
      volumeUsd: 5000,
      tokenCreatedTimestamp: new Date('2024-01-10T00:00:00Z'),
    }),
    createMockToken({
      id: '2',
      tokenName: 'Beta Token',
      priceUsd: 5,
      volumeUsd: 15000,
      tokenCreatedTimestamp: new Date('2024-01-15T00:00:00Z'),
    }),
    createMockToken({
      id: '3',
      tokenName: 'Gamma Token',
      priceUsd: 20,
      volumeUsd: 8000,
      tokenCreatedTimestamp: new Date('2024-01-12T00:00:00Z'),
    }),
  ];

  test('should sort by token name ascending', () => {
    const sortConfig: SortConfig = { column: 'tokenName', direction: 'asc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    expect(sorted[0].tokenName).toBe('Alpha Token');
    expect(sorted[1].tokenName).toBe('Beta Token');
    expect(sorted[2].tokenName).toBe('Gamma Token');
  });

  test('should sort by token name descending', () => {
    const sortConfig: SortConfig = { column: 'tokenName', direction: 'desc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    expect(sorted[0].tokenName).toBe('Gamma Token');
    expect(sorted[1].tokenName).toBe('Beta Token');
    expect(sorted[2].tokenName).toBe('Alpha Token');
  });

  test('should sort by price ascending', () => {
    const sortConfig: SortConfig = { column: 'priceUsd', direction: 'asc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    expect(sorted[0].priceUsd).toBe(5);
    expect(sorted[1].priceUsd).toBe(10);
    expect(sorted[2].priceUsd).toBe(20);
  });

  test('should sort by volume descending', () => {
    const sortConfig: SortConfig = { column: 'volumeUsd', direction: 'desc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    expect(sorted[0].volumeUsd).toBe(15000);
    expect(sorted[1].volumeUsd).toBe(8000);
    expect(sorted[2].volumeUsd).toBe(5000);
  });

  test('should sort by timestamp (age) descending', () => {
    const sortConfig: SortConfig = { column: 'tokenCreatedTimestamp', direction: 'desc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    // Newest first (2024-01-15, 2024-01-12, 2024-01-10)
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  test('should return original array when no sort column specified', () => {
    const sortConfig: SortConfig = { column: '', direction: 'asc' };
    const sorted = sortTokens(tokens, sortConfig);
    
    expect(sorted).toEqual(tokens);
  });

  test('should not mutate original array', () => {
    const originalTokens = [...tokens];
    const sortConfig: SortConfig = { column: 'priceUsd', direction: 'desc' };
    
    sortTokens(tokens, sortConfig);
    
    expect(tokens).toEqual(originalTokens);
  });
});

describe('sortNewTokens', () => {
  const tokens: TokenData[] = [
    createMockToken({
      id: '1',
      tokenName: 'Alpha Token',
      priceUsd: 10,
      volumeUsd: 5000,
      tokenCreatedTimestamp: new Date('2024-01-10T00:00:00Z'),
    }),
    createMockToken({
      id: '2',
      tokenName: 'Beta Token',
      priceUsd: 5,
      volumeUsd: 15000,
      tokenCreatedTimestamp: new Date('2024-01-15T00:00:00Z'),
    }),
    createMockToken({
      id: '3',
      tokenName: 'Gamma Token',
      priceUsd: 20,
      volumeUsd: 8000,
      tokenCreatedTimestamp: new Date('2024-01-12T00:00:00Z'),
    }),
  ];

  test('should sort by age when tokenCreatedTimestamp is selected', () => {
    const sortConfig: SortConfig = { column: 'tokenCreatedTimestamp', direction: 'desc' };
    const sorted = sortNewTokens(tokens, sortConfig);
    
    // Should behave like normal sorting for age
    expect(sorted[0].id).toBe('2'); // Newest
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1'); // Oldest
  });

  test('should sort by volume with age as secondary sort', () => {
    const sortConfig: SortConfig = { column: 'volumeUsd', direction: 'desc' };
    const sorted = sortNewTokens(tokens, sortConfig);
    
    // Primary sort by volume: Beta (15000), Gamma (8000), Alpha (5000)
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  test('should use age as secondary sort when primary values are equal', () => {
    const tokensWithSameVolume: TokenData[] = [
      createMockToken({
        id: '1',
        volumeUsd: 10000,
        tokenCreatedTimestamp: new Date('2024-01-10T00:00:00Z'),
      }),
      createMockToken({
        id: '2',
        volumeUsd: 10000,
        tokenCreatedTimestamp: new Date('2024-01-15T00:00:00Z'),
      }),
      createMockToken({
        id: '3',
        volumeUsd: 10000,
        tokenCreatedTimestamp: new Date('2024-01-12T00:00:00Z'),
      }),
    ];

    const sortConfig: SortConfig = { column: 'volumeUsd', direction: 'desc' };
    const sorted = sortNewTokens(tokensWithSameVolume, sortConfig);
    
    // Since volumes are equal, should sort by age (newest first)
    expect(sorted[0].id).toBe('2'); // 2024-01-15
    expect(sorted[1].id).toBe('3'); // 2024-01-12
    expect(sorted[2].id).toBe('1'); // 2024-01-10
  });
});

describe('toggleSortDirection', () => {
  test('should toggle direction for same column', () => {
    const currentConfig: SortConfig = { column: 'priceUsd', direction: 'asc' };
    const newConfig = toggleSortDirection(currentConfig, 'priceUsd');
    
    expect(newConfig.column).toBe('priceUsd');
    expect(newConfig.direction).toBe('desc');
  });

  test('should toggle back to asc', () => {
    const currentConfig: SortConfig = { column: 'priceUsd', direction: 'desc' };
    const newConfig = toggleSortDirection(currentConfig, 'priceUsd');
    
    expect(newConfig.column).toBe('priceUsd');
    expect(newConfig.direction).toBe('asc');
  });

  test('should start with desc for numeric columns', () => {
    const currentConfig: SortConfig = { column: 'tokenName', direction: 'asc' };
    const newConfig = toggleSortDirection(currentConfig, 'priceUsd');
    
    expect(newConfig.column).toBe('priceUsd');
    expect(newConfig.direction).toBe('desc');
  });

  test('should start with asc for text columns', () => {
    const currentConfig: SortConfig = { column: 'priceUsd', direction: 'desc' };
    const newConfig = toggleSortDirection(currentConfig, 'tokenName');
    
    expect(newConfig.column).toBe('tokenName');
    expect(newConfig.direction).toBe('asc');
  });

  test('should handle default desc columns correctly', () => {
    const currentConfig: SortConfig = { column: 'tokenName', direction: 'asc' };
    
    const numericColumns = ['mcap', 'volumeUsd', 'transactions', 'liquidity.current', 'tokenCreatedTimestamp'];
    
    numericColumns.forEach(column => {
      const newConfig = toggleSortDirection(currentConfig, column);
      expect(newConfig.direction).toBe('desc');
    });
  });
});

describe('isSortableColumn', () => {
  test('should return true for sortable columns', () => {
    const sortableColumns = [
      'tokenName',
      'tokenSymbol',
      'chain',
      'priceUsd',
      'mcap',
      'volumeUsd',
      'priceChangePcs.5m',
      'priceChangePcs.1h',
      'priceChangePcs.6h',
      'priceChangePcs.24h',
      'transactions',
      'transactions.buys',
      'transactions.sells',
      'exchange',
      'tokenCreatedTimestamp',
      'liquidity.current',
      'liquidity.changePc',
    ];

    sortableColumns.forEach(column => {
      expect(isSortableColumn(column)).toBe(true);
    });
  });

  test('should return false for non-sortable columns', () => {
    const nonSortableColumns = [
      'audit',
      'id',
      'tokenAddress',
      'pairAddress',
      'lastUpdated',
      'subscriptionStatus',
      'invalidColumn',
    ];

    nonSortableColumns.forEach(column => {
      expect(isSortableColumn(column)).toBe(false);
    });
  });
});
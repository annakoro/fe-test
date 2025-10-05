import { TokenData, ScannerApiResponse, ScannerResult } from '../../types';

export const mockTokenData: TokenData = {
  id: 'test-token-id',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: '0x123456789abcdef',
  pairAddress: '0x987654321fedcba',
  chain: 'ETH',
  exchange: 'Uniswap V2',
  priceUsd: 1.0,
  volumeUsd: 10000,
  mcap: 1000000,
  priceChangePcs: {
    '5m': 0.5,
    '1h': 1.0,
    '6h': 2.0,
    '24h': 5.0,
  },
  transactions: {
    buys: 10,
    sells: 5,
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
  },
  tokenCreatedTimestamp: '2024-01-01T00:00:00Z',
  liquidity: {
    current: 50000,
    changePc: 10.0,
  },
  lastUpdated: new Date().toISOString(),
  subscriptionStatus: 'subscribed',
};

export const mockScannerResult: ScannerResult = {
  pairAddress: '0x987654321fedcba',
  token1Name: 'Test Token',
  token1Symbol: 'TEST',
  token1Address: '0x123456789abcdef',
  chainId: 1,
  routerAddress: 'Uniswap V2',
  price: '1.0',
  volume: '10000',
  currentMcap: '1000000',
  initialMcap: '900000',
  pairMcapUsd: '1100000',
  pairMcapUsdInitial: '950000',
  diff5M: '0.5',
  diff1H: '1.0',
  diff6H: '2.0',
  diff24H: '5.0',
  buys: 10,
  sells: 5,
  isMintAuthDisabled: true,
  isFreezeAuthDisabled: true,
  honeyPot: false,
  contractVerified: true,
  age: '2024-01-01T00:00:00Z',
  liquidity: '50000',
  percentChangeInLiquidity: '10.0',
  token1TotalSupplyFormatted: '1000000',
};

export const mockScannerApiResponse: ScannerApiResponse = {
  results: [mockScannerResult],
  pagination: {
    page: 0,
    limit: 50,
    total: 1,
    hasMore: false,
  },
};

export const createMockTokenData = (overrides: Partial<TokenData> = {}): TokenData => ({
  ...mockTokenData,
  ...overrides,
});

export const createMockScannerResult = (overrides: Partial<ScannerResult> = {}): ScannerResult => ({
  ...mockScannerResult,
  ...overrides,
});

export const createMockTokenArray = (count: number): TokenData[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTokenData({
      id: `token-${index}`,
      tokenName: `Token ${index}`,
      tokenSymbol: `TK${index}`,
      tokenAddress: `0x${index.toString(16).padStart(40, '0')}`,
      pairAddress: `0x${(index + 1000).toString(16).padStart(40, '0')}`,
      priceUsd: Math.random() * 10,
      volumeUsd: Math.random() * 100000,
      mcap: Math.random() * 10000000,
    })
  );
};

// Mock WebSocket messages
export const createMockTickMessage = (pairAddress: string, price: number) => ({
  type: 'tick' as const,
  payload: {
    pairAddress,
    priceToken1Usd: price,
    isOutlier: false,
    timestamp: new Date().toISOString(),
  },
});

export const createMockPairStatsMessage = (pairAddress: string, overrides = {}) => ({
  type: 'pair-stats' as const,
  payload: {
    pairAddress,
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true,
    ...overrides,
  },
});

export const createMockScannerPairsMessage = (tableType: 'trending' | 'new', pairs: string[]) => ({
  type: 'scanner-pairs' as const,
  payload: {
    tableType,
    pairs,
  },
});

// Test helpers for async operations
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock implementations for services
export const createMockWebSocketService = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  onMessage: jest.fn(),
  removeMessageCallback: jest.fn(),
  cleanup: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue('connected' as const),
});

export const createMockApiService = () => ({
  fetchScannerData: jest.fn().mockResolvedValue(mockScannerApiResponse),
  retryWithBackoff: jest.fn(),
});
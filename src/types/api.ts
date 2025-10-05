// API Types based on Dexcelerate API specifications

export type SupportedChainName = 'ETH' | 'SOL' | 'BASE' | 'BSC';

export interface ScannerResult {
  pairAddress: string;
  token1Name: string;
  token1Symbol: string;
  token1Address: string;
  chainId: number;
  routerAddress: string;
  price: string;
  volume: string;
  currentMcap: string;
  initialMcap: string;
  pairMcapUsd: string;
  pairMcapUsdInitial: string;
  diff5M: string;
  diff1H: string;
  diff6H: string;
  diff24H: string;
  buys?: number;
  sells?: number;
  isMintAuthDisabled: boolean;
  isFreezeAuthDisabled: boolean;
  honeyPot?: boolean;
  contractVerified: boolean;
  age: string; // ISO timestamp
  liquidity: string;
  percentChangeInLiquidity: string;
  token1TotalSupplyFormatted: string;
}

export interface ScannerApiResponse {
  results: ScannerResult[];
  hasMore: boolean;
  page: number;
}

export interface GetScannerResultParams {
  chain?: SupportedChainName;
  minVolume?: number;
  maxAge?: number;
  minMarketCap?: number;
  excludeHoneypots?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
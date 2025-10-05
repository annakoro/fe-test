// Token Data Types

import { SupportedChainName } from './api';

export interface TokenData {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  pairAddress: string;
  chain: SupportedChainName;
  exchange: string;
  priceUsd: number;
  volumeUsd: number;
  mcap: number;
  priceChangePcs: {
    "5m": number;
    "1h": number;
    "6h": number;
    "24h": number;
  };
  transactions: {
    buys: number;
    sells: number;
  };
  audit: {
    mintable: boolean;
    freezable: boolean;
    honeypot: boolean;
    contractVerified: boolean;
  };
  tokenCreatedTimestamp: Date;
  liquidity: {
    current: number;
    changePc: number;
  };
  // Internal tracking fields
  lastUpdated: Date;
  subscriptionStatus: 'pending' | 'subscribed' | 'error';
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableState {
  tokens: Record<string, TokenData>;
  sortConfig: SortConfig;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface FilterState {
  chain: SupportedChainName | null;
  minVolume: number | null;
  maxAge: number | null;
  minMarketCap: number | null;
  excludeHoneypots: boolean;
}
// Redux State Types

import { TokenData, SortConfig, FilterState } from '../types';

export interface TokensState {
  tokens: Record<string, TokenData>;
  sortConfig: SortConfig;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  lastUpdated: Date | null;
}

export interface WebSocketState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscriptions: Set<string>;
  reconnectAttempts: number;
  lastError: string | null;
}

export interface AppState {
  trendingTokens: TokensState;
  newTokens: TokensState;
  filters: FilterState;
  webSocket: WebSocketState;
}

// Action payload types
export interface UpdateTokensPayload {
  tokens: TokenData[];
  replace?: boolean;
}

export interface UpdateTokenPricePayload {
  tokenId: string;
  priceUsd: number;
  mcap: number;
  timestamp: Date;
}

export interface UpdateTokenAuditPayload {
  tokenId: string;
  audit: Partial<TokenData['audit']>;
  timestamp: Date;
}

export interface SetSortConfigPayload {
  column: string;
  direction: 'asc' | 'desc';
}

export interface SetLoadingPayload {
  loading: boolean;
}

export interface SetErrorPayload {
  error: string | null;
}

export interface SetPagePayload {
  page: number;
  hasMore: boolean;
}
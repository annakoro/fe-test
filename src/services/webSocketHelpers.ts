import { OutgoingWebSocketMessage } from '../types';

/**
 * Helper functions for creating WebSocket subscription messages
 */

export interface ScannerFilterParams {
  chain?: string;
  minVolume?: number;
  maxAge?: number;
  minMarketCap?: number;
  excludeHoneypots?: boolean;
  tableType?: 'trending' | 'new';
}

export interface PairStatsParams {
  pairAddress: string;
}

export interface PairSubscriptionParams {
  pairAddress: string;
}

/**
 * Creates a scanner-filter subscription message
 */
export function createScannerFilterSubscription(params: ScannerFilterParams): OutgoingWebSocketMessage {
  return {
    type: 'scanner-filter',
    payload: params
  };
}

/**
 * Creates a pair-stats subscription message
 */
export function createPairStatsSubscription(params: PairStatsParams): OutgoingWebSocketMessage {
  return {
    type: 'pair-stats',
    payload: params
  };
}

/**
 * Creates a pair subscription message for real-time price updates
 */
export function createPairSubscription(params: PairSubscriptionParams): OutgoingWebSocketMessage {
  return {
    type: 'pair',
    payload: params
  };
}

/**
 * Creates multiple pair subscriptions for a list of pair addresses
 */
export function createMultiplePairSubscriptions(pairAddresses: string[]): OutgoingWebSocketMessage[] {
  return pairAddresses.map(pairAddress => createPairSubscription({ pairAddress }));
}

/**
 * Creates unsubscription messages (same format as subscription but used for unsubscribing)
 */
export const createScannerFilterUnsubscription = createScannerFilterSubscription;
export const createPairStatsUnsubscription = createPairStatsSubscription;
export const createPairUnsubscription = createPairSubscription;
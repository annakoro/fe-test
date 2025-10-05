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
    type: 'subscribe',
    payload: {
      room: 'scanner-filter',
      params
    }
  };
}

/**
 * Creates a pair-stats subscription message
 */
export function createPairStatsSubscription(params: PairStatsParams): OutgoingWebSocketMessage {
  return {
    type: 'subscribe',
    payload: {
      room: 'pair-stats',
      params
    }
  };
}

/**
 * Creates a pair subscription message for real-time price updates
 */
export function createPairSubscription(params: PairSubscriptionParams): OutgoingWebSocketMessage {
  return {
    type: 'subscribe',
    payload: {
      room: 'pair',
      params
    }
  };
}

/**
 * Creates multiple pair subscriptions for a list of pair addresses
 */
export function createMultiplePairSubscriptions(pairAddresses: string[]): OutgoingWebSocketMessage[] {
  return pairAddresses.map(pairAddress => createPairSubscription({ pairAddress }));
}

/**
 * Creates unsubscription messages
 */
export function createScannerFilterUnsubscription(params: ScannerFilterParams): OutgoingWebSocketMessage {
  return {
    type: 'unsubscribe',
    payload: {
      room: 'scanner-filter',
      params
    }
  };
}

export function createPairStatsUnsubscription(params: PairStatsParams): OutgoingWebSocketMessage {
  return {
    type: 'unsubscribe',
    payload: {
      room: 'pair-stats',
      params
    }
  };
}

export function createPairUnsubscription(params: PairSubscriptionParams): OutgoingWebSocketMessage {
  return {
    type: 'unsubscribe',
    payload: {
      room: 'pair',
      params
    }
  };
}
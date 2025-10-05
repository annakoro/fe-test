// WebSocket Types for real-time updates

export interface OutgoingWebSocketMessage {
  type: 'subscribe' | 'unsubscribe';
  payload: {
    room: 'scanner-filter' | 'pair-stats' | 'pair';
    params?: any;
  };
}

export interface IncomingWebSocketMessage {
  type: 'tick' | 'pair-stats' | 'scanner-pairs';
  payload: TickEventPayload | PairStatsMsgData | ScannerPairsEventPayload;
}

export interface TickEventPayload {
  pairAddress: string;
  priceToken1Usd: number;
  isOutlier: boolean;
  timestamp: string;
}

export interface PairStatsMsgData {
  pairAddress: string;
  mintable: boolean;
  freezable: boolean;
  honeypot: boolean;
  contractVerified: boolean;
}

export interface ScannerPairsEventPayload {
  pairs: string[]; // Array of pair addresses
  tableType: 'trending' | 'new';
}

export type WebSocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
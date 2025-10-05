// Service Interface Types

import { GetScannerResultParams, ScannerApiResponse } from './api';
import { OutgoingWebSocketMessage, IncomingWebSocketMessage, WebSocketConnectionStatus } from './websocket';

export interface ApiService {
  fetchScannerData(params: GetScannerResultParams): Promise<ScannerApiResponse>;
  retryWithBackoff<T>(operation: () => Promise<T>, maxRetries: number): Promise<T>;
}

export interface WebSocketService {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(message: OutgoingWebSocketMessage): void;
  unsubscribe(message: OutgoingWebSocketMessage): void;
  onMessage(callback: (message: IncomingWebSocketMessage) => void): void;
  getConnectionStatus(): WebSocketConnectionStatus;
}

export interface UpdateHandlers {
  handleTickEvent(event: any): void;
  handlePairStatsEvent(event: any): void;
  handleScannerPairsEvent(event: any): void;
}

export interface ErrorRecovery {
  retryApiCall(params: GetScannerResultParams, attempt: number): Promise<void>;
  reconnectWebSocket(delay: number): Promise<void>;
  resetTableState(tableType: 'trending' | 'new'): void;
  showErrorToast(message: string, action?: () => void): void;
}